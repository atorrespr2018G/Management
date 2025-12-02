/**
 * Reusable action button component for file operations (upload, delete, etc.)
 */

import React from 'react';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export interface ActionButtonProps {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    loadingLabel?: string;
    variant?: 'contained' | 'outlined' | 'text';
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    size?: 'small' | 'medium' | 'large';
    count?: number;
    sx?: SxProps<Theme>;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    label,
    icon,
    onClick,
    disabled = false,
    loading = false,
    loadingLabel,
    variant = 'contained',
    color = 'primary',
    size = 'large',
    count,
    sx = {},
}) => {
    const displayLabel = count !== undefined ? `${label} (${count})` : label;

    return (
        <Button
            variant={variant}
            color={color}
            size={size}
            onClick={onClick}
            disabled={disabled || loading}
            startIcon={loading ? undefined : icon}
            sx={{ px: 1.3, ...sx }}
        >
            {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    {loadingLabel && (
                        <Typography variant="caption">{loadingLabel}</Typography>
                    )}
                </Stack>
            ) : (

                <Typography sx={{ whiteSpace: 'nowrap' }}>
                    {displayLabel}
                </Typography>
            )}
        </Button>
    );
};
