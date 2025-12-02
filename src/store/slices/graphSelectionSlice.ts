/**
 * Graph Selection Slice - manages user selections (RAG, Graph, Delete)
 * Separated from data and UI for cleaner state management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FileStructure } from '@/types/neo4j';
import { getDescendantFileIds } from '@/utils/treeUtils';
import { buildStableId } from '@/utils/treeUtils';

interface GraphSelectionState {
    selectedForRag: Record<string, boolean>;
    selectedForGraph: Record<string, boolean>;
    selectedForDelete: Record<string, boolean>;
    selectedForDeleteRelationships: Record<string, boolean>;
    relationshipSettings: {
        similarity_threshold: number;
        top_k: number;
        same_directory_only: boolean;
        same_document_only: boolean;
    };
}

const initialState: GraphSelectionState = {
    selectedForRag: {},
    selectedForGraph: {},
    selectedForDelete: {},
    selectedForDeleteRelationships: {},
    relationshipSettings: {
        similarity_threshold: 0.7,
        top_k: 10,
        same_directory_only: false,
        same_document_only: false,
    },
};

const graphSelectionSlice = createSlice({
    name: 'graphSelection',
    initialState,
    reducers: {
        setSelectedForRag: (state, action: PayloadAction<any>) => {
            if (Object.keys(action.payload).length > 0) {
                const { node, machineId, stableId, newSelected } = action.payload;

                if (node.type === 'directory') {
                    // For folders, select/deselect all descendants
                    const descendantIds = getDescendantFileIds(node, machineId);
                    descendantIds.forEach((id) => {
                        state.selectedForRag[id] = newSelected;
                    });
                    // Also select the folder itself
                    state.selectedForRag[stableId] = newSelected;
                } else {
                    // For files, just toggle
                    state.selectedForRag[stableId] = newSelected;
                }
            } else {
                state.selectedForRag = {};
            }
        },
        setSelectedForGraph: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.selectedForGraph = action.payload;
        },
        toggleSelectedForGraph: (state, action: PayloadAction<{ stableId: string }>) => {
            const { stableId } = action.payload;
            state.selectedForGraph[stableId] = !state.selectedForGraph[stableId];
        },
        setSelectedForDelete: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.selectedForDelete = action.payload;
        },
        setSelectedForDeleteRelationships: (
            state,
            action: PayloadAction<Record<string, boolean>>
        ) => {
            state.selectedForDeleteRelationships = action.payload;
        },
        setRelationshipSettings: (
            state,
            action: PayloadAction<Partial<GraphSelectionState['relationshipSettings']>>
        ) => {
            state.relationshipSettings = {
                ...state.relationshipSettings,
                ...action.payload,
            };
        },
        clearGraphSelection: (state) => {
            state.selectedForRag = {};
            state.selectedForGraph = {};
            state.selectedForDelete = {};
            state.selectedForDeleteRelationships = {};
            state.relationshipSettings = {
                similarity_threshold: 0.7,
                top_k: 10,
                same_directory_only: false,
                same_document_only: false,
            };
        },
    },
});

export const {
    setSelectedForRag,
    setSelectedForGraph,
    toggleSelectedForGraph,
    setSelectedForDelete,
    setSelectedForDeleteRelationships,
    setRelationshipSettings,
    clearGraphSelection,
} = graphSelectionSlice.actions;

export default graphSelectionSlice.reducer;
