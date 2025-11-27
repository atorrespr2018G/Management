import React from 'react';
import { Box, Typography, IconButton, Paper } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { ChatSession } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface SessionItemProps {
    session: ChatSession;
    isActive: boolean;
    onClick: () => void;
}

export const SessionItem = ({ session, isActive, onClick }: SessionItemProps) => {
    console.log('session', session)

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
                },
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                borderRadius: 2,
            }}
        >
            <ChatBubbleOutlineIcon fontSize="small" color={isActive ? 'inherit' : 'action'} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="subtitle2" noWrap sx={{ fontWeight: isActive ? 600 : 400 }}>
                    {session.title || 'New Chat'}
                </Typography>
                {/* <Typography variant="caption" display="block" noWrap sx={{ opacity: 0.7 }}>
                    {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                </Typography> */}
            </Box>
        </Paper>
    );
};
