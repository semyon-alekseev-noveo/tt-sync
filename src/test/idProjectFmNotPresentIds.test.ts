/**
 * ID-PROJECT-FM-NOT-PRESENTIDS (#232 / E16)
 */
import { describe, expect, it } from 'vitest';
import {
	planVaultTaskDeletions,
	evaluateMassDeleteGuard,
	massDeleteSettingsFrom,
	DEFAULT_MASS_DELETE_GUARD,
} from '@/sync/massDeleteGuard';
import {
	collectLineMarkerPresentIds,
	stripYamlFrontmatter,
} from '@/sync/vaultDeletionScan';

const cfg = massDeleteSettingsFrom(DEFAULT_MASS_DELETE_GUARD);

const PARENT = 'parent01parent01parent01par';
const CHILD_A = 'child0achild0achild0achild0a';
const CHILD_B = 'child0bchild0bchild0bchild0b';

const PROJECT_NOTE = `---
id: 202610281148
tags:
  - system/project
  - system/moc
ticktick_id: ${PARENT}
---

## Overview

## Active Zone

- [ ] Child A #ticktick %%[ticktick_id:: ${CHILD_A}]%%
`;

describe('ID-PROJECT-FM-NOT-PRESENTIDS', () => {
	it('YAML ticktick_id is stripped and not collected as presentIds', () => {
		const body = stripYamlFrontmatter(PROJECT_NOTE);
		expect(body).not.toMatch(/^ticktick_id:/m);
		expect(body).toContain('Active Zone');
		expect(body).toContain(CHILD_A);

		const ids = collectLineMarkerPresentIds(PROJECT_NOTE);
		expect(ids.has(PARENT)).toBe(false);
		expect(ids.has(CHILD_A)).toBe(true);
		expect(ids.size).toBe(1);
	});

	it('FM-only parent id never clears child vault→TT plans when AZ markers missing', () => {
		// FM has PARENT; AZ empty of markers (text-only / wiped children).
		const textOnlyAz = `---
ticktick_id: ${PARENT}
tags:
  - system/project
---

## Active Zone

- [ ] Child A
- [ ] Child B
`;
		const presentIds = collectLineMarkerPresentIds(textOnlyAz);
		expect(presentIds.has(PARENT)).toBe(false);
		expect(presentIds.size).toBe(0);

		const planned = planVaultTaskDeletions({
			tasks: [
				{ taskId: PARENT, title: 'Project', file: '10 Projects/p.md', inPushScope: true, isParent: true },
				{ taskId: CHILD_A, title: 'Child A', file: '10 Projects/p.md', inPushScope: true },
				{ taskId: CHILD_B, title: 'Child B', file: '10 Projects/p.md', inPushScope: true },
			],
			presentIds,
			untrustedFiles: new Set(),
			indexIncomplete: false,
		});
		// Parent skipped (isParent); children still planned — FM did not clear them.
		expect(planned.map(p => p.taskId).sort()).toEqual([CHILD_A, CHILD_B].sort());
		const held = evaluateMassDeleteGuard(planned, {
			vaultTrackedCount: presentIds.size,
			dexieTaskCount: 3,
			ticktickSnapshotEmpty: false,
			vaultIndexIncomplete: false,
		}, cfg);
		expect(held.block).toBe(true);
	});

	it('%% marker inside frontmatter fence is ignored', () => {
		const weird = `---
ticktick_id: ${PARENT}
note: "%%[ticktick_id:: ${PARENT}]%%"
---

- [ ] Real child %%[ticktick_id:: ${CHILD_A}]%%
`;
		const ids = collectLineMarkerPresentIds(weird);
		expect(ids.has(PARENT)).toBe(false);
		expect(ids.has(CHILD_A)).toBe(true);
	});
});
