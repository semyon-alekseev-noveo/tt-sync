# PILOT-BATCH-EDITOR-SAFETY — results index

Epic: [#15](https://github.com/semyon-alekseev-noveo/tt-sync/issues/15)  
Plugin under test: tip **2.0.89** (comment case pilots); earlier rows on **2.0.76–2.0.80**

| Phase / issue | Result file | Status |
|---------------|-------------|--------|
| #16 open-note / editor | [16-open-note-editor.md](16-open-note-editor.md) | **partial pass** (4 rows run) |
| #27/#28/#29 comment P0 | [27-29-comment-p0-unit.md](27-29-comment-p0-unit.md) | **2.0.79** unit |
| #28 EMPTY-VAULT-WIPE case | [28-empty-vault-wipe-2.0.89.md](28-empty-vault-wipe-2.0.89.md) | **pass** on **2.0.89** |
| #29 GET-FAIL-OPEN case | [29-get-fail-open-2.0.89.md](29-get-fail-open-2.0.89.md) | **pass** ×2 on **2.0.89** |
| #58 release 2.0.79 smoke | [58-release-2.0.79-smoke.md](58-release-2.0.79-smoke.md) | **smoke pass**; #27 twins still on disk |
| #27 quiet-sync collapse | [27-vault-dup-key-2.0.80-unit.md](27-vault-dup-key-2.0.80-unit.md) | **unit + pilot pass** on PR tip **2.0.80** |
| #60 release 2.0.80 smoke | [60-release-2.0.80-smoke.md](60-release-2.0.80-smoke.md) | **pass**; #27 twins stay collapsed |
| #17 EMPTY-SIDE-GUARD | [17-empty-side-guard-2.0.89.md](17-empty-side-guard-2.0.89.md) | **pass** empty-vault on **2.0.89** (empty-ticktick **not run**) |
| #18 deferred-id | [18-deferred-id-2.0.89.md](18-deferred-id-2.0.89.md) | **pass** on **2.0.89** |
