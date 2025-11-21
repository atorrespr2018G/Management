import type { FileStructure } from "@/types/neo4j";

/**
 * Count files in a tree structure
 * @param {object} node - Tree node
 * @returns {number} Total file count
 */
export const countFiles = (node: FileStructure): number => {
    if (node.type === 'file') return 1;
    return node.children?.reduce((sum: number, child: FileStructure) => sum + countFiles(child), 0) || 0;
};

/**
 * Count folders in a tree structure
 * @param {FileStructure} node - Tree node
 * @returns {number} Total folder count
 */
export const countFolders = (node: FileStructure): number => {
    if (node.type === 'file') return 0;
    return node.children?.reduce((sum: number, child: FileStructure) => sum + countFolders(child) + 1, 0) || 0;
};

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
            .filter(child => child !== null);

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

/**
 * Generates a unique/stable identifier for a Neo4j file or directory node.
 * Used to track RAG selections and statuses.
 * @param {string} machineId - Unique machine identifier
 * @param {object} node - File tree node
 * @returns {string} Identifier in the format "machineId:nodeFullPath" or "machineId:nodeId"
 */
export const buildStableId = (machineId: string | null = "", node: FileStructure): string => {
    return `${machineId}:${node.fullPath || node.id}`;
};

/**
 * Get all descendant file IDs (recursive)
 * @param {object} node - File tree node
 * @param {string} machineId - Unique machine identifier
 * @returns {string} Descendant file IDs
 */
export const getDescendantFileIds = (node: FileStructure, machineId: string) => {
    const ids = [];
    if (node.type === 'file') {
        ids.push(buildStableId(machineId, node));
    }
    if (node.children) {
        node.children.forEach(child => {
            ids.push(...getDescendantFileIds(child, machineId));
        });
    }
    return ids;
};