/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWindowsMainService } from 'vs/platform/windows/electron-main/windows';
import { MessageBoxOptions, MessageBoxReturnValue, shell, OpenDevToolsOptions, SaveDialogOptions, SaveDialogReturnValue, OpenDialogOptions, OpenDialogReturnValue } from 'electron';
import { ILifecycleMainService } from 'vs/platform/lifecycle/electron-main/lifecycleMainService';
import { OpenContext, INativeOpenDialogOptions } from 'vs/platform/windows/common/windows';
import { isMacintosh } from 'vs/base/common/platform';

export class ElectronMainService {

	_serviceBrand: undefined;

	constructor(
		@IWindowsMainService private readonly windowsMainService: IWindowsMainService,
		@ILifecycleMainService private readonly lifecycleMainService: ILifecycleMainService
	) {
	}

	//#region Window

	async windowCount(windowId: number): Promise<number> {
		return this.windowsMainService.getWindowCount();
	}

	async openEmptyWindow(windowId: number, options?: { reuse?: boolean, remoteAuthority?: string }): Promise<void> {
		this.windowsMainService.openEmptyWindow(OpenContext.API, options);
	}

	async toggleFullScreen(windowId: number): Promise<void> {
		const window = this.windowsMainService.getWindowById(windowId);
		if (window) {
			window.toggleFullScreen();
		}
	}

	//#endregion

	//#region Dialog

	async showMessageBox(windowId: number, options: MessageBoxOptions): Promise<MessageBoxReturnValue> {
		return this.windowsMainService.showMessageBox(options, this.windowsMainService.getWindowById(windowId));
	}

	async showSaveDialog(windowId: number, options: SaveDialogOptions): Promise<SaveDialogReturnValue> {
		return this.windowsMainService.showSaveDialog(options, this.windowsMainService.getWindowById(windowId));
	}

	async showOpenDialog(windowId: number, options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
		return this.windowsMainService.showOpenDialog(options, this.windowsMainService.getWindowById(windowId));
	}

	async pickFileFolderAndOpen(windowId: number, options: INativeOpenDialogOptions): Promise<void> {
		options.windowId = windowId;

		return this.windowsMainService.pickFileFolderAndOpen(options);
	}

	async pickFileAndOpen(windowId: number, options: INativeOpenDialogOptions): Promise<void> {
		options.windowId = windowId;

		return this.windowsMainService.pickFileAndOpen(options);
	}

	async pickFolderAndOpen(windowId: number, options: INativeOpenDialogOptions): Promise<void> {
		options.windowId = windowId;

		return this.windowsMainService.pickFolderAndOpen(options);
	}

	async pickWorkspaceAndOpen(windowId: number, options: INativeOpenDialogOptions): Promise<void> {
		options.windowId = windowId;

		return this.windowsMainService.pickWorkspaceAndOpen(options);
	}

	//#endregion

	//#region OS

	async showItemInFolder(windowId: number, path: string): Promise<void> {
		shell.showItemInFolder(path);
	}

	async setRepresentedFilename(windowId: number, path: string): Promise<void> {
		const window = this.windowsMainService.getWindowById(windowId);
		if (window) {
			window.setRepresentedFilename(path);
		}
	}

	async setDocumentEdited(windowId: number, edited: boolean): Promise<void> {
		const window = this.windowsMainService.getWindowById(windowId);
		if (window) {
			window.win.setDocumentEdited(edited);
		}
	}

	//#endregion

	//#region Lifecycle

	async relaunch(windowId: number, options?: { addArgs?: string[], removeArgs?: string[] }): Promise<void> {
		return this.lifecycleMainService.relaunch(options);
	}

	async reload(windowId: number): Promise<void> {
		const window = this.windowsMainService.getWindowById(windowId);
		if (window) {
			return this.windowsMainService.reload(window);
		}
	}

	//#endregion

	//#region Development

	async openDevTools(windowId: number, options?: OpenDevToolsOptions): Promise<void> {
		const window = this.windowsMainService.getWindowById(windowId);
		if (window) {
			window.win.webContents.openDevTools(options);
		}
	}

	async toggleDevTools(windowId: number): Promise<void> {
		const window = this.windowsMainService.getWindowById(windowId);
		if (window) {
			const contents = window.win.webContents;
			if (isMacintosh && window.hasHiddenTitleBarStyle() && !window.isFullScreen() && !contents.isDevToolsOpened()) {
				contents.openDevTools({ mode: 'undocked' }); // due to https://github.com/electron/electron/issues/3647
			} else {
				contents.toggleDevTools();
			}
		}
	}

	//#endregion

	//#region Connectivity

	async resolveProxy(windowId: number, url: string): Promise<string | undefined> {
		return new Promise(resolve => {
			const window = this.windowsMainService.getWindowById(windowId);
			if (window && window.win && window.win.webContents && window.win.webContents.session) {
				window.win.webContents.session.resolveProxy(url, proxy => resolve(proxy));
			} else {
				resolve();
			}
		});
	}

	//#endregion
}
