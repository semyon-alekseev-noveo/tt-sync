<script lang="ts">
	import {
		DELETION_GLOSSARY_HEADING,
		DELETION_GLOSSARY_INTRO,
		DELETION_GLOSSARY_TERMS,
	} from '@/ui/settings/settingsUxCopy';

	/** Compact = chips only; full = chips + one-line not/summary table. */
	export let compact = false;
</script>

<div class="tts-deletion-glossary" role="region" aria-label={DELETION_GLOSSARY_HEADING}>
	<div class="setting-item-name">{DELETION_GLOSSARY_HEADING}</div>
	<div class="setting-item-description">{DELETION_GLOSSARY_INTRO}</div>
	<div class="tts-glossary-chips">
		{#each DELETION_GLOSSARY_TERMS as row}
			<span class="tts-glossary-chip" title="{row.summary} {row.not}">{row.term}</span>
		{/each}
	</div>
	{#if !compact}
		<table class="tts-glossary-table">
			<thead>
				<tr>
					<th>Term</th>
					<th>Does</th>
					<th>Is not</th>
				</tr>
			</thead>
			<tbody>
				{#each DELETION_GLOSSARY_TERMS as row}
					<tr>
						<td>{row.term}</td>
						<td>{row.summary}</td>
						<td>{row.not}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
