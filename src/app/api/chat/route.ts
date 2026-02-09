import { NextResponse } from 'next/server';
import { queryNotebookLM } from '@/lib/notebook';

export async function POST(req: Request) {
    try {
        const { message, conversationId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const response = await queryNotebookLM(message, conversationId);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in chat route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
