import {
	commentFingerprint,
	commentFingerprintsForThread,
	extractAbyssCommentThreads,
	normalizedCommentKey,
	type AbyssCommentThread,
} from '@/abyssFormat';

export { normalizedCommentKey };

/** All keys that should match the same logical comment (full line + plain). */
export function aliasKeysForBody(body: string): ReadonlySet<string> {
	const keys = new Set<string>();
	const full = commentFingerprint(body);
	if (full) keys.add(full);
	const plain = normalizedCommentKey(body);
	if (plain) keys.add(plain);
	return keys;
}

export function vaultThreadRef(thread: AbyssCommentThread): { contentKey: string; aliasKeys: ReadonlySet<string> } {
	const alias = new Set<string>(commentFingerprintsForThread(thread));
	const plain = normalizedCommentKey(thread.body);
	if (plain) alias.add(plain);
	return { contentKey: plain || commentFingerprint(thread.body), aliasKeys: alias };
}

export function remoteCommentRef(title: string): { contentKey: string; aliasKeys: ReadonlySet<string> } {
	return { contentKey: normalizedCommentKey(title), aliasKeys: aliasKeysForBody(title) };
}

export function normalizedKeysFromVaultLines(taskLines: string[]): string[] {
	return extractAbyssCommentThreads(taskLines)
		.map(t => normalizedCommentKey(t.body))
		.filter(k => k.length > 0)
		.sort();
}

export function normalizedKeysFromRemote(remote: ReadonlyArray<{ title?: string }>): string[] {
	return remote
		.map(c => normalizedCommentKey(c.title ?? ''))
		.filter(k => k.length > 0)
		.sort();
}
