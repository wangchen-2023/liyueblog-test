<script lang="ts">
import {
	getDeveloperModeEnabled,
	setDeveloperModeEnabled,
} from "@utils/setting-utils";
import { onMount, tick } from "svelte";
import "@toast-ui/editor/dist/toastui-editor.css";

const DRAFT_KEY = "dev-editor-draft-v1";
const AUTO_SAVE_INTERVAL = 12000;
const DEV_EDITOR_CODE_STORAGE_KEY = "devEditorCode";

type EditorInstance = {
	getMarkdown: () => string;
	setMarkdown: (content: string) => void;
	on: (event: string, handler: () => void) => void;
	destroy: () => void;
};

let editorHost: HTMLDivElement | null = null;
let editor: EditorInstance | null = null;
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;

let title = "";
let slug = "";
let description = "";
let tags = "";
let category = "";
let image = "";
let draft = false;

let isLocked = true;
let isSubmitting = false;
let statusText = "等待输入";
let notice = "";
let noticeType: "info" | "success" | "error" = "info";
let dirty = false;
let userTouchedSlug = false;
let editorInitError = "";

function getStoredDevCode(): string {
	return localStorage.getItem(DEV_EDITOR_CODE_STORAGE_KEY) || "";
}

function resetDeveloperSession(): void {
	localStorage.removeItem(DEV_EDITOR_CODE_STORAGE_KEY);
	setDeveloperModeEnabled(false);
}

function showNotice(
	message: string,
	type: "info" | "success" | "error" = "info",
) {
	notice = message;
	noticeType = type;
	setTimeout(() => {
		if (notice === message) {
			notice = "";
		}
	}, 2800);
}

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function buildDraftPayload() {
	return {
		title,
		slug,
		description,
		tags,
		category,
		image,
		draft,
		content: editor ? editor.getMarkdown() : "",
		timestamp: Date.now(),
	};
}

function persistDraft(silent = false) {
	if (!editor) return;
	const payload = buildDraftPayload();
	localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
	dirty = false;
	statusText = `已自动保存 ${new Date().toLocaleTimeString()}`;
	if (!silent) {
		showNotice("草稿已自动保存", "success");
	}
}

function tryLoadDraft() {
	const raw = localStorage.getItem(DRAFT_KEY);
	if (!raw) return;
	try {
		const payload = JSON.parse(raw) as ReturnType<typeof buildDraftPayload>;
		title = payload.title || "";
		slug = payload.slug || "";
		description = payload.description || "";
		tags = payload.tags || "";
		category = payload.category || "";
		image = payload.image || "";
		draft = Boolean(payload.draft);
		if (payload.content && editor) {
			editor.setMarkdown(payload.content);
		}
		statusText = "已加载本地草稿";
	} catch {
		statusText = "草稿损坏，已忽略";
	}
}

async function publishPost() {
	if (isSubmitting) return;
	if (!editor) {
		showNotice("编辑器还没加载完成，请稍等", "error");
		return;
	}
	if (!getDeveloperModeEnabled()) {
		showNotice("开发者模式未解锁", "error");
		return;
	}
	const devCode = getStoredDevCode();
	if (!devCode) {
		showNotice("缺少开发者口令，请重新解锁开发者模式", "error");
		return;
	}
	const content = editor.getMarkdown().trim();
	if (!title.trim()) {
		showNotice("标题不能为空", "error");
		return;
	}
	if (!content) {
		showNotice("正文不能为空", "error");
		return;
	}

	isSubmitting = true;
	statusText = "正在发布...";
	try {
		const response = await fetch("/api/dev/publish", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				title,
				slug,
				description,
				tags,
				category,
				image,
				draft,
				content,
				devCode,
			}),
		});

		const result = (await response.json().catch(() => ({}))) as {
			ok?: boolean;
			message?: string;
			path?: string;
			commitUrl?: string;
			deployed?: boolean;
		};
		if (!response.ok || !result.ok) {
			throw new Error(result.message || "发布失败");
		}
		statusText = "发布成功，等待部署";
		dirty = false;
		localStorage.removeItem(DRAFT_KEY);
		showNotice(`发布成功：${result.path || "新文章"}`, "success");
		setTimeout(() => {
			window.location.href = "/";
		}, 900);
	} catch (error) {
		const message = error instanceof Error ? error.message : "发布失败";
		statusText = "发布失败";
		showNotice(message, "error");
	} finally {
		isSubmitting = false;
	}
}

