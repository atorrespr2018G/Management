import type { FileStructure } from './neo4j';
import type { ScanResult, ScanResults } from './scanner';

export interface ScannedDirectoryStructureCardProps {
    /** Root of the scanned directory tree */
    node: FileStructure
    /** Current machine id (used to enable/disable Store in Neo4j button) */
    machineId: string | null
    /** Status message for storing in Neo4j (success/error/info) */
    storeMessage: string | undefined
    /** Whether we are currently storing the directory metadata in Neo4j */
    isStoring: boolean
    /** Trigger storing the scanned directory in Neo4j */
    onStoreInNeo4j: () => void
    /** Fetch Graph Data to render new/deleted relationships */
    fetchNeo4jStructure?: () => Promise<void>
}

export interface ScanResultsDisplayProps {
    scanResults: ScanResults
    onClearResults?: () => void
    onScanAgain?: () => void
    sx?: {}
    areActionsEnabled?: boolean
}

export interface DirectoryStructuresPanelProps {
    /** Root of the scanned directory tree */
    node: FileStructure;
    /** Current machine id (used to enable/disable Store in Neo4j button) */
    machineId: string | null;

    /** Whether we are currently storing the directory metadata in Neo4j */
    isStoring: boolean;

    /** Status message for storing in Neo4j (success/error/info) */
    storeMessage?: string;

    /** Trigger storing the scanned directory in Neo4j */
    onStoreInNeo4j: () => void;

    /** Fetch Graph Data to render new/deleted relationships */
    onGraphDataChanged?: () => Promise<void>;
    /** Fetch Graph Data to render new/deleted relationships */
    fetchNeo4jStructure?: () => Promise<void>
}

export interface DirectoryStructuresProps {
    /** Root of the scanned directory tree */
    node: FileStructure;
    /** Current machine id (used to enable/disable Store in Neo4j button) */
    machineId: string | null;

    /** Whether we are currently storing the directory metadata in Neo4j */
    isStoring: boolean;

    /** Status message for storing in Neo4j (success/error/info) */
    storeMessage?: string;

    /** Trigger storing the scanned directory in Neo4j */
    onStoreInNeo4j: () => void;

    /** Fetch Graph Data to render new/deleted relationships */
    onGraphDataChanged?: () => Promise<void>

    /** Fetch Graph Data to render new/deleted relationships */
    fetchNeo4jStructure?: () => Promise<void>

    /** Enables or disables all Neo4j action buttons in NeoDirectoryStructureCard */
    areActionsEnabled?: boolean

    /** Clears Neo4j upload/delete status for the given directory key after alerts close */
    onResetNeoStatus?: (key: string) => void;
}