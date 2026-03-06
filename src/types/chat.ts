export interface Source {
    file_name?: string | null
    file_path?: string | null
    directory_name?: string | null
    text?: string | null
    similarity?: number | null
    hybrid_score?: number | null
    metadata?: {
        vector_score?: number
        keyword_score?: number
        path_score?: number
        hop_count?: number
        hop_penalty?: number
        chunk_index?: number
        file_id?: string
        chunk_size?: number
    } | null
}

/** Phase 1 (HPe) required selection: campaign or market options for user to click. */
export interface Phase1RequiredSelection {
    type: 'market' | 'campaign'
    options: string[]
}

export interface ChatResponse {
    response: string
    sources: Source[]
    conversation_id: string
    phase1_required_selection?: Phase1RequiredSelection
}

// A simulated user identifier
export type UserId = string;

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string; // ISO string for serialization
    sources?: Source[];
    /** When present, UI shows clickable options (e.g. market) for the user to select. */
    phase1_required_selection?: Phase1RequiredSelection;
}

export interface ChatSession {
    id: string;
    userId: UserId;
    title: string;
    createdAt: string;
    updatedAt: string;
    preview: string; // Last message snippet for the sidebar
}

export interface ChatSessionDetail extends ChatSession {
    messages: ChatMessage[];
}