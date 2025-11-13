// TypeScript types for Scanner functionality

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

