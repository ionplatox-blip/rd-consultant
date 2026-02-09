import { ChatResponse } from './types';
import { spawn, exec } from 'child_process';
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

        return new Promise((resolve, reject) => {
            // Using 'notebooklm-mcp' command which is the dedicated MCP server binary
            // PATH includes /app/venv/bin where it resides
            const mcpProcess = spawn('notebooklm-mcp', [], {
                env: process.env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';
            // Store buffered output for JSON parsing
            let buffer = '';

            mcpProcess.stdout?.on('data', (data: Buffer) => {
                const chunk = data.toString();
                stdout += chunk;
                buffer += chunk;

                // Process lines as they arrive to handle immediate responses
                // JSON-RPC messages are usually one per line
                const lines = buffer.split('\n');
                // Keep the last partial line in buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const response = JSON.parse(line);

                        // Handle tools/call response (id: 2)
                        if (response.id === 2 && response.result) {
                            const content = response.result.content || [];
                            const answer = content
                                .filter((item: any) => item.type === 'text')
                                .map((item: any) => item.text)
                                .join('');
                            const newConversationId = response.result.conversation_id || conversationId;

                            if (answer) {
                                resolve({ answer, conversationId: newConversationId });
                            } else {
                                resolve({ answer: 'NotebookLM не смог найти ответ на ваш запрос.' });
                            }
                            mcpProcess.kill();
                            return;
                        }

                        // Handle error response via JSON-RPC
                        if (response.error) {
                            console.error('MCP JSON-RPC Error:', response.error);
                            resolve({ answer: `Ошибка базы знаний: ${response.error.message}` });
                            mcpProcess.kill();
                            return;
                        }

                        // Handle initialization response (id: 1)
                        if (response.id === 1) {
                            // Send initialized notification
                            mcpProcess.stdin?.write(JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'notifications/initialized',
                                params: {}
                            }) + '\n');

                            // Send tool call
                            const fullQuery = CONSULTANT_PERSONA + message;
                            const args: any = {
                                notebook_id: NOTEBOOK_ID,
                                query: fullQuery
                            };
                            if (conversationId) {
                                args.conversation_id = conversationId;
                            }

                            // Wait a tiny bit to ensuring initialized notification is processed? 
                            // Usually not needed for stdio but safe
                            setTimeout(() => {
                                mcpProcess.stdin?.write(JSON.stringify({
                                    jsonrpc: '2.0',
                                    id: 2,
                                    method: 'tools/call',
                                    params: {
                                        name: 'notebook_query',
                                        arguments: args
                                    }
                                }) + '\n');
                            }, 100);
                        }
                    } catch (e) {
                        // Ignore lines that aren't valid JSON
                    }
                }
            });

            mcpProcess.stderr?.on('data', (data: Buffer) => {
                stderr += data.toString();
                console.error('MCP Stderr:', data.toString());
            });

            mcpProcess.on('error', (error: Error) => {
                console.error('Failed to start MCP server:', error);
                resolve({ answer: `Ошибка запуска MCP сервера (spawn): ${error.message}` });
            });

            mcpProcess.on('close', (code: number | null) => {
                if (code !== 0 && !stdout.includes('"result"')) {
                    // Only report error if we haven't resolved with a result yet
                    console.error('MCP server exited with code:', code);
                    console.error('Stderr:', stderr);
                    resolve({ answer: `Ошибка MCP сервера (код ${code}): ${stderr}` });
                }
            });

            // Initialize connection immediately
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
        });

    } catch (error: any) {
        console.error('System error:', error);
        return {
            answer: `Системная ошибка: ${error.message}`
        };
    }
}
