// TypeScript types for Neo4j API

export interface MachineRegistrationResponse {
  machineId: string;
  isNew: boolean;
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  fullPath?: string;
  relativePath?: string;
  children?: FileNode[];
  extension?: string;
  modified?: string;
}

export interface FileStructure {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  fullPath?: string;
  relativePath?: string;
  children?: FileStructure[];
}

export interface GraphStats {
  total_nodes: number;
  total_files: number;
  total_directories: number;
  sources?: string[];
  neo4j_connected?: boolean;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  size?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type?: string;
}

export interface GraphVisualization {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface DirectoryResponse {
  found: boolean;
  structure?: FileStructure;
  message?: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  processed_files?: number;
  created_chunks?: number;
  errors?: string[];
}

export interface RAGStatus {
  status: 'complete' | 'partial' | 'none';
  chunks_count?: number;
}

export interface RelationshipStats {
  count: number;
  relationship_type: string;
}

export interface SemanticRelationshipOptions {
  similarity_threshold?: number;
  top_k?: number;
  same_document_only?: boolean;
  same_directory_only?: boolean;
}

export interface UploadOptions {
  chunk_size?: number;
  chunk_overlap?: number;
}

export interface HealthCheck {
  status: string;
  neo4j_connected: boolean;
  error?: string;
}

