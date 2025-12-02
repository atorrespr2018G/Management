import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileStructure } from '@/types/neo4j';
import { getDescendantFileIds } from '@/utils/treeUtils';

// ============================================================================
// Type Definitions
// ============================================================================

export interface RelationshipSettings {
    similarity_threshold: number;
    top_k: number;
    same_directory_only: boolean;
    same_document_only: boolean;
}

export interface UploadProgress {
    done: number;
    total: number;
    totalChunks: number;
}

export interface NeoState {
    // Directory structure
    neo4jDirectoryStructure: FileStructure | null;
    isLoadingNeo4jStructure: boolean;

    // RAG (Retrieval-Augmented Generation) state
    selectedForRag: Record<string, boolean>; // key: machineId:fullPath -> boolean
    ragStatuses: Record<string, string>; // key: machineId:fullPath -> 'complete' | 'partial' | 'none'

    // Upload state
    uploadStatus: Record<string, string>; // key: directory id/fullPath -> message
    uploadProgress: UploadProgress;
    isUploading: boolean;

    // Graph relationship state
    selectedForGraph: Record<string, boolean>;
    hasEverCreatedGraph: boolean;
    relationshipStatuses: Record<string, boolean>;
    relationshipSettings: RelationshipSettings;
    isCreatingRelationships: boolean;
    relationshipStatus: Record<string, string>;

    // Delete state
    selectedForDelete: Record<string, boolean>;
    selectedForDeleteRelationships: Record<string, boolean>;
    isDeletingChunks: Record<string, boolean>;
    isDeletingRelationships: Record<string, boolean>;
    deleteStatus: Record<string, string>;

    // File change tracking
    changedFiles: Record<string, boolean>;

    // Error state
    error: string | null;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: NeoState = {
    neo4jDirectoryStructure: null,
    isLoadingNeo4jStructure: false,
    selectedForRag: {},
    ragStatuses: {},
    uploadStatus: {},
    uploadProgress: { done: 0, total: 0, totalChunks: 0 },
    isUploading: false,
    selectedForGraph: {},
    hasEverCreatedGraph: false,
    selectedForDelete: {},
    selectedForDeleteRelationships: {},
    relationshipStatuses: {},
    relationshipSettings: {
        similarity_threshold: 0.7,
        top_k: 10,
        same_directory_only: false,
        same_document_only: false,
    },
    isCreatingRelationships: false,
    relationshipStatus: {},
    isDeletingChunks: {},
    isDeletingRelationships: {},
    deleteStatus: {},
    changedFiles: {},
    error: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Updates selection state for a node and its descendants (for directories)
 */
function updateNodeSelection(
    state: NeoState,
    node: FileStructure,
    machineId: string,
    stableId: string,
    newSelected: boolean
): void {
    if (node.type === 'directory') {
        // For folders, select/deselect all descendants
        const descendantIds = getDescendantFileIds(node, machineId);
        descendantIds.forEach(id => {
            state.selectedForRag[id] = newSelected;
        });
        // Also select the folder itself
        state.selectedForRag[stableId] = newSelected;
    } else {
        // For files, just toggle
        state.selectedForRag[stableId] = newSelected;
    }
}

// ============================================================================
// Slice Definition
// ============================================================================

const neoSlice = createSlice({
    name: 'neo',
    initialState,
    reducers: {
        // Directory structure
        setNeo4jDirectoryStructure: (state, action: PayloadAction<FileStructure | null>) => {
            state.neo4jDirectoryStructure = action.payload;
        },

        setIsLoadingNeo4jStructure: (state, action: PayloadAction<boolean>) => {
            state.isLoadingNeo4jStructure = action.payload;
        },

        // RAG selection
        setSelectedForRag: (
            state,
            action: PayloadAction<{
                node: FileStructure;
                machineId: string;
                stableId: string;
                newSelected: boolean;
            } | Record<string, never>>
        ) => {
            if (Object.keys(action.payload).length > 0) {
                const { node, machineId, stableId, newSelected } = action.payload as {
                    node: FileStructure;
                    machineId: string;
                    stableId: string;
                    newSelected: boolean;
                };
                updateNodeSelection(state, node, machineId, stableId, newSelected);
            } else {
                state.selectedForRag = {};
            }
        },

        setRagStatuses: (
            state,
            action: PayloadAction<{ fileKey: string; status: string }>
        ) => {
            const { fileKey, status } = action.payload;
            state.ragStatuses[fileKey] = status;
        },

        // Upload state
        setUploadStatus: (
            state,
            action: PayloadAction<{ directoryNode: FileStructure; status: string }>
        ) => {
            const { directoryNode, status } = action.payload;
            const key = directoryNode.fullPath || directoryNode.id;
            state.uploadStatus[key] = status;
        },

        setUploadProgress: (state, action: PayloadAction<UploadProgress>) => {
            state.uploadProgress = action.payload;
        },

        setIsUploading: (state, action: PayloadAction<boolean>) => {
            state.isUploading = action.payload;
        },

        resetUploadProgress: (state) => {
            state.uploadProgress = { done: 0, total: 0, totalChunks: 0 };
        },

        // Graph selection
        setSelectedForGraph: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.selectedForGraph = action.payload;
        },

        toggleSelectedForGraph: (
            state,
            action: PayloadAction<{ stableId: string }>
        ) => {
            const { stableId } = action.payload;
            state.selectedForGraph[stableId] = !state.selectedForGraph[stableId];
        },

        setHasEverCreatedGraph: (state, action: PayloadAction<boolean>) => {
            state.hasEverCreatedGraph = action.payload;
        },

        // Relationship state
        setRelationshipStatuses: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.relationshipStatuses = action.payload;
        },

        setRelationshipStatusForFile: (
            state,
            action: PayloadAction<{ fileKey: string; hasRelationships: boolean }>
        ) => {
            const { fileKey, hasRelationships } = action.payload;
            state.relationshipStatuses[fileKey] = hasRelationships;
        },

        setRelationshipSettings: (state, action: PayloadAction<Partial<RelationshipSettings>>) => {
            state.relationshipSettings = {
                ...state.relationshipSettings,
                ...action.payload,
            };
        },

        setIsCreatingRelationships: (state, action: PayloadAction<boolean>) => {
            state.isCreatingRelationships = action.payload;
        },

        setRelationshipStatus: (state, action: PayloadAction<Record<string, string>>) => {
            state.relationshipStatus = action.payload;
        },

        // Delete state
        setSelectedForDelete: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.selectedForDelete = action.payload;
        },

        setSelectedForDeleteRelationships: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.selectedForDeleteRelationships = action.payload;
        },

