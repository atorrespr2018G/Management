/**
 * Graph/Neo4j API - handles Neo4j operations, RAG, and semantic relationships
 */

import type {
    FileStructure,
    UploadResponse,
    UploadOptions,
    SemanticRelationshipOptions,
    DirectoryResponse,
    RAGStatus,
} from '@/types/neo4j';

const NEO4J_API_URL = process.env.NEXT_PUBLIC_NEO4J_API_URL || 'http://localhost:8000';

/**
 * Helper function to make API calls
 */
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${NEO4J_API_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `API call failed: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Gets directory structure from Neo4j
 */
export async function getDirectoryFromNeo4j(
    machineId: string,
    fullPath: string
): Promise<DirectoryResponse> {
    const params = new URLSearchParams({
        machine_id: machineId,
        full_path: fullPath,
    });
    return apiCall<DirectoryResponse>(`/api/graph/directory?${params.toString()}`);
}

/**
 * Uploads files in batch for RAG processing
 */
export async function uploadFilesBatch(
    machineId: string,
    filePaths: string[],
    options: UploadOptions = {}
): Promise<UploadResponse> {
    return apiCall<UploadResponse>('/api/graph/upload-files-batch', {
        method: 'POST',
        body: JSON.stringify({
            machine_id: machineId,
            file_paths: filePaths,
            chunk_size: options.chunk_size || 1200,
            chunk_overlap: options.chunk_overlap || 200,
        }),
    });
}

/**
 * Gets RAG status for a file
 */
export async function getFileRagStatus(
    machineId: string,
    filePath: string
): Promise<{ status: RAGStatus['status']; chunks_count?: number }> {
    const params = new URLSearchParams({
        machine_id: machineId,
        file_path: filePath,
    });
    return apiCall(`/api/graph/file-rag-status?${params.toString()}`);
}

/**
 * Gets relationship status for a file
 */
export async function getFileRelationshipStatus(
    machineId: string,
    filePath: string
): Promise<{
    has_relationships: boolean;
    relationship_count: number;
    file_path: string;
    file_id: string;
}> {
    const params = new URLSearchParams({
        machine_id: machineId,
        file_path: filePath,
    });
    return apiCall(`/api/graph/file-relationship-status?${params.toString()}`);
}

/**
 * Creates semantic relationships for files
 */
export async function createSemanticRelationships(
    machineId: string,
    fullPath: string,
    options: SemanticRelationshipOptions = {}
): Promise<any> {
    const params = new URLSearchParams({
        machine_id: machineId,
        full_path: fullPath,
    });

    if (options.similarity_threshold !== undefined) {
        params.append('similarity_threshold', options.similarity_threshold.toString());
    }
    if (options.top_k !== undefined) {
        params.append('top_k', options.top_k.toString());
    }
    if (options.same_document_only !== undefined) {
        params.append('same_document_only', options.same_document_only.toString());
    }
    if (options.same_directory_only !== undefined) {
        params.append('same_directory_only', options.same_directory_only.toString());
    }
    if (options.scope_file_id !== undefined) {
        params.append('scope_file_id', options.scope_file_id);
    }

    return apiCall(`/api/graph/create-semantic-relationships?${params.toString()}`, {
        method: 'POST',
    });
}

/**
 * Deletes file chunks and their relationships
 */
export async function deleteFileChunks(
    machineId: string,
    filePath: string
): Promise<{ deleted_chunks: number; deleted_relationships: number }> {
    const params = new URLSearchParams({
        machine_id: machineId,
        file_path: filePath,
    });
    return apiCall(`/api/graph/delete-file-chunks?${params.toString()}`, {
        method: 'DELETE',
    });
}

/**
 * Deletes only relationships for a file (keeps chunks)
 */
export async function deleteFileRelationships(
    machineId: string,
    filePath: string
): Promise<{ deleted_relationships: number }> {
    const params = new URLSearchParams({
        machine_id: machineId,
        file_path: filePath,
    });
    return apiCall(`/api/graph/delete-file-relationships?${params.toString()}`, {
        method: 'DELETE',
    });
}

/**
 * Stores directory structure in Neo4j
 */
export async function storeInNeo4j(
    fileData: FileStructure,
    metadata: Record<string, any> = {},
    ragData: Record<string, any> = {},
    machineId: string | null = null,
    metadataOnly: boolean = false
): Promise<any> {
    return apiCall('/api/graph/store', {
        method: 'POST',
        body: JSON.stringify({
            data: fileData,
            metadata,
            rag_data: ragData,
            machine_id: machineId,
            metadata_only: metadataOnly,
        }),
    });
}

/**
 * Checks Neo4j health
 */
export async function checkNeo4jHealth(): Promise<any> {
    return apiCall('/health');
}

/**
 * Gets Neo4j statistics
 */
export async function getNeo4jStats(): Promise<any> {
    return apiCall('/api/graph/stats');
}
