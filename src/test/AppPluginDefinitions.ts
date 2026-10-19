export const Platform = {
	isDesktop: true,
	isMobile: false,
	isIosApp: false,
	isAndroidApp: false,
	isMacOS: false,
	isWin: false,
	isLinux: true,
	isSafari: false,
};

export class App {}
export class TFile {}
export class TFolder {}
export class TAbstractFile {}
export class AbstractInputSuggest<T> {
	app: App;
	constructor(..._args: unknown[]) {
		this.app = (_args[0] as App) ?? new App();
	}
}
export class Notice {}
export class Plugin {}
export class SettingTab {}
export class PluginSettingTab {}
export class SettingPage {}
export class MarkdownRenderChild {}
export class Modal {}
export class Editor {}
export class MarkdownView {}
export type MarkdownFileInfo = unknown;

/** Overridden per test. The default fails the request the way a missing network call does. */
export async function requestUrl(): Promise<{ status: number; headers: Record<string, string>; json: unknown; text: string }> {
	throw new Error('requestUrl is not stubbed in tests');
}
