/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable, DisposableStore } from 'vs/base/common/lifecycle';
import { assign } from 'vs/base/common/objects';
import { URI } from 'vs/base/common/uri';
import { IWindowsService, OpenContext, IEnterWorkspaceResult, IOpenSettings, IURIToOpen } from 'vs/platform/windows/common/windows';
import { IEnvironmentService, ParsedArgs } from 'vs/platform/environment/common/environment';
import { crashReporter, app, Menu, MessageBoxReturnValue, SaveDialogReturnValue, OpenDialogReturnValue, CrashReporterStartOptions, BrowserWindow, MessageBoxOptions, SaveDialogOptions, OpenDialogOptions } from 'electron';
import { Event } from 'vs/base/common/event';
import { IURLService, IURLHandler } from 'vs/platform/url/common/url';
import { IWindowsMainService, ISharedProcess, ICodeWindow } from 'vs/platform/windows/electron-main/windows';
import { IRecentlyOpened, IRecent } from 'vs/platform/history/common/history';
import { IHistoryMainService } from 'vs/platform/history/electron-main/historyMainService';
import { IWorkspaceIdentifier, ISingleFolderWorkspaceIdentifier } from 'vs/platform/workspaces/common/workspaces';
import { ISerializableCommandAction } from 'vs/platform/actions/common/actions';
import { Schemas } from 'vs/base/common/network';
import { isMacintosh, IProcessEnvironment } from 'vs/base/common/platform';
import { ILogService } from 'vs/platform/log/common/log';

// @deprecated this should eventually go away and be implemented by host & electron service
export class LegacyWindowsMainService extends Disposable implements IWindowsService, IURLHandler {

	_serviceBrand: undefined;

	private readonly disposables = this._register(new DisposableStore());

	private _activeWindowId: number | undefined;

	readonly onWindowOpen: Event<number> = Event.filter(Event.fromNodeEventEmitter(app, 'browser-window-created', (_, w: BrowserWindow) => w.id), id => !!this.windowsMainService.getWindowById(id));
	readonly onWindowBlur: Event<number> = Event.filter(Event.fromNodeEventEmitter(app, 'browser-window-blur', (_, w: BrowserWindow) => w.id), id => !!this.windowsMainService.getWindowById(id));
	readonly onWindowMaximize: Event<number> = Event.filter(Event.fromNodeEventEmitter(app, 'browser-window-maximize', (_, w: BrowserWindow) => w.id), id => !!this.windowsMainService.getWindowById(id));
	readonly onWindowUnmaximize: Event<number> = Event.filter(Event.fromNodeEventEmitter(app, 'browser-window-unmaximize', (_, w: BrowserWindow) => w.id), id => !!this.windowsMainService.getWindowById(id));
	readonly onWindowFocus: Event<number> = Event.any(
		Event.map(Event.filter(Event.map(this.windowsMainService.onWindowsCountChanged, () => this.windowsMainService.getLastActiveWindow()), w => !!w), w => w!.id),
		Event.filter(Event.fromNodeEventEmitter(app, 'browser-window-focus', (_, w: BrowserWindow) => w.id), id => !!this.windowsMainService.getWindowById(id))
	);

	readonly onRecentlyOpenedChange: Event<void> = this.historyMainService.onRecentlyOpenedChange;

	constructor(
		private sharedProcess: ISharedProcess,
		@IWindowsMainService private readonly windowsMainService: IWindowsMainService,
		@IEnvironmentService private readonly environmentService: IEnvironmentService,
		@IURLService urlService: IURLService,
		@IHistoryMainService private readonly historyMainService: IHistoryMainService,
		@ILogService private readonly logService: ILogService
	) {
		super();

		urlService.registerHandler(this);

		// remember last active window id
		Event.latch(Event.any(this.onWindowOpen, this.onWindowFocus))
			(id => this._activeWindowId = id, null, this.disposables);
	}

	async showMessageBox(windowId: number, options: MessageBoxOptions): Promise<MessageBoxReturnValue> {
		this.logService.trace('windowsService#showMessageBox', windowId);

		return this.withWindow(windowId, codeWindow => this.windowsMainService.showMessageBox(options, codeWindow), () => this.windowsMainService.showMessageBox(options))!;
	}

