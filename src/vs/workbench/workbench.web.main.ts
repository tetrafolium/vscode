/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/


// #######################################################################
// ###                                                                 ###
// ### !!! PLEASE ADD COMMON IMPORTS INTO WORKBENCH.COMMON.MAIN.TS !!! ###
// ###                                                                 ###
// #######################################################################


//#region --- workbench common

import 'vs/workbench/workbench.common.main';

//#endregion


//#region --- workbench (web main)

import 'vs/workbench/browser/web.main';

//#endregion


//#region --- workbench services
import 'vs/workbench/services/integrity/browser/integrityService';
import 'vs/workbench/services/textMate/browser/textMateService';
import 'vs/workbench/services/search/common/searchService';
import 'vs/workbench/services/output/common/outputChannelModelService';
import 'vs/workbench/services/textfile/browser/browserTextFileService';
import 'vs/workbench/services/keybinding/browser/keymapService';
import 'vs/workbench/services/extensions/browser/extensionService';
import 'vs/workbench/services/extensionManagement/common/extensionManagementServerService';
import 'vs/workbench/services/telemetry/browser/telemetryService';
import 'vs/workbench/services/configurationResolver/browser/configurationResolverService';
import 'vs/workbench/services/credentials/browser/credentialsService';
import 'vs/workbench/services/url/browser/urlService';
import 'vs/workbench/services/update/browser/updateService';
import 'vs/workbench/contrib/stats/browser/workspaceStatsService';
import 'vs/workbench/services/workspace/browser/workspacesService';
import 'vs/workbench/services/dialogs/browser/dialogService';
import 'vs/workbench/services/dialogs/browser/fileDialogService';
import 'vs/workbench/services/host/browser/browserHostService';
import 'vs/workbench/services/request/browser/requestService';
import 'vs/workbench/browser/web.simpleservices';

import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { IClipboardService } from 'vs/platform/clipboard/common/clipboardService';
import { BrowserClipboardService } from 'vs/platform/clipboard/browser/clipboardService';
import { IAccessibilityService } from 'vs/platform/accessibility/common/accessibility';
import { BrowserAccessibilityService } from 'vs/platform/accessibility/common/accessibilityService';
import { IExtensionManagementService } from 'vs/platform/extensionManagement/common/extensionManagement';
import { BrowserLifecycleService } from 'vs/platform/lifecycle/browser/lifecycleService';
import { ILifecycleService } from 'vs/platform/lifecycle/common/lifecycle';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { ContextMenuService } from 'vs/platform/contextview/browser/contextMenuService';
import { IBackupFileService } from 'vs/workbench/services/backup/common/backup';
import { BackupFileService } from 'vs/workbench/services/backup/common/backupFileService';
import { ExtensionManagementService } from 'vs/workbench/services/extensionManagement/common/extensionManagementService';
import { ITunnelService } from 'vs/platform/remote/common/tunnel';
import { NoOpTunnelService } from 'vs/platform/remote/common/tunnelService';
import { IUserDataSyncStoreService, IUserDataSyncService } from 'vs/platform/userDataSync/common/userDataSync';
import { UserDataSyncStoreService } from 'vs/platform/userDataSync/common/userDataSyncStoreService';
import { UserDataSyncService } from 'vs/platform/userDataSync/common/userDataSyncService';

registerSingleton(IExtensionManagementService, ExtensionManagementService);
registerSingleton(IBackupFileService, BackupFileService);
registerSingleton(IClipboardService, BrowserClipboardService, true);
registerSingleton(IAccessibilityService, BrowserAccessibilityService, true);
registerSingleton(ILifecycleService, BrowserLifecycleService);
registerSingleton(IContextMenuService, ContextMenuService);
registerSingleton(ITunnelService, NoOpTunnelService, true);
registerSingleton(IUserDataSyncStoreService, UserDataSyncStoreService);
registerSingleton(IUserDataSyncService, UserDataSyncService);

//#endregion


//#region --- workbench contributions

// Explorer
import 'vs/workbench/contrib/files/browser/files.web.contribution';

// Preferences
import 'vs/workbench/contrib/preferences/browser/keyboardLayoutPicker';

// Debug
import 'vs/workbench/contrib/debug/browser/extensionHostDebugService';

// Webview
import 'vs/workbench/contrib/webview/browser/webviewService';
import 'vs/workbench/contrib/webview/browser/webviewEditorService';

// Terminal
import 'vs/workbench/contrib/terminal/browser/terminalNativeService';
import 'vs/workbench/contrib/terminal/browser/terminalInstanceService';

// Tasks
import 'vs/workbench/contrib/tasks/browser/taskService';

//#endregion