$: if (title && !userTouchedSlug) {
	slug = slugify(title);
}

onMount(() => {
	let disposed = false;
	const handleDeveloperModeChange = (event: Event) => {
		const enabled = Boolean((event as CustomEvent<boolean>).detail);
		if (enabled && isLocked) {
			window.location.reload();
		}
	};
	window.addEventListener(
		"developer-mode-change",
		handleDeveloperModeChange as EventListener,
	);

	const init = async () => {
		isLocked = !getDeveloperModeEnabled();
		if (isLocked) {
			return;
		}
		await tick();
		if (!editorHost) {
			editorInitError = "编辑器容器加载失败";
			showNotice(editorInitError, "error");
			statusText = "编辑器加载失败";
			return;
		}

		try {
			const editorModule = await import("@toast-ui/editor");
			if (disposed || !editorHost) {
				return;
			}
			const Editor = editorModule.Editor;
			editor = new Editor({
				el: editorHost,
				height: "68vh",
				initialEditType: "markdown",
				previewStyle: "vertical",
				usageStatistics: false,
				placeholder: "在这里写下你的文章...",
				toolbarItems: [
					["heading", "bold", "italic", "strike"],
					["hr", "quote"],
					["ul", "ol", "task", "indent", "outdent"],
					["table", "link", "image"],
					["code", "codeblock"],
				],
			}) as EditorInstance;
			editorInitError = "";
			statusText = "编辑器已就绪";
			tryLoadDraft();
			editor.on("change", () => {
				dirty = true;
				statusText = "编辑中...";
			});

			autoSaveTimer = setInterval(() => {
				if (dirty) {
					persistDraft(true);
				}
			}, AUTO_SAVE_INTERVAL);
		} catch (error) {
			editorInitError =
				error instanceof Error ? error.message : "编辑器初始化失败";
			statusText = "编辑器初始化失败";
			showNotice(editorInitError, "error");
		}
	};

	void init();

	return () => {
		disposed = true;
		window.removeEventListener(
			"developer-mode-change",
			handleDeveloperModeChange as EventListener,
		);
		resetDeveloperSession();
		if (autoSaveTimer) {
			clearInterval(autoSaveTimer);
		}
		if (editor) {
			editor.destroy();
			editor = null;
		}
	};
});
</script>

