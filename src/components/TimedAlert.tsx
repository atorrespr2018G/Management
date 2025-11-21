'use client';

import { useEffect, useState } from 'react';
import { Alert, Collapse } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';

type TimedAlertProps = {
    message?: string | null;
    severity?: AlertColor;
    durationMs?: number; // X seconds in ms
    onClose?: () => void; // optional: clear local / redux state
    sx?: any;
    autoHide?: boolean
};

export const TimedAlert: React.FC<TimedAlertProps> = ({
    message,
    severity = 'info',
    durationMs = 3000,
    onClose,
    sx,
    autoHide = true
}) => {
    const [open, setOpen] = useState(Boolean(message));

    useEffect(() => {
        if (!message) {
            setOpen(false);
            return;
        }

        setOpen(true);

        if (!autoHide) return;

        const timer = setTimeout(() => {
            setOpen(false);
            if (onClose) onClose();
        }, durationMs);

        return () => clearTimeout(timer);
    }, [message, durationMs, onClose]);

    if (!message) return null;

    return (
        <Collapse in={open}>
            <Alert
                severity={severity}
                sx={{ ...sx }}
                onClose={() => {
                    setOpen(false);
                    if (onClose) onClose();
                }}
            >
                {message}
            </Alert>
        </Collapse>
    );
};