	async showSaveDialog(windowId: number, options: SaveDialogOptions): Promise<SaveDialogReturnValue> {
		this.logService.trace('windowsService#showSaveDialog', windowId);

		return this.withWindow(windowId, codeWindow => this.windowsMainService.showSaveDialog(options, codeWindow), () => this.windowsMainService.showSaveDialog(options))!;
	}

	async showOpenDialog(windowId: number, options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
		this.logService.trace('windowsService#showOpenDialog', windowId);

		return this.withWindow(windowId, codeWindow => this.windowsMainService.showOpenDialog(options, codeWindow), () => this.windowsMainService.showOpenDialog(options))!;
	}

	async updateTouchBar(windowId: number, items: ISerializableCommandAction[][]): Promise<void> {
		this.logService.trace('windowsService#updateTouchBar', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.updateTouchBar(items));
	}

	async closeWorkspace(windowId: number): Promise<void> {
		this.logService.trace('windowsService#closeWorkspace', windowId);

		return this.withWindow(windowId, codeWindow => this.windowsMainService.closeWorkspace(codeWindow));
	}

	async enterWorkspace(windowId: number, path: URI): Promise<IEnterWorkspaceResult | undefined> {
		this.logService.trace('windowsService#enterWorkspace', windowId);

		return this.withWindow(windowId, codeWindow => this.windowsMainService.enterWorkspace(codeWindow, path));
	}

	async addRecentlyOpened(recents: IRecent[]): Promise<void> {
		this.logService.trace('windowsService#addRecentlyOpened');
		this.historyMainService.addRecentlyOpened(recents);
	}

	async removeFromRecentlyOpened(paths: URI[]): Promise<void> {
		this.logService.trace('windowsService#removeFromRecentlyOpened');

		this.historyMainService.removeFromRecentlyOpened(paths);
	}

	async clearRecentlyOpened(): Promise<void> {
		this.logService.trace('windowsService#clearRecentlyOpened');

		this.historyMainService.clearRecentlyOpened();
	}

	async getRecentlyOpened(windowId: number): Promise<IRecentlyOpened> {
		this.logService.trace('windowsService#getRecentlyOpened', windowId);

		return this.withWindow(windowId, codeWindow => this.historyMainService.getRecentlyOpened(codeWindow.config.workspace, codeWindow.config.folderUri, codeWindow.config.filesToOpenOrCreate), () => this.historyMainService.getRecentlyOpened())!;
	}

	async newWindowTab(): Promise<void> {
		this.logService.trace('windowsService#newWindowTab');

		this.windowsMainService.openNewTabbedWindow(OpenContext.API);
	}

	async showPreviousWindowTab(): Promise<void> {
		this.logService.trace('windowsService#showPreviousWindowTab');

		Menu.sendActionToFirstResponder('selectPreviousTab:');
	}

	async showNextWindowTab(): Promise<void> {
		this.logService.trace('windowsService#showNextWindowTab');

		Menu.sendActionToFirstResponder('selectNextTab:');
	}

	async moveWindowTabToNewWindow(): Promise<void> {
		this.logService.trace('windowsService#moveWindowTabToNewWindow');

		Menu.sendActionToFirstResponder('moveTabToNewWindow:');
	}

	async mergeAllWindowTabs(): Promise<void> {
		this.logService.trace('windowsService#mergeAllWindowTabs');

		Menu.sendActionToFirstResponder('mergeAllWindows:');
	}

	async toggleWindowTabsBar(): Promise<void> {
		this.logService.trace('windowsService#toggleWindowTabsBar');

		Menu.sendActionToFirstResponder('toggleTabBar:');
	}

	async focusWindow(windowId: number): Promise<void> {
		this.logService.trace('windowsService#focusWindow', windowId);

		if (isMacintosh) {
			return this.withWindow(windowId, codeWindow => codeWindow.win.show());
		} else {
			return this.withWindow(windowId, codeWindow => codeWindow.win.focus());
		}
	}

	async closeWindow(windowId: number): Promise<void> {
		this.logService.trace('windowsService#closeWindow', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.win.close());
	}

	async isFocused(windowId: number): Promise<boolean> {
		this.logService.trace('windowsService#isFocused', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.win.isFocused(), () => false)!;
	}

	async isMaximized(windowId: number): Promise<boolean> {
		this.logService.trace('windowsService#isMaximized', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.win.isMaximized(), () => false)!;
	}

	async maximizeWindow(windowId: number): Promise<void> {
		this.logService.trace('windowsService#maximizeWindow', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.win.maximize());
	}

