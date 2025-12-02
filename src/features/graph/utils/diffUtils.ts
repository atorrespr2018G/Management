import type { FileStructure } from '@/types/neo4j';

type ChangedReason = 'metadata' | 'content' | 'new';

export interface ChangedFile {
    reason: ChangedReason;
}

/**
 * Compares two file structures (scanned vs Neo4j) and detects changed files.
 * Uses a hybrid approach: quick metadata check, then deep content hash check.
 */
export function detectChangedFiles(
    scannedNode: FileStructure,
    neo4jNode: FileStructure | null,
    machineId: string
): Record<string, ChangedFile> {
    const changedMap: Record<string, ChangedFile> = {};

    function compareNodes(
        scanned: FileStructure,
        neo4j: FileStructure | null
    ): void {
        if (scanned.type === 'file') {
            const fileKey = `${machineId}:${scanned.fullPath || scanned.id}`;

            if (!neo4j) {
                // File is new (exists in scan but not in Neo4j)
                changedMap[fileKey] = { reason: 'new' };
            } else {
                const scannedSize = scanned.size;
                const scannedModifiedTime = scanned.modifiedTime;
                const scannedHash = scanned.hash;

                const neo4jSize = neo4j.size;
                const neo4jModifiedTime = neo4j.modifiedTime;
                const neo4jHash = neo4j.hash;

                // Quick check: size or modifiedTime changed
                if (
                    scannedSize !== neo4jSize ||
                    scannedModifiedTime !== neo4jModifiedTime
                ) {
                    changedMap[fileKey] = { reason: 'metadata' };
                }
                // Deep check: if metadata matches, check hash
                else if (scannedHash && neo4jHash && scannedHash !== neo4jHash) {
                    changedMap[fileKey] = { reason: 'content' };
                }
            }
        }

        // Recurse into children
        if (scanned.children && Array.isArray(scanned.children)) {
            scanned.children.forEach((scannedChild) => {
                const neo4jChild =
                    neo4j?.children?.find(
                        (n) => n.fullPath === scannedChild.fullPath
                    ) || null;
                compareNodes(scannedChild, neo4jChild);
            });
        }
    }

    compareNodes(scannedNode, neo4jNode);
    return changedMap;
}

/**
 * Merges two file structures, preferring newer data from the scanned structure.
 */
export function mergeFileStructures(
    scanned: FileStructure,
    existing: FileStructure | null
): FileStructure {
    if (!existing) return scanned;

    // Merge logic: prefer scanned data but keep Neo4j-specific metadata
    return {
        ...existing,
        ...scanned,
        // Preserve Neo4j-specific fields if they exist
        neo4jId: existing.neo4jId,
    };
}
