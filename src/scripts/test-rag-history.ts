import fs from 'fs';
import path from 'path';
import { queryRAG } from '../lib/rag';
import { Message } from '../lib/types';

// Manually load .env since we don't have dotenv package
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            envContent.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    process.env[key] = value;
                }
            });
            console.log('✅ Environment variables loaded from .env');
        } else {
            console.warn('⚠️ .env file not found');
        }
    } catch (e) {
        console.error('Error loading .env:', e);
    }
}

async function runTest() {
    loadEnv();
    console.log('🚀 Testing RAG history support...');

    // 1. First question: General inquiry about tax benefits
    console.log('\n--- Turn 1: General Question ---');
    const msg1: Message = { id: 'test-1', role: 'user', content: 'Какие есть налоговые льготы для НИОКР?' };
    const history: Message[] = [msg1];

    console.log(`User: "${msg1.content}"`);
    console.log('Generating answer...');

    const response1 = await queryRAG(history);
    console.log(`AI Answer (Preview): ${response1.answer.substring(0, 150)}...`);

    // Add AI response to history
    history.push({ id: 'ai-1', role: 'assistant', content: response1.answer });

    // 2. Second question: Context dependent "for this"
    console.log('\n--- Turn 2: Follow-up Question (Contextual) ---');
    const msg2: Message = { id: 'test-2', role: 'user', content: 'Какие документы для этого нужны?' };
    history.push(msg2);

    console.log(`User: "${msg2.content}"`);
    console.log('Generating answer with context...');

    const response2 = await queryRAG(history);

    console.log(`AI Answer (Preview): ${response2.answer.substring(0, 150)}...`);

    // Verification logic
    const answerLower = response2.answer.toLowerCase();
    const hasDocKeywords = answerLower.includes('техническ') ||
        answerLower.includes('тз') ||
        answerLower.includes('отчет') ||
        answerLower.includes('акт') ||
        answerLower.includes('смет') ||
        answerLower.includes('договор');

    const hasTaxKeywords = answerLower.includes('налог') ||
        answerLower.includes('льгот') ||
        answerLower.includes('учет') ||
        answerLower.includes('расход');

    if (hasDocKeywords) {
        console.log('\n✅ TEST PASSED: AI understood context and suggested specific R&D documents.');
        if (hasTaxKeywords) {
            console.log('✅ Context retention confirmed: AI linked documents to tax benefits.');
        }
    } else {
        console.log('\n❌ TEST FAILED: AI did not mention specific R&D documents. It might have lost context.');
        console.log('Full Analysis:\n', response2.answer);
    }
}

runTest().catch(console.error);
