// Login at plugin start. If data.json holds `username` + `password` the plugin logs in by itself
// (no click in settings): when there is no token, or when the stored session token no longer works.
import type { LoginInfo } from '@/loginSettings';

export interface Credentials { username?: string; password?: string }

export function hasCredentials(s: Credentials): boolean {
	return !!s.username?.trim() && !!s.password;
}

export interface SessionDeps {
	token?: string;
	credentials: Credentials;
	/** true when the stored token is still accepted by TickTick */
	validateToken: () => Promise<boolean>;
	/** username/password login; null = refused */
	login: () => Promise<LoginInfo | null>;
}

export type SessionResult =
	| { ok: true; loggedIn: boolean; info?: LoginInfo }
	| { ok: false; reason: 'no-credentials' | 'login-failed' };

/**
 * - token valid                 -> keep it, no login
 * - no token / token rejected   -> log in with the stored credentials (if any)
 * - no credentials and no token -> not ok ('no-credentials'): the user has to log in from settings
 * - token present, no credentials -> keep the token untouched (cannot do better; failures surface later)
 */
export async function ensureSession(d: SessionDeps): Promise<SessionResult> {
	const creds = hasCredentials(d.credentials);
	if (d.token) {
		if (!creds) return { ok: true, loggedIn: false };
		if (await d.validateToken()) return { ok: true, loggedIn: false };
	} else if (!creds) {
		return { ok: false, reason: 'no-credentials' };
	}
	const info = await d.login();
	if (!info?.token) return { ok: false, reason: 'login-failed' };
	return { ok: true, loggedIn: true, info };
}
