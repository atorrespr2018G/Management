// TypeScript types for Scanner functionality

import { FileStructure } from './neo4j'

export type ScanSource = 'local' | 'drive' | 'sharepoint';

export interface ScanResult {
  data: FileStructure;
  metadata?: {
    source: string;
    scannedAt: string;
    totalFiles: number;
    totalSize: number;
  };
}

// duplicates ... choose to delete in the future
export interface ScanResults {
  data: FileStructure
  totalFiles?: number
  totalFolders?: number
  source?: string
  metadata?: Record<string, any>
}

export interface ScannerState {
  selectedSource: ScanSource | null;
  scanResults: ScanResult | null;
  isLoading: boolean;
  error: string | null;
  authStateId: string | null;
}

export interface MachineState {
  machineId: string | null;
  isLoading: boolean;
  error: string | null;
}

