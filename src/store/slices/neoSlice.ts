import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FileNode, FileStructure } from '@/types/neo4j';
import { buildStableId } from '@/utils/treeHelpers';

// Get all descendant file IDs (recursive)
const getDescendantFileIds = (node: FileStructure, machineId: string) => {
    const ids = [];
    if (node.type === 'file') {
        ids.push(buildStableId(machineId, node));
    }
    if (node.children) {
        node.children.forEach((child: FileStructure) => {
            ids.push(...getDescendantFileIds(child, machineId));
        });
    }
    return ids;
};

const initialState = {
    neo4jDirectoryStructure: null,
    isLoadingNeo4jStructure: false,   // isLoadingNeo4jStructure
    selectedForRag: {}, // key: machineId:fullPath -> boolean
    ragStatuses: {},    // key: machineId:fullPath -> 'complete' | 'partial' | 'none'
    uploadStatus: {},   // key: directory id/fullPath -> message
    uploadProgress: { done: 0, total: 0, totalChunks: 0 }, // Upload progress tracking
    isUploading: false,
    selectedForGraph: {} as Record<string, boolean>,
    selectedForDelete: {} as Record<string, boolean>,
    selectedForDeleteRelationships: {} as Record<string, boolean>,
    relationshipStatuses: {} as Record<string, boolean>,
    relationshipSettings: {
        similarity_threshold: 0.7,
        top_k: 10,
        same_directory_only: false,
        same_document_only: false,
    },
    isCreatingRelationships: false,
    relationshipStatus: {} as Record<string, string>,
    isDeletingChunks: {} as Record<string, boolean>,
    isDeletingRelationships: {} as Record<string, boolean>,
    deleteStatus: {} as Record<string, string>,
    changedFiles: {} as Record<string, boolean>,
    error: null,
};

const neoSlice = createSlice({
    name: 'neo',
    initialState,
    reducers: {
        setNeo4jDirectoryStructure: (state, action) => {
            state.neo4jDirectoryStructure = action.payload;
        },
        setSelectedForRag: (state: any, action) => {
            if (Object.keys(action.payload).length > 0) {
                // console.log('action.payload', action.payload)
                const { node, machineId, stableId, newSelected } = action.payload;

                // console.log('\nsetSelectedForRag: node', node)
                // return next;
                if (node.type === 'directory') {
                    // For folders, select/deselect all descendants
                    const descendantIds = getDescendantFileIds(node, machineId);
                    // console.log('descendantIds', descendantIds)
                    descendantIds.forEach(id => {
                        state.selectedForRag[id] = newSelected;
                    });
                    // Also select the folder itself
                    state.selectedForRag[stableId] = newSelected;
                } else {
                    // For files, just toggle
                    state.selectedForRag[stableId] = newSelected;
                }

                // console.log('state.selectedForRag', state.selectedForRag)
                // state.selectedForRag = action.payload;
            }
            else state.selectedForRag = {}
        },
        setRagStatuses: (state: any, action) => {
            const { fileKey, status } = action.payload
            state.ragStatuses[fileKey] = status;
        },
        setUploadStatus: (state, action) => {
            // state.uploadStatus = action.payload;
            const { directoryNode, status } = action.payload;
            const key = directoryNode.fullPath || directoryNode.id;

            state.uploadStatus = {
                ...state.uploadStatus,
                [key]: status,
            };
        },
        setUploadProgress: (state, action) => {
            // state.uploadProgress = action.payload;
            console.log('-payload', action.payload)

            const { done, total, totalChunks } = action.payload;
            state.uploadProgress = {
                ...state.uploadProgress,
                done,
                total,
                totalChunks,
            };
        },
        setIsUploading: (state, action) => {
            state.isUploading = action.payload as boolean;
        },
        resetUploadProgress: (state) => {
            state.uploadProgress = { done: 0, total: 0, totalChunks: 0 };
        },
        setIsLoadingNeo4jStructure: (state, action) => {
            state.isLoadingNeo4jStructure = action.payload;
        },
        setSelectedForGraph: (state, action) => {
            // payload: Record<string, boolean>
            state.selectedForGraph = action.payload;
        },
        setSelectedForDelete: (state, action) => {
            // payload: Record<string, boolean>
            state.selectedForDelete = action.payload;
        },
        setSelectedForDeleteRelationships: (state, action) => {
            // payload: Record<string, boolean>
            state.selectedForDeleteRelationships = action.payload;
        },
        setRelationshipStatuses: (state, action) => {
            // payload: Record<string, boolean>  (full map)
            state.relationshipStatuses = action.payload;
        },
        // Better: update ONE key
        setRelationshipStatusForFile: (
            state,
            action: PayloadAction<{ fileKey: string; hasRelationships: boolean }>
        ) => {
            const { fileKey, hasRelationships } = action.payload;
            state.relationshipStatuses[fileKey] = hasRelationships;
        },

        toggleSelectedForGraph: (
            state,
            action: PayloadAction<{ stableId: string }>
        ) => {
            const { stableId } = action.payload;
            state.selectedForGraph[stableId] = !state.selectedForGraph[stableId];
        },

        setRelationshipSettings: (state, action) => {
            // payload: Partial<typeof state.relationshipSettings>
            state.relationshipSettings = {
                ...state.relationshipSettings,
                ...action.payload,
            };
        },
        setIsCreatingRelationships: (state, action) => {
            // payload: boolean
            state.isCreatingRelationships = action.payload;
        },
        setRelationshipStatus: (state, action) => {
            // payload: Record<string, string> (full map)
            state.relationshipStatus = action.payload;
        },
        setIsDeletingChunks: (state, action) => {
            // payload: Record<string, boolean> (full map)
            state.isDeletingChunks = action.payload;
        },
        setIsDeletingRelationships: (state, action) => {
            // payload: Record<string, boolean> (full map)
            state.isDeletingRelationships = action.payload;
        },
        setDeleteStatus: (state, action) => {
            // payload: Record<string, string> (full map)
            state.deleteStatus = action.payload;
        },
        setChangedFiles: (state, action) => {
            state.changedFiles = action.payload;
        },
        removeChangedFiles: (state, action: PayloadAction<{ stableIds: string[] }>) => {
            const { stableIds } = action.payload;
            stableIds.forEach((id) => {
                delete state.changedFiles[id];
            });
        },
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
    clearNeoResults,
} = neoSlice.actions;

export default neoSlice.reducer;
