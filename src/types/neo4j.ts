// TypeScript types for Neo4j API

export interface UseNeo4jStructureOptions {
  /** Current machineId (from useMachineId or elsewhere) */
  machineId: string | null;
  /** Scanned root node whose structure we want to compare against Neo4j */
  node?: FileStructure | null;
}

export interface UseStoreDirectoryInNeo4jOptions {
  scanData: FileStructure | null;
  metadata?: Record<string, any>;
  machineId: string | null;
  /** Called after a successful store (e.g. refresh structure / graph) */
  onAfterStore?: () => Promise<void> | void;
}

export interface MachineRegistrationResponse {
  machineId: string;
  isNew: boolean;
}

export interface FileStructure {
  id: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  fullPath?: string;
  relativePath?: string;
  children?: FileStructure[];
  hash?: string; // SHA256 hash of file content for change detection
  modifiedTime?: string; // ISO string of modification time
  extension?: string;
  createdAt?: string;
  source?: string;
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
  scope_file_id?: string;
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

export interface ConnectorConfig {
  id: string;
  connector_type: string;
  name: string;
  directory_path: string;
  machine_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConnectorConfigRequest {
  connector_type: string;
  name: string;
  directory_path: string;
  machine_id?: string;
  metadata?: Record<string, any>;
}

export interface ConnectorPath {
  id: string;
  path: string;
  name: string;
  created_at: string;
}

export interface ConnectorPathRequest {
  path: string;
  name?: string;
}

export interface DatabaseConfig {
  id: string;
  database_type: string;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  schema_name?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConfigRequest {
  database_type: string;
  name: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  password: string;
  schema_name?: string;
  metadata?: Record<string, any>;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface SchemaInfo {
  database_name: string;
  schema_name: string;
  tables: TableInfo[];
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  primary_keys: string[];
  foreign_keys: ForeignKeyInfo[];
}

export interface ColumnInfo {
  name: string;
  data_type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key: ForeignKeyInfo | null;
  default: string | null;
}

export interface ForeignKeyInfo {
  name: string;
  constrained_columns: string[];
  referred_table: string;
  referred_columns: string[];
}

