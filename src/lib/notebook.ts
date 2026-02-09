import { ChatResponse } from './types';
import { spawn } from 'child_process';

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
        // Use the wrapper script that ensures we call the Node.js package
        // The wrapper is created in Dockerfile and uses npm root to find the correct path
        const mcpCommand = 'notebooklm-mcp-wrapper';

        return new Promise((resolve, reject) => {
            const mcpProcess = spawn(mcpCommand, [], {
                env: { ...process.env },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            mcpProcess.stdout?.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            mcpProcess.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            mcpProcess.on('error', (error: Error) => {
                console.error('Failed to start MCP server:', error);
                resolve({ answer: `Ошибка запуска MCP сервера: ${error.message}` });
            });

            mcpProcess.on('close', (code: number | null) => {
                if (code !== 0) {
                    console.error('MCP server exited with code:', code);
                    console.error('Stderr:', stderr);
                    resolve({ answer: `Ошибка MCP сервера (код ${code}): ${stderr}` });
                    return;
                }

                try {
                    // Parse MCP protocol responses
                    const lines = stdout.trim().split('\n');
                    let answer = '';
                    let newConversationId = conversationId;

                    for (const line of lines) {
                        try {
                            const response = JSON.parse(line);
                            if (response.id === 2 && response.result) {
                                const content = response.result.content || [];
                                answer = content
                                    .filter((item: any) => item.type === 'text')
                                    .map((item: any) => item.text)
                                    .join('');
                                newConversationId = response.result.conversation_id || conversationId;
                                break;
                            }
                        } catch (e) {
                            // Skip non-JSON lines
                        }
                    }

                    if (answer) {
                        resolve({ answer, conversationId: newConversationId });
                    } else {
                        resolve({ answer: 'NotebookLM не смог найти ответ на ваш запрос.' });
                    }
                } catch (e) {
                    console.error('Failed to parse MCP response:', e);
                    resolve({ answer: 'Ошибка обработки ответа от базы знаний.' });
                }
            });

            // Send MCP protocol messages
            const fullQuery = CONSULTANT_PERSONA + message;

            // 1. Initialize
            mcpProcess.stdin?.write(JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    clientInfo: { name: 'rd-consultant-client', version: '1.0' }
                }
            }) + '\n');

            // 2. Send initialized notification (after a brief delay)
            setTimeout(() => {
                mcpProcess.stdin?.write(JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'notifications/initialized',
                    params: {}
                }) + '\n');

                // 3. Call notebook_query tool
                const args: any = {
                    notebook_id: NOTEBOOK_ID,
                    query: fullQuery
                };
                if (conversationId) {
                    args.conversation_id = conversationId;
                }

                mcpProcess.stdin?.write(JSON.stringify({
                    jsonrpc: '2.0',
                    id: 2,
                    method: 'tools/call',
                    params: {
                        name: 'notebook_query',
                        arguments: args
                    }
                }) + '\n');

                mcpProcess.stdin?.end();
            }, 500);
        });

    } catch (e) {
        console.error('Exec failed:', e);
        return { answer: 'Системная ошибка при выполнении запроса.' };
    }
}
