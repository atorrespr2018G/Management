import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatSession, ChatMessage, ChatSessionDetail, UserId } from '@/types/chat';
import { logoutUser } from './userSlice';

interface ChatState {
    sessions: ChatSession[];
    activeSessionId: string | null;
    activeSessionMessages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
}

const initialState: ChatState = {
    sessions: [],
    activeSessionId: null,
    activeSessionMessages: [],
    isLoading: false,
    error: null,
};

// Async Thunks
export const fetchSessions = createAsyncThunk(
    'chat/fetchSessions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chat/sessions', {
                credentials: 'include',
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Failed to fetch sessions' }));
                return rejectWithValue(error.detail || 'Failed to fetch sessions');
            }
            return await response.json() as ChatSession[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Network error');
        }
    }
);

export const createSession = createAsyncThunk(
    'chat/createSession',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/chat/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
            });

            console.log('chat/createSession')

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Failed to create session' }));
                return rejectWithValue(error.detail || 'Failed to create session');
            }

            console.log('Session created:');
            return await response.json() as ChatSessionDetail;
        } catch (error: any) {
            console.error('Create session error:', error);
            return rejectWithValue(error.message || 'Network error');
        }
    }
);

export const loadSession = createAsyncThunk(
    'chat/loadSession',
    async (sessionId: string) => {
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to load session');
        return await response.json() as ChatSessionDetail;
    }
);

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveSession: (state, action: PayloadAction<string>) => {
            state.activeSessionId = action.payload;
        },
        addMessage: (state, action: PayloadAction<ChatMessage>) => {
            state.activeSessionMessages.push(action.payload);
        },
        clearActiveSession: (state) => {
            state.activeSessionId = null;
            state.activeSessionMessages = [];
        },
    },
    extraReducers: (builder) => {
        // Fetch Sessions
        builder.addCase(fetchSessions.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        });
        builder.addCase(fetchSessions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.sessions = action.payload;
        });
        builder.addCase(fetchSessions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch sessions';
        });

        // Create Session
        builder.addCase(createSession.fulfilled, (state, action) => {
            state.sessions.unshift(action.payload);
            state.activeSessionId = action.payload.id;
            state.activeSessionMessages = [];
        });

        // Load Session
        builder.addCase(loadSession.pending, (state) => {
            state.isLoading = true;
            state.error = null;
            state.activeSessionMessages = []; // Clear previous messages while loading
        });
        builder.addCase(loadSession.fulfilled, (state, action) => {
            state.isLoading = false;
            state.activeSessionId = action.payload.id;
            state.activeSessionMessages = action.payload.messages;
        });
        builder.addCase(loadSession.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to load session';
        });

        // Delete Session
        builder.addCase(deleteSession.fulfilled, (state, action) => {
            state.sessions = state.sessions.filter(session => session.id !== action.payload);
            if (state.activeSessionId === action.payload) {
                state.activeSessionId = null;
                state.activeSessionMessages = [];
            }
        });

        // Clear chat data on logout
        builder.addCase(logoutUser.fulfilled, () => {
            return initialState;
        });
    },
});

export const deleteSession = createAsyncThunk(
    'chat/deleteSession',
    async (sessionId: string) => {
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete session');
        return sessionId;
    }
);

export const { setActiveSession, addMessage, clearActiveSession } = chatSlice.actions;
export default chatSlice.reducer;
