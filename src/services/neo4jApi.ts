// Neo4j Backend API service
// Ported from RAG Frontend and converted to TypeScript

const NEO4J_API_URL = process.env.NEXT_PUBLIC_NEO4J_API_URL || 'http://localhost:8000';

import type {
  MachineRegistrationResponse,
  FileStructure,
  GraphStats,
  GraphVisualization,
  DirectoryResponse,
  UploadResponse,
  RAGStatus,
  RelationshipStats,
  SemanticRelationshipOptions,
  UploadOptions,
  ConnectorConfig,
  ConnectorConfigRequest,
  ConnectorPath,
  ConnectorPathRequest,
} from '@/types/neo4j';

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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

// Machine Registration
export const registerMachine = async (): Promise<MachineRegistrationResponse> => {
  return apiCall<MachineRegistrationResponse>('/api/register-machine', {
    method: 'POST',
  });
};

// Neo4j Graph Operations
export const storeInNeo4j = async (
  fileData: FileStructure,
  metadata: Record<string, any> = {},
  ragData: Record<string, any> = {},
  machineId: string | null = null,
  metadataOnly: boolean = false
): Promise<any> => {
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
};

export const getNeo4jStats = async (): Promise<GraphStats> => {
  return apiCall<GraphStats>('/api/graph/stats');
};

export const getDirectoryFromNeo4j = async (
  machineId: string,
  fullPath: string
): Promise<DirectoryResponse> => {
  const params = new URLSearchParams({
    machine_id: machineId,
    full_path: fullPath,
  });
  return apiCall<DirectoryResponse>(`/api/graph/directory?${params.toString()}`);
};

export const uploadDirectoryToNeo4j = async (
  machineId: string,
  fullPath: string,
  options: UploadOptions = {}
): Promise<UploadResponse> => {
  const params = new URLSearchParams({
    machine_id: machineId,
    full_path: fullPath,
  });
  if (options.chunk_size) params.append('chunk_size', options.chunk_size.toString());
  if (options.chunk_overlap) params.append('chunk_overlap', options.chunk_overlap.toString());
  
  return apiCall<UploadResponse>(`/api/graph/upload-directory?${params.toString()}`, {
    method: 'POST',
  });
};

export const clearNeo4jGraph = async (): Promise<any> => {
  return apiCall('/api/graph/clear', {
    method: 'POST',
  });
};

export const searchNeo4jFiles = async (
  name: string,
  source: string | null = null
): Promise<any> => {
  const params = new URLSearchParams({ name });
  if (source) params.append('source', source);
  return apiCall(`/api/graph/search?${params.toString()}`);
};

export const getNeo4jDirectoryTree = async (
  directoryId: string,
  maxDepth: number = 5
): Promise<any> => {
  const params = new URLSearchParams({ max_depth: maxDepth.toString() });
  return apiCall(`/api/graph/tree/${directoryId}?${params.toString()}`);
};

export const getNeo4jVisualization = async (): Promise<GraphVisualization> => {
  return apiCall<GraphVisualization>('/api/graph/visualization');
};

export const getNeo4jNodes = async (): Promise<any> => {
  return apiCall('/api/graph/nodes');
};

export const getNeo4jRelationships = async (): Promise<any> => {
  return apiCall('/api/graph/relationships');
};

export const checkNeo4jHealth = async (): Promise<any> => {
  return apiCall('/health');
};

// Semantic Relationships
export const createSemanticRelationships = async (
  machineId: string,
  fullPath: string,
  options: SemanticRelationshipOptions = {}
): Promise<any> => {
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
};

// Batch upload files for RAG processing
export const uploadFilesBatch = async (
  machineId: string,
  filePaths: string[],
  options: UploadOptions = {}
): Promise<UploadResponse> => {
  return apiCall<UploadResponse>('/api/graph/upload-files-batch', {
    method: 'POST',
    body: JSON.stringify({
      machine_id: machineId,
      file_paths: filePaths,
      chunk_size: options.chunk_size || 1200,
      chunk_overlap: options.chunk_overlap || 200,
    }),
  });
};

// Check RAG status of a file
export const getFileRagStatus = async (
  machineId: string,
  filePath: string
): Promise<{ status: RAGStatus['status']; chunks_count?: number }> => {
  const params = new URLSearchParams({
    machine_id: machineId,
    file_path: filePath,
  });
  return apiCall(`/api/graph/file-rag-status?${params.toString()}`);
};

export const getFileRelationshipStatus = async (
  machineId: string,
  filePath: string
): Promise<{ has_relationships: boolean; relationship_count: number; file_path: string; file_id: string }> => {
  const params = new URLSearchParams({
    machine_id: machineId,
    file_path: filePath,
  });
  return apiCall(`/api/graph/file-relationship-status?${params.toString()}`);
};

