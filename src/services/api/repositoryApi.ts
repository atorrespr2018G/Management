/**
 * Repository/Connector API - handles local directory scanning and connector management
 */

import type { ConnectorConfig, ConnectorPath, FileStructure } from '@/types/neo4j';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Scans a local directory and returns its structure.
 */
export async function scanLocalDirectory(directoryPath: string): Promise<{
    data: FileStructure;
    totalFiles: number;
    totalFolders: number;
    metadata?: { source: string };
}> {
    const response = await fetch('/api/local/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryPath }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({
            error: 'Failed to scan directory',
        }));
        throw new Error(errorData.error || 'Failed to scan directory');
    }

    const scanData = await response.json();
    return {
        data: scanData.data,
        totalFiles: scanData.totalFiles || 0,
        totalFolders: scanData.totalFolders || 0,
        metadata: scanData.metadata,
    };
}

/**
 * Gets connector configuration by ID.
 */
export async function getConnectorConfig(configId: string): Promise<ConnectorConfig> {
    const response = await fetch(`${API_BASE}/api/connectors/${configId}`);
    if (!response.ok) throw new Error('Failed to fetch connector config');
    return response.json();
}

/**
 * Gets all paths for a connector.
 */
export async function getConnectorPaths(configId: string): Promise<ConnectorPath[]> {
    const response = await fetch(`${API_BASE}/api/connectors/${configId}/paths`);
    if (!response.ok) throw new Error('Failed to fetch connector paths');
    return response.json();
}

/**
 * Adds a new path to a connector.
 */
export async function addConnectorPath(
    configId: string,
    pathData: { path: string }
): Promise<ConnectorPath> {
    const response = await fetch(`${API_BASE}/api/connectors/${configId}/paths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pathData),
    });
    if (!response.ok) throw new Error('Failed to add connector path');
    return response.json();
}

/**
 * Deletes a path from a connector.
 */
export async function deleteConnectorPath(
    configId: string,
    pathId: string
): Promise<void> {
    const response = await fetch(
        `${API_BASE}/api/connectors/${configId}/paths/${pathId}`,
        { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to delete connector path');
}

/**
 * Scans multiple paths in batch.
 */
export async function scanMultiplePaths(
    paths: ConnectorPath[]
): Promise<Map<string, { data: FileStructure; results: any }>> {
    const results = new Map();

    for (const path of paths) {
        try {
            const scanResult = await scanLocalDirectory(path.path);
            results.set(path.id, {
                path,
                data: scanResult.data,
                results: {
                    totalFiles: scanResult.totalFiles,
                    totalFolders: scanResult.totalFolders,
                    source: scanResult.metadata?.source || 'local',
                },
            });
        } catch (error) {
            console.error(`Failed to scan ${path.path}:`, error);
        }
    }

    return results;
}