        setIsDeletingChunks: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.isDeletingChunks = action.payload;
        },

        setIsDeletingRelationships: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.isDeletingRelationships = action.payload;
        },

        setDeleteStatus: (state, action: PayloadAction<Record<string, string>>) => {
            state.deleteStatus = action.payload;
        },

        // File change tracking
        setChangedFiles: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.changedFiles = action.payload;
        },

        removeChangedFiles: (state, action: PayloadAction<{ stableIds: string[] }>) => {
            const { stableIds } = action.payload;
            stableIds.forEach((id) => {
                delete state.changedFiles[id];
            });
        },

        // Status management
        clearStatusForDirectory: (state, action: PayloadAction<string>) => {
            const key = action.payload;
            delete state.uploadStatus[key];
        },

        // Reset state
        clearNeoResults: (state) => {
            state.selectedForRag = {};
            state.ragStatuses = {};
            state.uploadStatus = {};
            state.uploadProgress = { done: 0, total: 0, totalChunks: 0 };
            state.selectedForGraph = {};
            state.selectedForDelete = {};
            state.selectedForDeleteRelationships = {};
            state.relationshipStatuses = {};
            state.relationshipSettings = {
                similarity_threshold: 0.7,
                top_k: 10,
                same_directory_only: false,
                same_document_only: false,
            };
            state.isCreatingRelationships = false;
            state.relationshipStatus = {};
            state.isDeletingChunks = {};
            state.isDeletingRelationships = {};
            state.deleteStatus = {};
            state.changedFiles = {};
            state.error = null;
        },
    },
});

// ============================================================================
// Exports
// ============================================================================

export const {
    setNeo4jDirectoryStructure,
    setSelectedForRag,
    setRagStatuses,
    setUploadStatus,
    setUploadProgress,
    setIsUploading,
    resetUploadProgress,
    setIsLoadingNeo4jStructure,
    setSelectedForGraph,
    setHasEverCreatedGraph,
    setSelectedForDelete,
    setSelectedForDeleteRelationships,
    setRelationshipStatuses,
    setRelationshipStatusForFile,
    toggleSelectedForGraph,
    setRelationshipSettings,
    setIsCreatingRelationships,
    setRelationshipStatus,
    setIsDeletingChunks,
    setIsDeletingRelationships,
    setDeleteStatus,
    setChangedFiles,
    removeChangedFiles,
    clearStatusForDirectory,
    clearNeoResults,
} = neoSlice.actions;

export default neoSlice.reducer;
