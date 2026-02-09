import { ChatResponse } from './types';
import { execFile } from 'child_process';
import path from 'path';

export async function queryNotebookLM(message: string, conversationId?: string): Promise<ChatResponse> {
    // Simulate network delay for "Thinking" effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use real NotebookLM via python script
    try {
        const scriptPath = path.join(process.cwd(), 'src/scripts/notebook_client.py');
        const args = [scriptPath, message];
        if (conversationId) {
            args.push(conversationId);
        }

        return new Promise((resolve, reject) => {
            execFile('python3', args, (error: any, stdout: string, stderr: string) => {
                if (error) {
                    console.error('Python script error:', error);
                    console.error('Stderr:', stderr);
                    return resolve({
                        answer: "Ошибка при обращении к базе знаний NotebookLM. Убедитесь, что сервер MCP запущен и авторизован."
                    });
                }

                try {
                    const result = JSON.parse(stdout.trim());
                    if (result.answer) {
                        resolve({
                            answer: result.answer,
                            conversationId: result.conversation_id
                        });
                    } else if (result.error) {
                        resolve({ answer: `Ошибка NotebookLM: ${result.error}` });
                    } else {
                        resolve({ answer: "NotebookLM не смог найти ответ на ваш запрос." });
                    }
                } catch (e) {
                    console.error('Failed to parse JSON:', e);
                    resolve({ answer: "Ошибка обработки ответа от базы знаний." });
                }
            });
        });

    } catch (e) {
        console.error('Exec failed:', e);
        return { answer: "Системная ошибка при выполнении запроса." };
    }
}
