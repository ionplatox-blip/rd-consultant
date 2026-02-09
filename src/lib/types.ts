export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    sources?: string[]; // For citation handling if we implement it
}

export interface ChatResponse {
    answer: string;
    conversationId?: string;
    sources?: string[];
    error?: string;
}
