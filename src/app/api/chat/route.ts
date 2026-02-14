import { NextResponse } from 'next/server';
import { queryRAG } from '@/lib/rag';

export async function POST(req: Request) {
    try {
        const { message, messages, conversationId } = await req.json();

        if (!message && (!messages || messages.length === 0)) {
            return NextResponse.json({ error: 'Message or messages array is required' }, { status: 400 });
        }

        // Support both single message and history
        const messageHistory = (messages && messages.length > 0) ? messages : [{ role: 'user', content: message }];

        const response = await queryRAG(messageHistory, conversationId);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in chat route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
