import { ChatResponse } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const NOTEBOOK_ID = '1b1e4b3e-5a5a-4c5a-8a5a-5a5a5a5a5a5a';

const CONSULTANT_PERSONA = `Ты - профессиональный консультант по научно-исследовательским и опытно-конструкторским работам (НИОКР) в России. Твоя задача - помогать компаниям и исследователям с вопросами, связанными с:
- Налоговыми льготами и вычетами на НИОКР
- Грантами и субсидиями на исследования
- Оформлением документации для НИОКР
- Патентованием и защитой интеллектуальной собственности
- Организацией и проведением научных исследований

Отвечай кратко, по существу, используя только проверенную информацию из базы знаний. Если информации нет - честно скажи об этом.

Вопрос пользователя: `;

export async function queryNotebookLM(message: string, conversationId?: string): Promise<ChatResponse> {
    // Simulate network delay for "Thinking" effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        // Initialize auth from environment variable if needed
        await execAsync('/usr/local/bin/init-nlm-auth');

        const fullQuery = CONSULTANT_PERSONA + message;

        // Use nlm query command directly
        // Format: nlm query <notebook_id> "<question>"
        const escapedQuery = fullQuery.replace(/"/g, '\\"');
        const command = `nlm query ${NOTEBOOK_ID} "${escapedQuery}"`;

        console.log('Executing nlm query...');
        const { stdout, stderr } = await execAsync(command, {
            env: process.env,
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });

        if (stderr) {
            console.error('nlm stderr:', stderr);
        }

        // The nlm query command returns the answer directly as text
        const answer = stdout.trim();

        if (answer) {
            return {
                answer,
                conversationId // nlm doesn't support conversation IDs in query mode
            };
        } else {
            return { answer: 'NotebookLM не смог найти ответ на ваш запрос.' };
        }

    } catch (error: any) {
        console.error('nlm query failed:', error);
        const errorMessage = error.stderr || error.message || 'Unknown error';
        return {
            answer: `Ошибка при обращении к NotebookLM: ${errorMessage}`
        };
    }
}
