import type { APIRoute } from "astro";

export const prerender = false;

type PublishRequest = {
	title?: string;
	slug?: string;
	description?: string;
	tags?: string[] | string;
	category?: string;
	image?: string;
	draft?: boolean;
	content?: string;
	devCode?: string;
};

function json(status: number, payload: Record<string, unknown>) {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
	});
}

async function parsePublishRequest(request: Request): Promise<PublishRequest> {
	const raw = await request.text();
	if (!raw) return {};
	try {
		return JSON.parse(raw) as PublishRequest;
	} catch {
		const params = new URLSearchParams(raw);
		return {
			title: params.get("title") || "",
			slug: params.get("slug") || "",
			description: params.get("description") || "",
			tags: params.get("tags") || "",
			category: params.get("category") || "",
			image: params.get("image") || "",
			draft: params.get("draft") === "true",
			content: params.get("content") || "",
			devCode: params.get("devCode") || "",
		};
	}
}

function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

function toYamlString(input: string): string {
	return `"${input.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseTags(input: string[] | string | undefined): string[] {
	if (!input) return [];
	if (Array.isArray(input)) {
		return input.map((item) => item.trim()).filter(Boolean);
	}
	return input
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function normalizeImage(input: string): string {
	const value = input.trim();
	if (!value) return "";
	if (
		value.startsWith("http://") ||
		value.startsWith("https://") ||
		value.startsWith("/") ||
		value.startsWith("data:")
	) {
		return value;
	}
	// Allow relative local image paths such as cover.png / folder/cover.webp
	if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(value)) {
		return value;
	}
	// Invalid image input should not break the build.
	return "";
}

function buildMarkdown(payload: {
	title: string;
	description: string;
	image: string;
	tags: string[];
	category: string;
	draft: boolean;
	content: string;
}): string {
	const published = new Date().toISOString().slice(0, 10);
	const tagLines = payload.tags.length
		? payload.tags.map((tag) => `  - ${toYamlString(tag)}`).join("\n")
		: "  - \"\"";

	return `---
title: ${toYamlString(payload.title)}
published: ${published}
description: ${toYamlString(payload.description)}
image: ${toYamlString(payload.image)}
tags:
${tagLines}
category: ${toYamlString(payload.category)}
draft: ${payload.draft ? "true" : "false"}
---

${payload.content.trim()}\n`;
}

export const POST: APIRoute = async ({ request }) => {
	const githubToken = import.meta.env.GITHUB_TOKEN;
	const githubOwner = import.meta.env.GITHUB_OWNER;
	const githubRepo = import.meta.env.GITHUB_REPO;
	const githubBranch = import.meta.env.GITHUB_BRANCH || "main";
	const vercelDeployHook = import.meta.env.VERCEL_DEPLOY_HOOK_URL;
	const expectedCode = import.meta.env.DEV_EDITOR_CODE || "1234";

	if (!githubToken || !githubOwner || !githubRepo) {
		return json(500, {
			ok: false,
			message:
				"缺少发布环境变量：GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO",
		});
	}

	let body: PublishRequest;
	try {
		body = await parsePublishRequest(request);
	} catch {
		return json(400, { ok: false, message: "请求体不是有效 JSON" });
	}

	if ((body.devCode || "") !== expectedCode) {
		return json(403, { ok: false, message: "开发者口令校验失败" });
	}

	const title = (body.title || "").trim();
	const content = (body.content || "").trim();
	if (!title) {
		return json(400, { ok: false, message: "标题不能为空" });
	}
	if (!content) {
		return json(400, { ok: false, message: "正文不能为空" });
	}

	const slugBase = (body.slug || "").trim() || title;
	let slug = slugify(slugBase);
	if (!slug) {
		slug = `post-${Date.now()}`;
	}

	const markdown = buildMarkdown({
		title,
		description: (body.description || "").trim(),
		image: normalizeImage(body.image || ""),
		tags: parseTags(body.tags),
		category: (body.category || "").trim(),
		draft: Boolean(body.draft),
		content,
	});

	const path = `src/content/posts/${slug}.md`;
	const encodedContent = Buffer.from(markdown, "utf8").toString("base64");
	const githubBase = `https://api.github.com/repos/${githubOwner}/${githubRepo}`;
	const commonHeaders = {
		Accept: "application/vnd.github+json",
		Authorization: `Bearer ${githubToken}`,
		"X-GitHub-Api-Version": "2022-11-28",
	};

	let sha: string | undefined;
	const existingFileResponse = await fetch(
		`${githubBase}/contents/${path}?ref=${githubBranch}`,
		{
			headers: commonHeaders,
		},
	);
	if (existingFileResponse.ok) {
		const existing = (await existingFileResponse.json()) as { sha?: string };
		sha = existing.sha;
	} else if (existingFileResponse.status !== 404) {
		const errText = await existingFileResponse.text();
		return json(502, {
			ok: false,
			message: `读取 GitHub 文件失败: ${existingFileResponse.status} ${errText}`,
		});
	}

	const commitMessage = `${sha ? "chore" : "feat"}(post): publish ${slug}`;
	const publishResponse = await fetch(`${githubBase}/contents/${path}`, {
		method: "PUT",
		headers: {
			...commonHeaders,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			message: commitMessage,
			content: encodedContent,
			branch: githubBranch,
			sha,
		}),
	});

	if (!publishResponse.ok) {
		const errText = await publishResponse.text();
		return json(502, {
			ok: false,
			message: `提交 GitHub 失败: ${publishResponse.status} ${errText}`,
		});
	}

	const publishResult = (await publishResponse.json()) as {
		commit?: { html_url?: string };
	};

	let deployed = false;
	if (vercelDeployHook) {
		const deployResponse = await fetch(vercelDeployHook, { method: "POST" });
		deployed = deployResponse.ok;
	}

	return json(200, {
		ok: true,
		path,
		slug,
		commitUrl: publishResult.commit?.html_url || "",
		deployed,
	});
};

export const GET: APIRoute = async () => {
	return json(200, {
		ok: true,
		message: "Use POST to publish markdown content.",
	});
};
