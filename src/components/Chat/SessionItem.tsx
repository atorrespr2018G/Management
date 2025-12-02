import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ChatSession } from '@/types/chat';

interface SessionItemProps {
    session: ChatSession;
    isActive: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
}

export const SessionItem = ({ session, isActive, onClick, onDelete }: SessionItemProps) => {
    return (
        <Paper
            elevation={isActive ? 2 : 0}
            onClick={onClick}
            sx={{
                p: 1.5,
                mb: 1,
                cursor: 'pointer',
                bgcolor: isActive ? 'primary.light' : 'transparent',
                color: isActive ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                    bgcolor: isActive ? 'primary.light' : 'action.hover',
                    '& .delete-button': {
                        opacity: 1,
                    },
                },
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderRadius: 2,
                position: 'relative',
            }}
        >
            <ChatBubbleOutlineIcon fontSize="small" color={isActive ? 'inherit' : 'action'} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: isActive ? 600 : 400 }}>
                    {session.title || 'New Chat'}
                </Typography>
            </Box>
            <IconButton
                className="delete-button"
                size="small"
                onClick={onDelete}
                sx={{
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: isActive ? 'inherit' : 'action.active',
                    '&:hover': {
                        bgcolor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                    },
                }}
            >
                <DeleteOutlineIcon fontSize="small" color="error" />
            </IconButton>
        </Paper>
    );
};
