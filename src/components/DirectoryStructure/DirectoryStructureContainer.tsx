// src/components/DirectoryStructureContainer.tsx
'use client';

import { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Stack,
    Typography,
    Chip,
    Box,
    Paper,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';

type DirectoryStructureContainerProps = {
    title: ReactNode;
    chipLabel?: string;
    chipColor?: ChipProps['color'];
    chipVariant?: ChipProps['variant'];
    minHeight?: number | string;
    actions?: ReactNode;      // right-side header actions (buttons/icons)
    alerts?: ReactNode;       // alerts under header
    children: ReactNode;      // tree / directory content
};

export const DirectoryStructureContainer = ({
    title,
    chipLabel,
    chipColor = 'default',
    chipVariant = 'outlined',
    minHeight = 1000,
    actions,
    alerts,
    children,
}: DirectoryStructureContainerProps) => {
    return (
        <Card
            sx={{
                maxHeight: minHeight,
                display: 'flex',
                flexDirection: 'column',
                mb: 3
            }}
        >
            <CardContent
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                }}
            >
                <CardHeader
                    sx={{ p: 0, pb: 2 }}
                    title={
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography whiteSpace="nowrap" fontSize={'1.25rem'} fontWeight={600}>
                                {title}
                            </Typography>
                            {chipLabel && (
                                <Chip
                                    label={chipLabel}
                                    size="small"
                                    color={chipColor}
                                    variant={chipVariant}
                                />
                            )}
                        </Stack>
                    }
                    action={actions}
                />

                {/* Alerts under header */}
                {alerts}

                {/* Scrollable content */}
                <Box sx={{ flex: 1, overflow: 'auto', mt: 1 }}>
                    <Paper
                        variant="outlined"
                        sx={{ p: 1.5, minHeight: '100%', bgcolor: '#f8f8f8' }}
                    >
                        {children}
                    </Paper>
                </Box>
            </CardContent>
        </Card>
    );
};
