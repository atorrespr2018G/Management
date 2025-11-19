'use client';

import { useState, useCallback } from 'react';
import { checkNeo4jHealth, storeInNeo4j, getNeo4jStats } from '@/services/neo4jApi';
import type { FileStructure } from '@/types/neo4j';

interface UseStoreDirectoryInNeo4jOptions {
    scanData: FileStructure | null;
    metadata?: Record<string, any>;
    machineId: string | null;
    /** Called after a successful store (e.g. refresh structure / graph) */
    onAfterStore?: () => Promise<void> | void;
}

export function useStoreDirectoryInNeo4j({
    scanData,
    metadata,
    machineId,
    onAfterStore,
}: UseStoreDirectoryInNeo4jOptions) {
    const [isStoring, setIsStoring] = useState(false);
    const [storeMessage, setStoreMessage] = useState('');
    const [neo4jStatus, setNeo4jStatus] = useState<any>(null);

    const checkNeo4jConnection = useCallback(async () => {
        try {
            const health = await checkNeo4jHealth();
            let status: any = health;

            if (health.neo4j_connected) {
                const stats = await getNeo4jStats();
                status = { ...health, ...stats };
            }

            setNeo4jStatus(status);
            return status;
        } catch (error) {
            const status = {
                status: 'unhealthy',
                neo4j_connected: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
            setNeo4jStatus(status);
            return status;
        }
    }, []);

    const handleStoreInNeo4j = useCallback(async () => {
        if (!machineId) {
            setStoreMessage('Error: Machine ID not found');
            return;
        }
        if (!scanData) {
            setStoreMessage('Error: No scan data to store');
            return;
        }

        try {
            setIsStoring(true);
            setStoreMessage('Storing directory in Neo4j…');

            const health = await checkNeo4jHealth();
            if (!health.neo4j_connected) {
                setStoreMessage('❌ Neo4j database is not connected');
                return;
            }

            await storeInNeo4j(
                scanData,
                metadata || {},
                {},
                machineId,
                true // metadata only for now
            );

            setStoreMessage('✅ Directory stored in Neo4j (metadata only).');

            const stats = await getNeo4jStats();
            setNeo4jStatus(stats);

            // Allow caller to refresh structure / graph, etc.
            if (onAfterStore) {
                await onAfterStore();
            }
        } catch (error: any) {
            setStoreMessage(
                `❌ Error storing in Neo4j: ${error instanceof Error ? error.message : 'Unknown error'
                }`
            );
        } finally {
            setIsStoring(false);
        }
    }, [scanData, metadata, machineId, onAfterStore, checkNeo4jConnection]);

    return {
        isStoring,
        storeMessage,
        neo4jStatus,
        handleStoreInNeo4j,
        checkNeo4jConnection,
        setStoreMessage // optional if want to clear message manually
    };
}
