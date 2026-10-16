// Bumped after the TickTick list cache was refilled (plugin start, login). The GTD settings section
// listens to it, so lists show up without opening settings and clicking login.
import { writable } from 'svelte/store';

export const projectsVersion = writable(0);
export const bumpProjectsVersion = () => projectsVersion.update(n => n + 1);