<div class="editor-shell card-base p-4 md:p-6 rounded-[var(--radius-large)]">
	<div class="editor-top">
		<div>
			<h1 class="text-xl font-bold text-[var(--btn-content)]">文章编辑器</h1>
			<p class="text-sm text-neutral-400 mt-1">支持完整 Markdown，自动保存草稿</p>
		</div>
		<button class="submit-btn" on:click={publishPost} disabled={isSubmitting || isLocked}>
			{isSubmitting ? "提交中..." : "提交发布"}
		</button>
	</div>

	{#if isLocked}
		<div class="locked-tip">开发者模式未开启，请在背景设置面板输入口令并回车解锁。</div>
	{:else}
		<div class="meta-grid">
			<input class="meta-input" type="text" placeholder="标题" bind:value={title} />
			<input
				class="meta-input"
				type="text"
				placeholder="Slug（留空自动生成）"
				bind:value={slug}
				on:input={() => {
					userTouchedSlug = true;
				}}
			/>
			<input class="meta-input" type="text" placeholder="描述" bind:value={description} />
			<input class="meta-input" type="text" placeholder="标签（逗号分隔）" bind:value={tags} />
			<input class="meta-input" type="text" placeholder="分类（可选）" bind:value={category} />
			<input class="meta-input" type="text" placeholder="封面图 URL（可选）" bind:value={image} />
		</div>
		<label class="draft-toggle">
			<input type="checkbox" bind:checked={draft} />
			<span>设为草稿（不会在首页展示）</span>
		</label>
		<div bind:this={editorHost} class="editor-host">
			{#if !editor && !editorInitError}
				<div class="editor-loading">编辑器加载中...</div>
			{/if}
			{#if !editor && editorInitError}
				<div class="editor-error">{editorInitError}</div>
			{/if}
		</div>
		<div class="editor-foot">
			<span>{statusText}</span>
			<button class="save-btn" on:click={() => persistDraft()} disabled={!editor}>立即保存</button>
		</div>
	{/if}

	{#if notice}
		<div class={`notice ${noticeType}`}>{notice}</div>
	{/if}
</div>

<style lang="stylus">
.editor-shell
  color var(--btn-content)

.editor-top
  display flex
  justify-content space-between
  align-items flex-start
  gap 1rem
  margin-bottom 1rem

.submit-btn
  border 1px solid var(--primary)
  background var(--btn-regular-bg)
  color var(--btn-content)
  border-radius 10px
  padding 0.55rem 1rem
  font-weight 700
  transition all 0.2s ease
  &:hover
    transform translateY(-1px)
  &:disabled
    opacity 0.45
    cursor not-allowed

.locked-tip
  margin-top 0.5rem
  border 1px dashed var(--primary)
  border-radius 0.9rem
  padding 1rem
  color var(--btn-content)

.meta-grid
  display grid
  grid-template-columns repeat(2, minmax(0, 1fr))
  gap 0.75rem
  margin-bottom 0.75rem

.meta-input
  width 100%
  height 2.45rem
  border-radius 0.65rem
  padding 0 0.75rem
  background var(--btn-regular-bg)
  border 1px solid transparent
  color var(--btn-content)
  outline none
  &:focus
    border-color var(--primary)

.draft-toggle
  display inline-flex
  align-items center
  gap 0.45rem
  font-size 0.88rem
  margin-bottom 0.8rem

.editor-host
  border 1px solid var(--btn-regular-bg-hover)
  border-radius 0.9rem
  overflow hidden
  min-height 24rem
  position relative

.editor-loading
  position absolute
  inset 0
  display flex
  align-items center
  justify-content center
  color rgba(148, 163, 184, 0.9)
  font-size 0.95rem
  pointer-events none

.editor-error
  position absolute
  inset 0
  display flex
  align-items center
  justify-content center
  color rgba(248, 113, 113, 0.95)
  font-size 0.95rem
  padding 1rem
  text-align center

.editor-foot
  margin-top 0.75rem
  display flex
  align-items center
  justify-content space-between
  font-size 0.86rem
  color var(--btn-content)

.save-btn
  border 1px solid var(--primary)
  background transparent
  border-radius 0.55rem
  padding 0.35rem 0.7rem

.notice
  margin-top 0.75rem
  border-radius 0.65rem
  padding 0.55rem 0.75rem
  font-size 0.88rem

.notice.info
  background rgba(71, 85, 105, 0.25)

.notice.success
  background rgba(22, 163, 74, 0.2)

.notice.error
  background rgba(239, 68, 68, 0.2)

:global(.toastui-editor-defaultUI)
  border none !important
  background transparent

:global(.toastui-editor-defaultUI-toolbar)
  background var(--btn-regular-bg) !important
  border-bottom 1px solid var(--btn-regular-bg-hover) !important

:global(.toastui-editor-md-container)
  background var(--card-bg) !important

:global(.toastui-editor-md-tab-container)
  background transparent !important
  border-bottom 1px solid var(--btn-regular-bg-hover) !important

:global(.toastui-editor-contents)
  color var(--btn-content) !important

:global(.toastui-editor-toolbar-icons)
  border-radius 8px

@media (max-width: 860px)
  .meta-grid
    grid-template-columns 1fr

  .editor-top
    flex-direction column
    align-items flex-start
</style>
