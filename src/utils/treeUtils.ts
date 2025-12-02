import type { FileStructure } from '@/types/neo4j';

/**
 * Builds a stable ID for a file/directory node based on machine ID and full path.
 * This ensures consistent identification across scans.
 */
export function buildStableId(machineId: string, node: FileStructure): string {
    return `${machineId}:${node.fullPath || node.id}`;
}

/**
 * Recursively gets all descendant file IDs from a directory node.
 * Used for bulk selection operations.
 */
export function getDescendantFileIds(
    node: FileStructure,
    machineId: string
): string[] {
    const ids: string[] = [];

    if (node.type === 'file') {
        ids.push(buildStableId(machineId, node));
    }

    if (node.children) {
        node.children.forEach((child: FileStructure) => {
            ids.push(...getDescendantFileIds(child, machineId));
        });
    }

    return ids;
}

/**
 * Recursively traverses a tree structure and applies a callback to each node.
 */
export function traverseTree(
    node: FileStructure,
    callback: (node: FileStructure, level: number) => void,
    level: number = 0
): void {
    callback(node, level);

    if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => traverseTree(child, callback, level + 1));
    }
}

/**
 * Sorts children: directories first, then files, both alphabetically.
 */
export function sortTreeChildren(children: FileStructure[]): FileStructure[] {
    return [...children].sort((a, b) => {
        // Directories come before files
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        // Within same type, sort alphabetically by name
        return a.name.localeCompare(b.name);
    });
}

/**
 * Finds a node in the tree by its full path.
 */
export const findNodeByPath = (root: FileStructure, fullPath: string): FileStructure | null => {
    if (root.fullPath === fullPath || root.id === fullPath) {
        return root;
    }

    if (root.children) {
        for (const child of root.children) {
            const found = findNodeByPath(child, fullPath);
            if (found) return found;
        }
    }

    return null;
}

/**
 * Collects all files from a tree structure (excluding directories).
 */
export function collectFiles(node: FileStructure): FileStructure[] {
    const files: FileStructure[] = [];

    traverseTree(node, (n) => {
        if (n.type === 'file') {
            files.push(n);
        }
    });

    return files;
}

/**
 * Counts total files and folders in a tree.
 */
export const countNodes = (node: FileStructure): { files: number; folders: number } => {
    let files = 0;
    let folders = 0;

    traverseTree(node, (n) => {
        if (n.type === 'file') files++;
        else if (n.type === 'directory') folders++;
    });

    return { files, folders };
}

/**
 * Flatten tree structure to array
 * @param {object} node - Tree node
 * @param {array} result - Result array (for recursion)
 * @returns {array} Flattened array
 */
export const flattenTree = (node: FileStructure, result: FileStructure[] = []) => {
    result.push(node);
    if (node.children) {
        node.children.forEach(child => flattenTree(child, result));
    }
    return result;
};

/**
 * Search/filter tree by name
 * @param {object} node - Tree node
 * @param {string} query - Search query
 * @returns {object|null} Filtered tree
 */
export const filterTreeByName = (node: FileStructure, query: string) => {
    const matchesQuery = node.name.toLowerCase().includes(query.toLowerCase());

    if (node.children) {
        const filteredChildren: FileStructure[] = node.children
            .map(child => filterTreeByName(child, query))
            .filter(child => child !== null) as FileStructure[];

        if (matchesQuery || filteredChildren.length > 0) {
            return {
                ...node,
                children: filteredChildren
            };
        }
        return null;
    }

    return matchesQuery ? node : null;
};