	async unmaximizeWindow(windowId: number): Promise<void> {
		this.logService.trace('windowsService#unmaximizeWindow', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.win.unmaximize());
	}

	async minimizeWindow(windowId: number): Promise<void> {
		this.logService.trace('windowsService#minimizeWindow', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.win.minimize());
	}

	async onWindowTitleDoubleClick(windowId: number): Promise<void> {
		this.logService.trace('windowsService#onWindowTitleDoubleClick', windowId);

		return this.withWindow(windowId, codeWindow => codeWindow.onWindowTitleDoubleClick());
	}

	async openWindow(windowId: number, urisToOpen: IURIToOpen[], options: IOpenSettings): Promise<void> {
		this.logService.trace('windowsService#openWindow');
		if (!urisToOpen || !urisToOpen.length) {
			return undefined;
		}

		this.windowsMainService.open({
			context: OpenContext.API,
			contextWindowId: windowId,
			urisToOpen: urisToOpen,
			cli: options.args ? { ...this.environmentService.args, ...options.args } : this.environmentService.args,
			forceNewWindow: options.forceNewWindow,
			forceReuseWindow: options.forceReuseWindow,
			diffMode: options.diffMode,
			addMode: options.addMode,
			gotoLineMode: options.gotoLineMode,
			noRecentEntry: options.noRecentEntry,
			waitMarkerFileURI: options.waitMarkerFileURI
		});
	}

	async openExtensionDevelopmentHostWindow(args: ParsedArgs, env: IProcessEnvironment): Promise<void> {
		this.logService.trace('windowsService#openExtensionDevelopmentHostWindow ' + JSON.stringify(args));

		const extDevPaths = args.extensionDevelopmentPath;
		if (extDevPaths) {
			this.windowsMainService.openExtensionDevelopmentHostWindow(extDevPaths, {
				context: OpenContext.API,
				cli: args,
				userEnv: Object.keys(env).length > 0 ? env : undefined
			});
		}
	}

	async getWindows(): Promise<{ id: number; workspace?: IWorkspaceIdentifier; folderUri?: ISingleFolderWorkspaceIdentifier; title: string; filename?: string; }[]> {
		this.logService.trace('windowsService#getWindows');

		const windows = this.windowsMainService.getWindows();

		return windows.map(window => ({
			id: window.id,
			workspace: window.openedWorkspace,
			folderUri: window.openedFolderUri,
			title: window.win.getTitle(),
			filename: window.getRepresentedFilename()
		}));
	}

	async getWindowCount(): Promise<number> {
		this.logService.trace('windowsService#getWindowCount');

		return this.windowsMainService.getWindows().length;
	}

	async getActiveWindowId(): Promise<number | undefined> {
		return this._activeWindowId;
	}

	async openExternal(url: string): Promise<boolean> {
		return this.windowsMainService.openExternal(url);
	}

	async startCrashReporter(config: CrashReporterStartOptions): Promise<void> {
		this.logService.trace('windowsService#startCrashReporter');

		crashReporter.start(config);
	}

	async quit(): Promise<void> {
		this.logService.trace('windowsService#quit');

		this.windowsMainService.quit();
	}

	async whenSharedProcessReady(): Promise<void> {
		this.logService.trace('windowsService#whenSharedProcessReady');

		return this.sharedProcess.whenReady();
	}

	async toggleSharedProcess(): Promise<void> {
		this.logService.trace('windowsService#toggleSharedProcess');

		this.sharedProcess.toggle();

	}

	async handleURL(uri: URI): Promise<boolean> {

		// Catch file URLs
		if (uri.authority === Schemas.file && !!uri.path) {
			this.openFileForURI({ fileUri: URI.file(uri.fsPath) }); // using fsPath on a non-file URI...
			return true;
		}

		return false;
	}

	private openFileForURI(uri: IURIToOpen): void {
		const cli = assign(Object.create(null), this.environmentService.args);
		const urisToOpen = [uri];

		this.windowsMainService.open({ context: OpenContext.API, cli, urisToOpen, gotoLineMode: true });
	}

	private withWindow<T>(windowId: number, fn: (window: ICodeWindow) => T, fallback?: () => T): T | undefined {
		const codeWindow = this.windowsMainService.getWindowById(windowId);
		if (codeWindow) {
			return fn(codeWindow);
		}

		if (fallback) {
			return fallback();
		}

		return undefined;
	}
}
