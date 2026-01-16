import { Handle, Position, NodeProps } from '@xyflow/react';
import { Paper, Typography, Box } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';

export default function FanInNode({ data, selected }: NodeProps) {
    return (
        <Paper
            elevation={selected ? 4 : 2}
            sx={{
                padding: '10px 15px',
                minWidth: 150,
                backgroundColor: '#e8eaf6', // Light Indigo
                border: '1px solid',
                borderColor: selected ? 'primary.main' : '#c5cae9',
                borderRadius: '8px',
                textAlign: 'center',
                position: 'relative',
            }}
        >
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CallMergeIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Fan In
                </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                Wait for all
            </Typography>

            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </Paper>
    );
}
