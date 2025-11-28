/**
 * Compatibility layer for the old neoSlice
 * This re-exports actions and creates a combined selector for backward compatibility
 * Allows gradual migration from the monolithic neoSlice to focused slices
 */

import { combineReducers } from '@reduxjs/toolkit';
import graphDataReducer, * as graphDataActions from './graphDataSlice';
import graphUiReducer, * as graphUiActions from './graphUiSlice';
import graphSelectionReducer, * as graphSelectionActions from './graphSelectionSlice';

// Combine the three slices into one reducer for backward compatibility
export const neoReducer = combineReducers({
    data: graphDataReducer,
    ui: graphUiReducer,
    selection: graphSelectionReducer,
});

// Re-export all actions from the focused slices
export const {
    setNeo4jDirectoryStructure,
    setRagStatuses,
    setRelationshipStatusForFile,
    setRelationshipStatuses,
    setChangedFiles,
    removeChangedFiles,
    clearGraphData,
} = graphDataActions;

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
} = graphUiActions;

export const {
    setSelectedForRag,
    setSelectedForGraph,
    toggleSelectedForGraph,
    setSelectedForDelete,
    setSelectedForDeleteRelationships,
    setRelationshipSettings,
    clearGraphSelection,
} = graphSelectionActions;

// Combined clear action
export const clearNeoResults = () => (dispatch: any) => {
    dispatch(clearGraphData());
    dispatch(clearGraphUi());
    dispatch(clearGraphSelection());
};

// Selector helper for backward compatibility
// Components can access state.neo.data.*, state.neo.ui.*, state.neo.selection.*
// Or we can create a flat selector that mimics the old structure
export const selectNeoState = (state: any) => ({
    // Data
    neo4jDirectoryStructure: state.neo.data.neo4jDirectoryStructure,
    ragStatuses: state.neo.data.ragStatuses,
    relationshipStatuses: state.neo.data.relationshipStatuses,
    changedFiles: state.neo.data.changedFiles,

    // UI
    isLoadingNeo4jStructure: state.neo.ui.isLoadingNeo4jStructure,
    isUploading: state.neo.ui.isUploading,
    uploadProgress: state.neo.ui.uploadProgress,
    uploadStatus: state.neo.ui.uploadStatus,
    isCreatingRelationships: state.neo.ui.isCreatingRelationships,
    relationshipStatus: state.neo.ui.relationshipStatus,
    isDeletingChunks: state.neo.ui.isDeletingChunks,
    isDeletingRelationships: state.neo.ui.isDeletingRelationships,
    deleteStatus: state.neo.ui.deleteStatus,
    hasEverCreatedGraph: state.neo.ui.hasEverCreatedGraph,

    // Selection
    selectedForRag: state.neo.selection.selectedForRag,
    selectedForGraph: state.neo.selection.selectedForGraph,
    selectedForDelete: state.neo.selection.selectedForDelete,
    selectedForDeleteRelationships: state.neo.selection.selectedForDeleteRelationships,
    relationshipSettings: state.neo.selection.relationshipSettings,
});

export default neoReducer;
