import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import CallSplitIcon from '@mui/icons-material/CallSplit';

export default function FanOutConfigPanel() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CallSplitIcon color="primary" />
                <Typography variant="h6">Fan Out</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    This node splits the workflow into parallel branches.
                    <br /><br />
                    Execution will proceed to all connected downstream nodes simultaneously.
                </Typography>
            </Box>
        </Box>
    );
}
