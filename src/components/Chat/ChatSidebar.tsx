import React from 'react';
import { Box, Button, Typography, Divider, List, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { SessionItem } from './SessionItem';
import { ChatSession } from '@/types/chat';

interface ChatSidebarProps {
    sessions: ChatSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewChat: () => void;
    onDeleteSession: (sessionId: string) => void;
    isLoading?: boolean;
}

export const ChatSidebar = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewChat,
    onDeleteSession,
    isLoading = false,
}: ChatSidebarProps) => {
    return (
        <Box
            sx={{
                width: 280,
                height: '100%',
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
            }}
        >
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onNewChat}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                    New Chat
                </Button>
            </Box>

            <Divider />

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                    Recent Chats
                </Typography>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress size={24} />
                    </Box>
                ) : sessions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                        No chat history
                    </Typography>
                ) : (
                    sessions.map((session) => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            isActive={session.id === activeSessionId}
                            onClick={() => onSelectSession(session.id)}
                            onDelete={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                            }}
                        />
                    ))
                )}
            </Box>
        </Box>
    );
};
