// Obsidian note/folder -> TickTick list (settings.projectMappings). `path` = file path
// (`projects/Client.md`) or folder prefix ending in `/`; `project` = list id or name.
export interface IProjectMapping { path: string; project: string }
interface P { id: string; name: string }

const resolveId = (project: string, projects: P[]) =>
	projects.find(p => p.id === project)?.id ?? projects.find(p => p.name.toLowerCase() === project.trim().toLowerCase())?.id;

export function projectIdForPath(path: string, map: IProjectMapping[] | undefined, projects: P[]): string | undefined {
	if (!map?.length) return undefined;
	const exact = map.find(m => m.path === path || m.path === path.replace(/\.md$/, ''));
	const prefix = map.filter(m => m.path.endsWith('/') && path.startsWith(m.path)).sort((a, b) => b.path.length - a.path.length)[0];
	const hit = exact ?? prefix;
	return hit ? resolveId(hit.project, projects) : undefined;
}

/** Reverse (new TickTick task → file): only exact file entries. */
export function pathForProjectId(id: string, map: IProjectMapping[] | undefined, projects: P[]): string | undefined {
	const m = map?.find(e => !e.path.endsWith('/') && resolveId(e.project, projects) === id);
	return m ? (m.path.endsWith('.md') ? m.path : m.path + '.md') : undefined;
}

export function parseProjectMappingText(text: string): IProjectMapping[] {
	return text.split('\n').map(l => l.split('=')).filter(p => p.length === 2 && p[0].trim() && p[1].trim())
		.map(([a, b]) => ({ path: a.trim(), project: b.trim() }));
}
export const projectMappingToText = (m: IProjectMapping[] | undefined) => (m ?? []).map(e => `${e.path} = ${e.project}`).join('\n');
