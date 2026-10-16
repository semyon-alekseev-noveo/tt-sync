// Settings written by a (successful or failed) TickTick login. Only these keys change:
// GTD scope, list mapping, project template etc. must survive a login untouched.
import type { ITickTickSyncSettings } from '@/settings';

export interface LoginInfo { inboxId: string | null; token: string | null }

export function loginPatch(info: LoginInfo): Partial<ITickTickSyncSettings> {
	return { token: info.token as string, inboxID: info.inboxId as string, inboxName: 'Inbox', checkPoint: 0 };
}

export function applyLogin(current: ITickTickSyncSettings, info: LoginInfo): ITickTickSyncSettings {
	return { ...current, ...loginPatch(info) };
}
