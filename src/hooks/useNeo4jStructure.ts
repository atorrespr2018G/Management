'use client';

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ChangedReason, FileStructure, UseNeo4jStructureOptions } from '@/types/neo4j';
import { buildStableId } from '@/utils/treeUtils';
import {
    getDirectoryFromNeo4j,
    getFileRagStatus,
    getFileRelationshipStatus,
} from '@/services/neo4jApi';
import {
    setNeo4jDirectoryStructure,
    setIsLoadingNeo4jStructure,
    setRagStatuses,
    setRelationshipStatuses,
    setSelectedForRag,
    setChangedFiles,
    setRelationshipStatusForFile,
} from '@/store/slices/neoSlice';


/**
 * Load the Neo4j directory structure, keeping Redux state in sync.
 */
export const useNeo4jStructure = ({ machineId, node }: UseNeo4jStructureOptions) => {
    const dispatch = useDispatch();

    const { neo4jDirectoryStructure, isLoadingNeo4jStructure } = useSelector(
        (state: any) => state.neo
    );

    const fetchNeo4jStructure = useCallback(async () => {
        if (!node || !machineId) return;

        try {
            dispatch(setIsLoadingNeo4jStructure(true));

            const rootFullPath = node.fullPath || '';
            if (!rootFullPath) return;

            const result = await getDirectoryFromNeo4j(machineId, rootFullPath);

            if (result.found && result.structure) {
                // 1) Store Neo4j structure in Redux
                dispatch(setNeo4jDirectoryStructure(result.structure));

                // 2) Detect changed files (hybrid approach)
                const changedMap: Record<string, { reason: ChangedReason }> = {};

                const detectChangedFiles = (
                    scannedNode: FileStructure,
                    neo4jNode: FileStructure | null,
                    changed: Record<string, { reason: ChangedReason }>
                ) => {
                    if (scannedNode.type === 'file') {
                        const fileKey = buildStableId(machineId, scannedNode);

                        if (!neo4jNode) {
                            // File is new (exists in scan but not in Neo4j)
                            changed[fileKey] = { reason: 'new' };
                        } else {
                            const scannedSize = scannedNode.size;
                            const scannedModifiedTime = scannedNode.modifiedTime;
                            const scannedHash = scannedNode.hash;

                            const neo4jSize = neo4jNode.size;
                            const neo4jModifiedTime = neo4jNode.modifiedTime;
                            const neo4jHash = neo4jNode.hash;

                            // Quick check: size or modifiedTime changed
                            if (
                                scannedSize !== neo4jSize ||
                                scannedModifiedTime !== neo4jModifiedTime
                            ) {
                                changed[fileKey] = { reason: 'metadata' };
                            }
                            // Deep check: if metadata matches, check hash
                            else if (scannedHash && neo4jHash && scannedHash !== neo4jHash) {
                                changed[fileKey] = { reason: 'content' };
                            }
                        }
                    }

                    // Recurse into children
                    if (scannedNode.children && Array.isArray(scannedNode.children)) {
                        scannedNode.children.forEach((scannedChild) => {
                            const neo4jChild =
                                neo4jNode?.children?.find(
                                    (n) => n.fullPath === scannedChild.fullPath
                                ) || null;
                            detectChangedFiles(scannedChild, neo4jChild, changed);
                        });
                    }
                };

                const compareStructures = (
                    scanned: FileStructure,
                    neo4j: FileStructure | null
                ) => {
                    detectChangedFiles(scanned, neo4j, changedMap);
                    if (scanned.children && Array.isArray(scanned.children)) {
                        scanned.children.forEach((scannedChild) => {
                            const neo4jChild =
                                neo4j?.children?.find(
                                    (n) => n.fullPath === scannedChild.fullPath
                                ) || null;
                            compareStructures(scannedChild, neo4jChild);
                        });
                    }
                };

                compareStructures(node, result.structure);

                // dispatch(setChangedFiles(changedMap));
                // Convert changedMap to boolean values for Redux state
                const changedFilesBoolean: Record<string, boolean> = {};
                Object.keys(changedMap).forEach(key => {
                    changedFilesBoolean[key] = true;
                });
                dispatch(setChangedFiles(changedFilesBoolean));

                // 3) Fetch RAG + relationship statuses for all files
                const fetchRagAndRelationshipStatuses = async (node: FileStructure) => {
                    if (node.type === 'file') {
                        const fileKey = buildStableId(machineId || '', node);

                        // RAG status
                        try {
                            const status = await getFileRagStatus(
                                machineId,
                                node.fullPath || node.id
                            );
                            dispatch(
                                setRagStatuses({
                                    fileKey,
                                    status: status.status,
                                })
                            );
                        } catch (error) {
                            console.error(
                                `Error fetching RAG status for ${node.fullPath}:`,
                                error
                            );
                            // You can choose to set a default if you want
                            dispatch(
                                setRagStatuses({
                                    fileKey,
                                    status: 'none',
                                })
                            );
                        }

                        // Relationship (graph) status
                        try {
                            const relStatus = await getFileRelationshipStatus(
                                machineId,
                                node.fullPath || node.id
                            );
                            dispatch(
                                setRelationshipStatusForFile({
                                    fileKey,
                                    hasRelationships: relStatus.has_relationships,
                                })
                            );
                        } catch (error) {
                            console.error(
                                `Error fetching relationship status for ${node.fullPath}:`,
                                error
                            );
                            dispatch(
                                setRelationshipStatusForFile({
                                    fileKey,
                                    hasRelationships: false,
                                })
                            );
                        }
                    }

                    if (node.children && Array.isArray(node.children)) {
                        for (const child of node.children) {
                            await fetchRagAndRelationshipStatuses(child);
                        }
                    }
                };

                // Clear existing state before refilling it
                dispatch(setRagStatuses({} as any));           // same behaviour as existing code
                dispatch(setRelationshipStatuses({} as any));  // same behaviour as existing code
                dispatch(setSelectedForRag({} as any));

                await fetchRagAndRelationshipStatuses(result.structure);
            }
        } catch (error) {
            console.error('Error fetching Neo4j structure:', error);
        } finally {
            dispatch(setIsLoadingNeo4jStructure(false));
        }
    }, [dispatch, machineId, node]);

    // Optional auto-fetch (matches old useEffect behaviour in ScanResultsDisplay)
    useEffect(() => {
        if (node && machineId)
            fetchNeo4jStructure();
    }, [machineId, node, fetchNeo4jStructure]);

    return {
        neo4jDirectoryStructure,
        isLoadingNeo4jStructure,
        fetchNeo4jStructure,
    };
};
