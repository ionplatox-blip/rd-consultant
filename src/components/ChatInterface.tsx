"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Eraser } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ProcessIndicator } from './ProcessIndicator';
import { Message } from '@/lib/types';

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Здравствуйте. Я — ваш специализированный ИИ-консультант по вопросам учета НИОКР. \n\nМоя база знаний основана на регламентах, налоговом кодексе и форме 2-наука. \n\nЧем я могу вам помочь сегодня?',
            createdAt: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [processStep, setProcessStep] = useState<'query' | 'retrieve' | 'synthesize' | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, processStep]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            createdAt: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Start Visual Process
        setProcessStep('query');

        try {
            // Simulate analysis delay
            await new Promise(r => setTimeout(r, 800));
            setProcessStep('retrieve');

            // Call API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            // Simulate retrieval delay
            await new Promise(r => setTimeout(r, 1500));
            setProcessStep('synthesize');

            // Simulate synthesis delay
            await new Promise(r => setTimeout(r, 1000));

            const data = await response.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer || "Извините, произошла ошибка процессинга.",
                createdAt: new Date(),
                sources: data.sources
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Произошла ошибка при обращении к базе знаний.",
                createdAt: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setProcessStep(null);
        }
    };

    return (
        <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-xl border-x border-slate-100">
            {/* Header */}
            <header className="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                            ИИ-Консультант НИОКР
                        </h1>
                        <p className="text-xs text-slate-500 mt-1 ml-5">
                            Powered by NotebookLM • Strict Grounding
                        </p>
                    </div>
                    <button
                        onClick={() => setMessages([])} // Should verify functionality, might need reset
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Очистить чат"
                    >
                        <Eraser className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
                ))}

                {/* Process Indicator */}
                {isLoading && (
                    <div className="mb-6">
                        <ProcessIndicator currentStep={processStep} />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
                <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Задайте вопрос по учету НИОКР (например: 'как заполнять форму-2?')"
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-[60px] max-h-[150px] shadow-sm bg-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <p className="text-center text-xs text-slate-400 mt-2">
                    Ответы генерируются на основе базы знаний. Проверяйте информацию в официальных источниках.
                </p>
            </div>
        </div>
    );
}
