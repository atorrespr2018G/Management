import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// ----------------------------------------------------------------------
// RAG Status Badge
// ----------------------------------------------------------------------

interface RagStatusBadgeProps {
    status: 'complete' | 'partial' | 'none';
}

export const RagStatusBadge: React.FC<RagStatusBadgeProps> = ({ status }) => {
    if (status === 'complete') {
        return <Chip label="Semantic" size="small" color="success" sx={{ ml: 1 }} />;
    } else if (status === 'partial') {
        return <Chip label="Semantic Partial" size="small" color="warning" />;
    }
    return null;
};

// ----------------------------------------------------------------------
// Graph Status Badge
// ----------------------------------------------------------------------

interface GraphStatusBadgeProps {
    isSelected: boolean;
    hasRelationships: boolean;
    canSelect: boolean;
    onToggle?: (e: React.MouseEvent) => void;
    showBadge?: boolean;
}

export const GraphStatusBadge: React.FC<GraphStatusBadgeProps> = ({
    isSelected,
    hasRelationships,
    canSelect,
    onToggle,
    showBadge = true,
}) => {
    if (!showBadge) return null;

    const chipProps = {
        label: 'Graph' as const,
        size: 'small' as const,
        icon: isSelected ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined,
        onClick: canSelect && onToggle
            ? (e: React.MouseEvent) => {
                e.stopPropagation();
                onToggle(e);
            }
            : undefined,
        sx: {
            cursor: canSelect ? 'pointer' : 'default',
            ...(isSelected && {
                border: '2px solid',
                borderColor: 'primary.main',
                backgroundColor: 'action.selected',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: 'action.hover' },
            }),
            ...(hasRelationships && { opacity: 0.9 }),
            ...(canSelect && {
                '&:hover': { opacity: 0.8, transform: 'scale(1.05)' },
                transition: 'all 0.2s ease-in-out',
            }),
            ...(!canSelect && {
                '&:hover': { cursor: 'not-allowed' },
            }),
        },
    };

    return hasRelationships
        ? <Chip {...chipProps} color="info" />
        : <Chip {...chipProps} variant="outlined" />;
};
