/**
 * TickTick task tree sort helpers (#66).
 * Extracted from FileOperation — behavior unchanged.
 */
import type { ITask } from '@/api/types/Task';
import log from '@/utils/logger';

export function compareTasks(a: ITask, b: ITask) {
	// Check for tasks with no parentId (parent tasks)
	if (!a.parentId && b.parentId) {
		return -1; // Parent task comes first
	} else if (a.parentId && !b.parentId) {
		return 1; // Task with parentId comes after
	} else if (a.parentId && b.parentId) {
		return b.parentId.localeCompare(a.parentId);
	} else {
		return a.sortOrder - b.sortOrder;
	}
}

// export compareTasks(a: ITask, b: ITask, depth = 0, tasks: ITask[]) {
// 	// Check for tasks with no parentId (parent tasks)
// 	if (!a.parentId && b.parentId) {
// 		return -1; // Parent task comes first
// 	} else if (a.parentId && !b.parentId) {
// 		return 1; // Task with parentId comes after
// 	} else if (!a.parentId && !b.parentId) {
// 		// No parent - sort by sortOrder
// 		return a.sortOrder - b.sortOrder;
// 	} else {
// 		// Use a set to track visited tasks to detect circular dependencies
// 		const visited = new Set();
//
// 		let currentA = a;
// 		while (currentA.parentId && depth < 100) { // Set a maximum depth limit (adjust as needed)
// 			if (visited.has(currentA.id)) {
// 				// Circular dependency detected - sort based on task id as a fallback
// 				return a.id.localeCompare(b.id);
// 			}
// 			visited.add(currentA.id);
// 			currentA = getParent(currentA.id, tasks);
// 		}
//
// 		let currentB = b;
// 		visited.clear(); // Clear visited set for task B
// 		while (currentB.parentId && depth < 100) {
// 			if (visited.has(currentB.id)) {
// 				// Circular dependency detected
// 				return a.id.localeCompare(b.id);
// 			}
// 			visited.add(currentB.id);
// 			currentB = getParent(currentB.id, tasks);
// 		}
//
// 		// If one stack is empty, remaining elements in the other are higher level parents
// 		return currentA ? -1 : 1;
// 	}
// }

export function getParent(taskId: string, tasks: ITask[]) {
	return tasks.find(task => task.id === taskId);
}


// Recursive function to sort tasks, placing child tasks before their parents
export function sortChildrenfirst(tasks: ITask[]): ITask[] {
	const sorted: ITask[] = [];
	const taskMap = new Map<string, ITask>();

	// Map tasks by their IDs for easy lookup
	tasks.forEach(task => taskMap.set(task.id, task));

	// Function to recursively add tasks, making sure children appear before parents
	const addTaskWithChildren = (task: ITask) => {
		if (!sorted.includes(task)) {
			// Add children first
			if (task.childIds) {
				task.childIds.forEach(childId => {
					const childTask = taskMap.get(childId);
					if (childTask) {
						addTaskWithChildren(childTask);
					}
				});
			}

			// Add the current task after its children
			sorted.push(task);
		}
	};

	// Iterate through all tasks and ensure children are added before their parents
	tasks.forEach(task => {
		addTaskWithChildren(task);
	});
	return sorted;
}

export function sortTasks(tasks: ITask[]) {
	type TaskNode = ITask & { children: TaskNode[] };
	const taskMap = new Map<string, TaskNode>();

	// Populate the map
	tasks.forEach(task => taskMap.set(task.id, { ...task, children: [] }));

	const rootTasks: TaskNode[] = [];

	// Build the hierarchy
	tasks.forEach(task => {
		const node = taskMap.get(task.id)!;
		if (task.parentId && taskMap.has(task.parentId)) {
			taskMap.get(task.parentId)!.children.push(node);
		} else {
			rootTasks.push(node);
		}
	});

	// Function to flatten the hierarchy with depth-first traversal
	function flattenHierarchy(taskList: TaskNode[], sortedArray: TaskNode[] = []): TaskNode[] {
		for (const task of taskList) {
			sortedArray.push(task);
			if (task.children.length) {
				flattenHierarchy(task.children, sortedArray);
			}
		}
		return sortedArray;
	}

	// Get the sorted array
	return flattenHierarchy(rootTasks).map(({ children, ...task }) => task);
}

export function doTheSortMambo(tasks: ITask[]) {
	// Example usage with the provided tasks
	const jsonStringifiedTasks = JSON.parse(JSON.stringify(tasks)) as ITask[]; // Deep copy the tasks
	const sortedTasks = sortTasksByLevel(jsonStringifiedTasks);

	// // Format the result to show the hierarchy
	// const result = sortedTasks.map(task => {
	// 	const indent = '  '.repeat(task.level - 1);
	// 	return `${indent}${task.id} - ${task.parentId} - ${task.title} (Level: ${task.level})`;
	// }).join('\n');
	//
	// log.debug('Sorted Tasks Hierarchy:');
	// result.split('\n').forEach(line => {
	// 	log.debug(line);
	// });

	return sortedTasks as ITask[];
}

export function sortTasksByLevel(tasks: ITask[]) {
	// Create a map of tasks by ID for easy reference
	type TaskWithLevel = ITask & { level: number };
	const taskMap: Record<string, TaskWithLevel> = {};
	tasks.forEach(task => {
		taskMap[task.id] = { ...task, level: 0 };
	});

	// Calculate the level of each task
	tasks.forEach(task => {
		const entry = taskMap[task.id];
		if (!entry.parentId) {
			// This is a top-level task
			entry.level = 1;
		} else {
			// Child task - we need to calculate its level
			let currentId = task.id;
			let level = 1;

			while (taskMap[currentId] && taskMap[currentId].parentId) {
				level++;
				//This happened once. It caused an infinite loop. Throw an error.
				if (level > 6) {
					log.debug('this is the issue: ', currentId, ' ', taskMap[currentId].parentId, '');
					new Notice('A circular parent-child dependency was found. Please fix in ticktick by checking parent-child relationships.');
					throw new Error('Circular parent-child dependency was found.');
				}
				currentId = taskMap[currentId].parentId;
			}

			entry.level = level;
		}
	});

	// Convert back to array and sort by level
	const sortedTasks = Object.values(taskMap);
	sortedTasks.sort((a, b) => {
		// Primary sort by level
		if (a.level !== b.level) {
			return a.level - b.level;
		}

		// Secondary sort by original order (using sortOrder property)
		return a.sortOrder - b.sortOrder;
	});

	return sortedTasks;
}
