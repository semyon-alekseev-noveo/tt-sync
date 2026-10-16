import { describe, expect, it, vi } from 'vitest';
import { ensureSession, hasCredentials } from '@/autoLogin';

const info = { inboxId: 'i1', token: 'new' };
const deps = (o: Partial<Parameters<typeof ensureSession>[0]> = {}) => ({
	token: undefined as string | undefined,
	credentials: { username: 'u', password: 'p' },
	validateToken: vi.fn(async () => true),
	login: vi.fn(async () => info),
	...o,
});

describe('hasCredentials', () => {
	it('needs both username and password', () => {
		expect(hasCredentials({ username: 'u', password: 'p' })).toBe(true);
		expect(hasCredentials({ username: 'u' })).toBe(false);
		expect(hasCredentials({ username: ' ', password: 'p' })).toBe(false);
		expect(hasCredentials({})).toBe(false);
	});
});

describe('ensureSession', () => {
	it('logs in at start when there is no token but credentials', async () => {
		const d = deps();
		expect(await ensureSession(d)).toEqual({ ok: true, loggedIn: true, info });
		expect(d.validateToken).not.toHaveBeenCalled();
	});

	it('keeps a valid token', async () => {
		const d = deps({ token: 't' });
		expect(await ensureSession(d)).toEqual({ ok: true, loggedIn: false });
		expect(d.login).not.toHaveBeenCalled();
	});

	it('re-logs in when the token is rejected', async () => {
		const d = deps({ token: 't', validateToken: vi.fn(async () => false) });
		expect((await ensureSession(d)).ok).toBe(true);
		expect(d.login).toHaveBeenCalledOnce();
	});

	it('token without credentials is kept and never validated', async () => {
		const d = deps({ token: 't', credentials: {} });
		expect(await ensureSession(d)).toEqual({ ok: true, loggedIn: false });
		expect(d.validateToken).not.toHaveBeenCalled();
		expect(d.login).not.toHaveBeenCalled();
	});

	it('no token and no credentials: manual login needed', async () => {
		const d = deps({ credentials: {} });
		expect(await ensureSession(d)).toEqual({ ok: false, reason: 'no-credentials' });
	});

	it('reports a refused login', async () => {
		const d = deps({ login: vi.fn(async () => null) });
		expect(await ensureSession(d)).toEqual({ ok: false, reason: 'login-failed' });
	});
});
