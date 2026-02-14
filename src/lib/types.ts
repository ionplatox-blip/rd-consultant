export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: Date;
    sources?: string[];
    followups?: string[];
}

export interface ChatResponse {
    answer: string;
    conversationId?: string;
    sources?: string[];
    followups?: string[];
    error?: string;
}
