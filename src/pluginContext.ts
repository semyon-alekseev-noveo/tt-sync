/**
 * Sync-facing plugin port (TECH-CIRC-1).
 *
 * Services, vault I/O helpers, and sync phases depend on this module instead of
 * `@/main`, so the Obsidian entry can own the service graph without a
 * `main` ↔ `services` import cycle.
 *
 * Concrete implementer: `TickTickSync` in `main.ts`.
 *
 * Nested collaborators are `import type` only. That can still form type-level
 * cycles between this file and the service graph; those are not the TECH-CIRC-1
 * `main` ↔ `services` cycle. Runtime stays acyclic because types erase.
 */
import type { Editor, Plugin } from 'obsidian';
import type { DateMan } from '@/dateMan';
import type { FileOperation } from '@/fileOperation';
import type { RedoLog } from '@/redo/log';
import type { FileMetadataService } from '@/repositories/FileMetadataService';
import type { FileTaskQueries } from '@/repositories/FileTaskQueries';
import type { ProjectGroupRepository } from '@/repositories/ProjectGroupRepository';
import type { TaskCache } from '@/repositories/TaskCache';
import type { TaskRepository } from '@/repositories/TaskRepository';
import type { EventHandlerService } from '@/services/EventHandlerService';
import type { FolderMigrationService } from '@/services/FolderMigrationService';
import type { FolderSyncService } from '@/services/FolderSyncService';
import type { TickTickService } from '@/services/index';
import type { ProjectSchemeService } from '@/services/ProjectSchemeService';
import type { ProjectSyncService } from '@/services/ProjectSyncService';
import type { SyncActivityIndicator } from '@/services/SyncActivityIndicator';
import type { TagService } from '@/services/TagService';
import type { TaskDeletionHandler } from '@/services/TaskDeletionHandler';
import type { TaskModificationDetector } from '@/services/TaskModificationDetector';
import type { TaskOperationsService } from '@/services/TaskOperationsService';
import type { TickTickRestAPI } from '@/services/TicktickRestAPI';
import type { VaultSyncCoordinator } from '@/services/VaultSyncCoordinator';
import type { TaskParser } from '@/taskParser';

export interface PluginContext extends Plugin {
	settingsReady: boolean;
	syncRunning: boolean;
	readonly lastLines: Map<string, number>;
	readonly service: TickTickService;
	readonly syncActivity: SyncActivityIndicator;
	readonly taskParser: TaskParser;
	readonly fileOperation: FileOperation;
	readonly fileMetadataService: FileMetadataService;
	readonly dateMan: DateMan;
	readonly tagService: TagService;
	taskRepository: TaskRepository;
	fileTaskQueries: FileTaskQueries;
	taskCache: TaskCache;
	projectGroupRepository: ProjectGroupRepository;
	projectSyncService: ProjectSyncService;
	eventHandlerService: EventHandlerService;
	vaultSyncCoordinator: VaultSyncCoordinator;
	taskModificationDetector: TaskModificationDetector;
	taskDeletionHandler: TaskDeletionHandler;
	taskOperationsService: TaskOperationsService;
	projectScheme: ProjectSchemeService;
	folderSyncService: FolderSyncService;
	folderMigrationService: FolderMigrationService;
	tickTickRestAPI?: TickTickRestAPI;
	statusBar?: HTMLElement;
	redo?: RedoLog;
	saveSettings(force?: boolean): Promise<void>;
	checkModuleClass(): boolean;
	lineNumberCheck(): Promise<boolean>;
	checkboxEventhandler(evt: MouseEvent, editor: Editor): void | Promise<void>;
	setStatusBarText(): Promise<void>;
}
