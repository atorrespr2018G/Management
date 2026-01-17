import { Handle, Position, NodeProps } from '@xyflow/react';
import { Paper, Typography, Box, IconButton } from '@mui/material';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function FanOutNode({ data, selected }: NodeProps) {
    const showDeleteButton = (data.showDeleteButton as boolean) || false;
    const onDelete = data.onDelete as (() => void) | undefined;

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

            {showDeleteButton && onDelete && (
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'error.dark',
                        },
                        width: 24,
                        height: 24,
                    }}
                >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CallSplitIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Fan Out
                </Typography>
            </Box>

            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </Paper>
    );
}
