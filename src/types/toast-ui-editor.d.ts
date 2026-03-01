declare module "@toast-ui/editor" {
	export type EditorMode = "markdown" | "wysiwyg";
	export type PreviewStyle = "vertical" | "tab";
	export type ToolbarItem =
		| string
		| {
				name: string;
				tooltip?: string;
				command?: string;
				className?: string;
			};

	export interface EditorOptions {
		el: HTMLElement;
		height?: string;
		initialEditType?: EditorMode;
		previewStyle?: PreviewStyle;
		usageStatistics?: boolean;
		placeholder?: string;
		initialValue?: string;
		toolbarItems?: Array<ToolbarItem[] | ToolbarItem>;
	}

	export class Editor {
		constructor(options: EditorOptions);
		getMarkdown(): string;
		setMarkdown(markdown: string): void;
		on(eventName: string, handler: (...args: unknown[]) => void): void;
		destroy(): void;
	}
}
