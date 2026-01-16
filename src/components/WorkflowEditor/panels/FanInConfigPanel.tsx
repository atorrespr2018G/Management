import React, { useState, useEffect } from 'react';
import { Box, Typography, Divider, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';

interface FanInNodeData {
    aggregationMode?: 'json_object' | 'concat';
    separator?: string;
}

interface FanInConfigPanelProps {
    data: FanInNodeData;
    onUpdate: (data: FanInNodeData) => void;
}

export default function FanInConfigPanel({ data, onUpdate }: FanInConfigPanelProps) {
    const [mode, setMode] = useState<'json_object' | 'concat'>(data.aggregationMode || 'json_object');
    const [separator, setSeparator] = useState(data.separator || '\n\n---\n\n');

    useEffect(() => {
        // Sync internal state if props change externally
        if (data.aggregationMode) setMode(data.aggregationMode);
        if (data.separator) setSeparator(data.separator);
    }, [data]);

    const handleChange = (key: keyof FanInNodeData, value: any) => {
        const newData = {
            ...data,
            aggregationMode: mode,
            separator: separator,
            [key]: value
        };

        // Update local state
        if (key === 'aggregationMode') setMode(value);
        if (key === 'separator') setSeparator(value);

        // Notify parent
        onUpdate(newData);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CallMergeIcon color="primary" />
                <Typography variant="h6">Fan In</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    Waits for all parallel branches to complete and aggregates their results.
                </Typography>

                <FormControl fullWidth size="small">
                    <InputLabel>Aggregation Mode</InputLabel>
                    <Select
                        value={mode}
                        label="Aggregation Mode"
                        onChange={(e) => handleChange('aggregationMode', e.target.value)}
                    >
                        <MenuItem value="json_object">JSON Object</MenuItem>
                        <MenuItem value="concat">Concatenate Text</MenuItem>
                    </Select>
                </FormControl>

                {mode === 'concat' && (
                    <TextField
                        label="Separator"
                        value={separator}
                        onChange={(e) => handleChange('separator', e.target.value)}
                        size="small"
                        helperText="String to insert between joined outputs"
                        fullWidth
                    />
                )}
            </Box>
        </Box>
    );
}
