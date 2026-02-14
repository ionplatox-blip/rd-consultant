import { ChatResponse } from './types';

// Configuration
const PINECONE_INDEX_NAME = 'rd-consultant-kb';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o-mini';
const TOP_K_RESULTS = 5;

const CONSULTANT_PERSONA = `Ты - профессиональный консультант по научно-исследовательским и опытно-конструкторским работам (НИОКР) в России. Твоя задача - помогать компаниям и исследователям с вопросами, связанными с:
- Налоговыми льготами и вычетами на НИОКР
- Грантами и субсидиями на исследования
- Оформлением документации для НИОКР
- Патентованием и защитой интеллектуальной собственности
- Организацией и проведением научных исследований

Отвечай кратко, по существу, используя только проверенную информацию из базы знаний. Если информации нет - честно скажи об этом.`;

interface PineconeMatch {
    id: string;
    score: number;
    metadata: {
        title: string;
        text: string;
        source_id: number;
        chunk_index: number;
    };
}

/**
 * Generate embedding for a text query using OpenAI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: query
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI Embedding API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

/**
 * Query Pinecone vector database for relevant chunks
 */
async function queryPinecone(embedding: number[]): Promise<PineconeMatch[]> {
    const pineconeApiKey = process.env.PINECONE_API_KEY;

    // Actual Pinecone index host (from pc.describe_index("rd-consultant-kb"))
    const indexHost = 'https://rd-consultant-kb-od91xh4.svc.aped-4627-b74a.pinecone.io';

    const response = await fetch(`${indexHost}/query`, {
        method: 'POST',
        headers: {
            'Api-Key': pineconeApiKey!,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            vector: embedding,
            topK: TOP_K_RESULTS,
            includeMetadata: true
        })
    });

    if (!response.ok) {
        throw new Error(`Pinecone query failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.matches || [];
}

/**
 * Generate answer using OpenAI chat completion with context
 */
async function generateAnswer(query: string, context: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: CHAT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: CONSULTANT_PERSONA
                },
                {
                    role: 'user',
                    content: `На основе следующего контекста из базы знаний, ответь на вопрос пользователя.

Контекст из базы знаний:
${context}

Вопрос пользователя: ${query}

Ответь кратко и конкретно, ссылаясь на информацию из контекста. Если в контексте нет информации для ответа, честно скажи об этом.`
                }
            ],
            temperature: 0.3,
            max_tokens: 800
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI Chat API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Main RAG query function
 * Replaces the NotebookLM MCP integration with autonomous vector search + LLM
 */
export async function queryRAG(message: string, conversationId?: string): Promise<ChatResponse> {
    try {
        // 1. Generate embedding for the user's query
        console.log('[RAG] Generating query embedding...');
        const queryEmbedding = await generateQueryEmbedding(message);

        // 2. Query Pinecone for relevant context
        console.log('[RAG] Searching vector database...');
        const matches = await queryPinecone(queryEmbedding);

        if (matches.length === 0) {
            return {
                answer: 'К сожалению, я не нашёл релевантной информации в базе знаний для ответа на ваш вопрос. Попробуйте переформулировать вопрос или уточнить детали.',
                sources: []
            };
        }

        // 3. Prepare context from top matches
        const context = matches
            .map((match, idx) =>
                `[Источник ${idx + 1}: ${match.metadata.title}]\n${match.metadata.text}\n`
            )
            .join('\n---\n\n');

        console.log(`[RAG] Found ${matches.length} relevant chunks`);

        // 4. Generate answer using GPT with context
        console.log('[RAG] Generating answer with GPT...');
        const answer = await generateAnswer(message, context);

        // 5. Extract unique sources
        const sources = [...new Set(matches.map(m => m.metadata.title))];

        return {
            answer,
            sources
        };

    } catch (error) {
        console.error('[RAG] Error:', error);
        return {
            answer: `Произошла ошибка при обработке запроса: ${error instanceof Error ? error.message : 'Unknown error'}`,
            sources: []
        };
    }
}
