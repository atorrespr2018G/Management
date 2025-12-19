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

export interface ChatResponse {
    response: string
    sources: Source[]
    conversation_id: string
}

// A simulated user identifier
export type UserId = string;

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string; // ISO string for serialization
    sources?: Source[];
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