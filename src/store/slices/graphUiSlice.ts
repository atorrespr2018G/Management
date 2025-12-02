/**
 * Graph UI Slice - manages transient UI state (loading, progress, status messages)
 * Separated from data for cleaner state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GraphUiState {
    isLoadingNeo4jStructure: boolean;
    isUploading: boolean;
    uploadProgress: { done: number; total: number; totalChunks: number };
    uploadStatus: Record<string, string>; // directory path -> status message
    isCreatingRelationships: boolean;
    relationshipStatus: Record<string, string>; // directory path -> status message
    isDeletingChunks: Record<string, boolean>; // directory path -> is deleting
    isDeletingRelationships: Record<string, boolean>; // directory path -> is deleting
    deleteStatus: Record<string, string>; // directory path -> status message
    hasEverCreatedGraph: boolean;
}

const initialState: GraphUiState = {
    isLoadingNeo4jStructure: false,
    isUploading: false,
    uploadProgress: { done: 0, total: 0, totalChunks: 0 },
    uploadStatus: {},
    isCreatingRelationships: false,
    relationshipStatus: {},
    isDeletingChunks: {},
    isDeletingRelationships: {},
    deleteStatus: {},
    hasEverCreatedGraph: false,
};

const graphUiSlice = createSlice({
    name: 'graphUi',
    initialState,
    reducers: {
        setIsLoadingNeo4jStructure: (state, action: PayloadAction<boolean>) => {
            state.isLoadingNeo4jStructure = action.payload;
        },
        setIsUploading: (state, action: PayloadAction<boolean>) => {
            state.isUploading = action.payload;
        },
        setUploadProgress: (
            state,
            action: PayloadAction<{ done: number; total: number; totalChunks: number }>
        ) => {
            state.uploadProgress = action.payload;
        },
        resetUploadProgress: (state) => {
            state.uploadProgress = { done: 0, total: 0, totalChunks: 0 };
        },
        setUploadStatus: (
            state,
            action: PayloadAction<{ directoryNode: { fullPath?: string; id: string }; status: string }>
        ) => {
            const { directoryNode, status } = action.payload;
            const key = directoryNode.fullPath || directoryNode.id;
            state.uploadStatus[key] = status;
        },
        setIsCreatingRelationships: (state, action: PayloadAction<boolean>) => {
            state.isCreatingRelationships = action.payload;
        },
        setRelationshipStatus: (state, action: PayloadAction<Record<string, string>>) => {
            state.relationshipStatus = action.payload;
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
        setHasEverCreatedGraph: (state, action: PayloadAction<boolean>) => {
            state.hasEverCreatedGraph = action.payload;
        },
        clearStatusForDirectory: (state, action: PayloadAction<string>) => {
            const key = action.payload;
            delete state.uploadStatus[key];
            delete state.deleteStatus[key];
            delete state.relationshipStatus[key];
        },
        clearGraphUi: (state) => {
            state.isLoadingNeo4jStructure = false;
            state.isUploading = false;
            state.uploadProgress = { done: 0, total: 0, totalChunks: 0 };
            state.uploadStatus = {};
            state.isCreatingRelationships = false;
            state.relationshipStatus = {};
            state.isDeletingChunks = {};
            state.isDeletingRelationships = {};
            state.deleteStatus = {};
        },
    },
});

export const {
    setIsLoadingNeo4jStructure,
    setIsUploading,
    setUploadProgress,
    resetUploadProgress,
    setUploadStatus,
    setIsCreatingRelationships,
    setRelationshipStatus,
    setIsDeletingChunks,
    setIsDeletingRelationships,
    setDeleteStatus,
    setHasEverCreatedGraph,
    clearStatusForDirectory,
    clearGraphUi,
} = graphUiSlice.actions;

export default graphUiSlice.reducer;