export const getRelationshipStats = async (
  relationshipType: string = 'SEMANTICALLY_SIMILAR'
): Promise<RelationshipStats> => {
  const params = new URLSearchParams({ relationship_type: relationshipType });
  return apiCall<RelationshipStats>(`/api/graph/relationship-stats?${params.toString()}`);
};

export const pruneRelationships = async (options: {
  similarity_threshold?: number;
  relationship_type?: string;
  max_relationships_per_chunk?: number;
} = {}): Promise<any> => {
  const params = new URLSearchParams();
  if (options.similarity_threshold !== undefined) {
    params.append('similarity_threshold', options.similarity_threshold.toString());
  }
  if (options.relationship_type) {
    params.append('relationship_type', options.relationship_type);
  }
  if (options.max_relationships_per_chunk !== undefined) {
    params.append('max_relationships_per_chunk', options.max_relationships_per_chunk.toString());
  }
  
  return apiCall(`/api/graph/prune-relationships?${params.toString()}`, {
    method: 'POST',
  });
};

export const searchRelationships = async (options: {
  min_similarity?: number;
  max_similarity?: number;
  relationship_type?: string;
  chunk_id?: string;
  limit?: number;
} = {}): Promise<any> => {
  const params = new URLSearchParams();
  if (options.min_similarity !== undefined) {
    params.append('min_similarity', options.min_similarity.toString());
  }
  if (options.max_similarity !== undefined) {
    params.append('max_similarity', options.max_similarity.toString());
  }
  if (options.relationship_type) {
    params.append('relationship_type', options.relationship_type);
  }
  if (options.chunk_id) {
    params.append('chunk_id', options.chunk_id);
  }
  if (options.limit !== undefined) {
    params.append('limit', options.limit.toString());
  }
  
  return apiCall(`/api/graph/search-relationships?${params.toString()}`);
};

// Connector Configuration
export const createConnectorConfig = async (
  config: ConnectorConfigRequest
): Promise<ConnectorConfig> => {
  return apiCall<ConnectorConfig>('/api/connectors', {
    method: 'POST',
    body: JSON.stringify(config),
  });
};

export const getConnectorConfigs = async (
  connectorType?: string
): Promise<ConnectorConfig[]> => {
  const params = connectorType ? `?connector_type=${connectorType}` : '';
  return apiCall<ConnectorConfig[]>(`/api/connectors${params}`);
};

export const deleteConnectorConfig = async (configId: string): Promise<any> => {
  return apiCall(`/api/connectors/${configId}`, {
    method: 'DELETE',
  });
};

export const getConnectorConfig = async (configId: string): Promise<ConnectorConfig> => {
  return apiCall<ConnectorConfig>(`/api/connectors/${configId}`);
};

// Connector Paths
export const getConnectorPaths = async (configId: string): Promise<ConnectorPath[]> => {
  return apiCall<ConnectorPath[]>(`/api/connectors/${configId}/paths`);
};

export const addConnectorPath = async (
  configId: string,
  path: ConnectorPathRequest
): Promise<ConnectorPath> => {
  return apiCall<ConnectorPath>(`/api/connectors/${configId}/paths`, {
    method: 'POST',
    body: JSON.stringify(path),
  });
};

export const deleteConnectorPath = async (configId: string, pathId: string): Promise<any> => {
  return apiCall(`/api/connectors/${configId}/paths/${pathId}`, {
    method: 'DELETE',
  });
};

// Delete file chunks and relationships
export const deleteFileChunks = async (filePath: string, machineId: string): Promise<any> => {
  const encodedPath = encodeURIComponent(filePath);
  const params = new URLSearchParams({ machine_id: machineId });
  return apiCall(`/api/graph/files/${encodedPath}/chunks?${params.toString()}`, {
    method: 'DELETE',
  });
};

export const deleteDirectoryChunks = async (directoryPath: string, machineId: string): Promise<any> => {
  const encodedPath = encodeURIComponent(directoryPath);
  const params = new URLSearchParams({ machine_id: machineId });
  return apiCall(`/api/graph/directories/${encodedPath}/chunks?${params.toString()}`, {
    method: 'DELETE',
  });
};

export const deleteFileRelationships = async (filePath: string, machineId: string): Promise<any> => {
  const encodedPath = encodeURIComponent(filePath);
  const params = new URLSearchParams({ machine_id: machineId });
  return apiCall(`/api/graph/files/${encodedPath}/relationships?${params.toString()}`, {
    method: 'DELETE',
  });
};

export const deleteDirectoryRelationships = async (directoryPath: string, machineId: string): Promise<any> => {
  const encodedPath = encodeURIComponent(directoryPath);
  const params = new URLSearchParams({ machine_id: machineId });
  return apiCall(`/api/graph/directories/${encodedPath}/relationships?${params.toString()}`, {
    method: 'DELETE',
  });
};

