/**
 * Graph Data Slice - manages the actual data (directory structure, files)
 * Separated from UI state for better maintainability
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FileStructure } from '@/types/neo4j';

interface GraphDataState {
    neo4jDirectoryStructure: FileStructure | null;
    ragStatuses: Record<string, string>; // 'complete' | 'partial' | 'none'
    relationshipStatuses: Record<string, boolean>;
    changedFiles: Record<string, { reason: 'metadata' | 'content' | 'new' }>;
}

const initialState: GraphDataState = {
    neo4jDirectoryStructure: null,
    ragStatuses: {},
    relationshipStatuses: {},
    changedFiles: {},
};

const graphDataSlice = createSlice({
    name: 'graphData',
    initialState,
    reducers: {
        setNeo4jDirectoryStructure: (state, action: PayloadAction<FileStructure | null>) => {
            state.neo4jDirectoryStructure = action.payload;
        },
        setRagStatuses: (state, action: PayloadAction<{ fileKey: string; status: string }>) => {
            const { fileKey, status } = action.payload;
            state.ragStatuses[fileKey] = status;
        },
        setRelationshipStatusForFile: (
            state,
            action: PayloadAction<{ fileKey: string; hasRelationships: boolean }>
        ) => {
            const { fileKey, hasRelationships } = action.payload;
            state.relationshipStatuses[fileKey] = hasRelationships;
        },
        setRelationshipStatuses: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.relationshipStatuses = action.payload;
        },
        setChangedFiles: (state, action: PayloadAction<Record<string, any>>) => {
            state.changedFiles = action.payload;
        },
        removeChangedFiles: (state, action: PayloadAction<{ stableIds: string[] }>) => {
            const { stableIds } = action.payload;
            stableIds.forEach((id) => {
                delete state.changedFiles[id];
            });
        },
        clearGraphData: (state) => {
            state.neo4jDirectoryStructure = null;
            state.ragStatuses = {};
            state.relationshipStatuses = {};
            state.changedFiles = {};
        },
    },
});

export const {
    setNeo4jDirectoryStructure,
    setRagStatuses,
    setRelationshipStatusForFile,
    setRelationshipStatuses,
    setChangedFiles,
    removeChangedFiles,
    clearGraphData,
} = graphDataSlice.actions;

export default graphDataSlice.reducer;
