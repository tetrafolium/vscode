/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createDecorator } from 'vs/platform/instantiation/common/instantiation';
import { Event } from 'vs/base/common/event';
import { IExtensionIdentifier } from 'vs/platform/extensionManagement/common/extensionManagement';
import { RawContextKey } from 'vs/platform/contextkey/common/contextkey';

export interface IUserData {
	ref: string;
	content: string | null;
}

export enum UserDataSyncStoreErrorCode {
	Rejected = 'Rejected',
	Unknown = 'Unknown'
}

export class UserDataSyncStoreError extends Error {

	constructor(message: string, public readonly code: UserDataSyncStoreErrorCode) {
		super(message);
	}

}

export const IUserDataSyncStoreService = createDecorator<IUserDataSyncStoreService>('IUserDataSyncStoreService');

export interface IUserDataSyncStoreService {
	_serviceBrand: undefined;

	readonly enabled: boolean;

	readonly loggedIn: boolean;
	readonly onDidChangeLoggedIn: Event<boolean>;
	login(): Promise<void>;
	logout(): Promise<void>;

	read(key: string, oldValue: IUserData | null): Promise<IUserData>;
	write(key: string, content: string, ref: string | null): Promise<string>;
}

export interface ISyncExtension {
	identifier: IExtensionIdentifier;
	version?: string;
	enabled: boolean;
}

export const enum SyncSource {
	Settings = 1,
	Extensions
}

export const enum SyncStatus {
	Uninitialized = 'uninitialized',
	Idle = 'idle',
	Syncing = 'syncing',
	HasConflicts = 'hasConflicts',
}

export interface ISynchroniser {

	readonly status: SyncStatus;
	readonly onDidChangeStatus: Event<SyncStatus>;
	readonly onDidChangeLocal: Event<void>;

	sync(_continue?: boolean): Promise<boolean>;
}

export const IUserDataSyncService = createDecorator<IUserDataSyncService>('IUserDataSyncService');

export interface IUserDataSyncService extends ISynchroniser {
	_serviceBrand: any;
	readonly conflictsSource: SyncSource | null;

	getRemoteExtensions(): Promise<ISyncExtension[]>;
	removeExtension(identifier: IExtensionIdentifier): Promise<void>;
}

export const ISettingsMergeService = createDecorator<ISettingsMergeService>('ISettingsMergeService');

export interface ISettingsMergeService {

	_serviceBrand: undefined;

	merge(localContent: string, remoteContent: string, baseContent: string | null): Promise<{ mergeContent: string, hasChanges: boolean, hasConflicts: boolean }>;

}

export const CONTEXT_SYNC_STATE = new RawContextKey<string>('syncStatus', SyncStatus.Uninitialized);
