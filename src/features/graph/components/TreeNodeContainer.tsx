/**
 * Container component that connects TreeNode to Redux state.
 * Handles the data fetching and state management logic.
 */

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TreeNode } from '@/components/ui/TreeNode';
import type { FileStructure } from '@/types/neo4j';
import { buildStableId, sortTreeChildren } from '@/utils/treeUtils';
import {
    setSelectedForRag,
    toggleSelectedForGraph,
} from '@/store/slices/neoSlice';

export interface TreeNodeContainerProps {
    node: FileStructure;
    level?: number;
    isSelectable?: boolean;
    areActionsEnabled?: boolean;
    fetchNeo4jStructure?: () => Promise<void>;
}

export const TreeNodeContainer: React.FC<TreeNodeContainerProps> = ({
    node,
    level = 0,
    isSelectable = false,
    areActionsEnabled = true,
    fetchNeo4jStructure,
}) => {
    const dispatch = useDispatch();
    const machineId = localStorage.getItem('machineId') || '';

    const {
        selectedForRag,
        ragStatuses,
        selectedForGraph,
        relationshipStatuses,
    } = useSelector((state: any) => state.neo);

    const stableId = buildStableId(machineId, node);
    const isSelectedForRag = selectedForRag[stableId] || false;
    const ragStatus = ragStatuses[stableId] || 'none';
    const hasRelationships = relationshipStatuses[stableId] || false;
    const isSelectedForGraph = selectedForGraph[stableId] || false;

    const handleToggleSelection = () => {
        const newSelected = !isSelectedForRag;
        dispatch(setSelectedForRag({ node, machineId, stableId, newSelected }));
    };

    const handleToggleGraphSelection = () => {
        dispatch(toggleSelectedForGraph({ stableId }));
    };

    // Sort children
    const sortedChildren = node.children ? sortTreeChildren(node.children) : [];

    return (
        <TreeNode
            node={node}
            level={level}
            isSelected={isSelectedForRag}
            onToggleSelection={isSelectable ? handleToggleSelection : undefined}
            ragStatus={ragStatus}
            hasRelationships={hasRelationships}
            isSelectedForGraph={isSelectedForGraph}
            canSelectForGraph={!hasRelationships && areActionsEnabled}
            onToggleGraphSelection={handleToggleGraphSelection}
            showSelection={isSelectable}
            showGraphBadge={areActionsEnabled}
            maxNameLength={isSelectable ? 48 : 68}
        >
            {sortedChildren.map((child) => (
                <TreeNodeContainer
                    key={child.id}
                    node={child}
                    level={level + 1}
                    isSelectable={isSelectable}
                    areActionsEnabled={areActionsEnabled}
                    fetchNeo4jStructure={fetchNeo4jStructure}
                />
            ))}
        </TreeNode>
    );
};
