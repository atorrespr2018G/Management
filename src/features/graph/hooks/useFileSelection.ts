/**
 * Reusable hook for managing file selection state and operations
 */

import { useCallback, useMemo } from 'react';
import type { FileStructure } from '@/types/neo4j';
import { buildStableId, collectFiles } from '@/utils/treeUtils';

export interface FileSelectionInfo {
    filePath: string;
    stableId: string;
    ragStatus?: string;
    hasRelationships?: boolean;
}

export interface UseFileSelectionOptions {
    machineId: string;
    selectedForRag: Record<string, boolean>;
    ragStatuses: Record<string, string>;
    relationshipStatuses: Record<string, boolean>;
    changedFiles?: Record<string, any>;
}

export function useFileSelection({
    machineId,
    selectedForRag,
    ragStatuses,
    relationshipStatuses,
    changedFiles = {},
}: UseFileSelectionOptions) {
    /**
     * Gets all selected files from a directory with their status information
     */
    const getSelectedFilesWithStatus = useCallback(
        (directoryNode: FileStructure): FileSelectionInfo[] => {
            const files: FileSelectionInfo[] = [];

            const traverse = (node: FileStructure) => {
                const stableId = buildStableId(machineId, node);
                if (node.type === 'file' && selectedForRag[stableId]) {
                    files.push({
                        filePath: node.fullPath || node.id,
                        stableId,
                        ragStatus: ragStatuses[stableId] || 'none',
                        hasRelationships: relationshipStatuses[stableId] || false,
                    });
                }

                node.children?.forEach(traverse);
            };

            traverse(directoryNode);
            return files;
        },
        [machineId, selectedForRag, ragStatuses, relationshipStatuses]
    );

    /**
     * Gets files that need uploading (new or changed)
     */
    const getUploadableFiles = useCallback(
        (directoryNode: FileStructure): FileSelectionInfo[] => {
            const selected = getSelectedFilesWithStatus(directoryNode);
            return selected.filter(
                (f) => f.ragStatus === 'none' || changedFiles[f.stableId]
            );
        },
        [getSelectedFilesWithStatus, changedFiles]
    );

    /**
     * Gets files that can be deleted (have RAG data)
     */
    const getDeletableFiles = useCallback(
        (directoryNode: FileStructure): FileSelectionInfo[] => {
            const selected = getSelectedFilesWithStatus(directoryNode);
            return selected.filter((f) => f.ragStatus !== 'none');
        },
        [getSelectedFilesWithStatus]
    );

    /**
     * Gets files that have graph relationships
     */
    const getFilesWithGraphs = useCallback(
        (directoryNode: FileStructure): FileSelectionInfo[] => {
            const selected = getSelectedFilesWithStatus(directoryNode);
            return selected.filter(
                (f) => f.ragStatus !== 'none' && f.hasRelationships
            );
        },
        [getSelectedFilesWithStatus]
    );

    return {
        getSelectedFilesWithStatus,
        getUploadableFiles,
        getDeletableFiles,
        getFilesWithGraphs,
    };
}
