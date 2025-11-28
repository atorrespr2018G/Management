/**
 * Reusable status display component for showing operation results
 */

import React from 'react';
import { Alert, AlertColor } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

export interface StatusDisplayProps {
    message: string;
    severity?: AlertColor;
    autoHide?: boolean;
    durationMs?: number;
    onClose?: () => void;
    sx?: SxProps<Theme>;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({
    message,
    severity = 'info',
    autoHide = true,
    durationMs = 5000,
    onClose,
    sx = {},
}) => {
    React.useEffect(() => {
        if (autoHide && onClose) {
            const timer = setTimeout(onClose, durationMs);
            return () => clearTimeout(timer);
        }
    }, [autoHide, durationMs, onClose]);

    return (
        <Alert severity={severity} onClose={onClose} sx={sx}>
            {message}
        </Alert>
    );
};

/**
 * Helper function to determine severity from message content
 */
export function getStatusSeverity(message: string): AlertColor {
    const lower = message.toLowerCase();
    if (lower.startsWith('error') || lower.includes('error:') || lower.includes('failed')) {
        return 'error';
    }
    if (lower.startsWith('no ') || lower.includes('no items') || lower.includes('warning')) {
        return 'warning';
    }
    if (lower.includes('success') || lower.includes('created') || lower.includes('uploaded') || lower.includes('deleted')) {
        return 'success';
    }
    return 'info';
}
