"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Bot, ArrowRight, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ProcessIndicator } from './ProcessIndicator';
import { Header } from './Header';
import { Message } from '@/lib/types';
import { STARTER_QUESTIONS } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [processStep, setProcessStep] = useState<'query' | 'retrieve' | 'synthesize' | null>(null);
    const [starterQuestions, setStarterQuestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Shuffle and pick 3 starter questions on mount
    useEffect(() => {
        const shuffled = [...STARTER_QUESTIONS].sort(() => 0.5 - Math.random());
        setStarterQuestions(shuffled.slice(0, 3));
    }, []);

    const scrollToBottom = useCallback((instant = false) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: instant ? 'auto' : 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0 || isLoading) {
            scrollToBottom();
        }
    }, [messages, processStep, scrollToBottom, isLoading]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content,
            createdAt: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setProcessStep('query');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            setProcessStep('retrieve');
            const data = await response.json();

            setProcessStep('synthesize');
            await new Promise(r => setTimeout(r, 600));

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer || "Извините, произошла ошибка процессинга.",
                createdAt: new Date(),
                sources: data.sources,
                followups: data.followups
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Произошла ошибка при обращении к базе знаний. Попробуйте обновить страницу или повторить запрос позже.",
                createdAt: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setProcessStep(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleStarterClick = (question: string) => {
        sendMessage(question);
    };

    const clearHistory = () => {
        if (window.confirm('Вы уверены, что хотите очистить историю чата?')) {
            setMessages([]);
            // Reshuffle questions on clear
            const shuffled = [...STARTER_QUESTIONS].sort(() => 0.5 - Math.random());
            setStarterQuestions(shuffled.slice(0, 3));
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[100dvh] w-full bg-slate-50 relative overflow-hidden">
            {/* Header */}
            <Header />

            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[120px]" />
            </div>

            {/* Chat Container */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-slate-200"
            >
                <div className="max-w-5xl mx-auto flex flex-col px-4 pt-6 pb-24 min-h-full">

                    {/* Empty State / Welcome Screen */}
                    {messages.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center -mt-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center text-center mb-10"
                            >
                                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 flex items-center justify-center mb-8 relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-transparent rounded-[2rem]" />
                                    <Bot className="w-12 h-12 text-blue-600 relative z-10" />
                                </div>
                                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                                    Консультант НИОКР
                                </h1>
                                <p className="text-lg text-slate-500 max-w-md leading-relaxed">
                                    Я помогу вам разобраться в тонкостях налогового учета и оформления документов.
                                </p>
                            </motion.div>

                            {/* Starter Questions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                                {starterQuestions.map((q, idx) => (
                                    <motion.button
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * idx }}
                                        onClick={() => handleStarterClick(q)}
                                        className="text-left group relative bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-32"
                                    >
                                        <span className="font-medium text-slate-700 group-hover:text-blue-700 transition-colors line-clamp-3">
                                            {q}
                                        </span>
                                        <div className="flex justify-end mt-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <ArrowRight className="w-4 h-4 text-blue-600" />
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <MessageBubble
                                        role={msg.role}
                                        content={msg.content}
                                        sources={msg.sources}
                                        followups={msg.followups}
                                        createdAt={msg.createdAt}
                                        onFollowUpClick={handleStarterClick}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 pl-4"
                        >
                            <ProcessIndicator currentStep={processStep} />
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} className="h-4 pointer-events-none" />
                </div>
            </div>

            {/* Bottom Controls Area */}
            <div className={`fixed bottom-0 left-0 w-full z-20 pointer-events-none transition-all duration-500 ${messages.length === 0 ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}>
                <div className="max-w-4xl mx-auto w-full px-4 mb-8 pointer-events-auto">
                    <div className="relative group">
                        {/* Clear Button Floating Overlay */}
                        <div className="absolute -top-12 right-0 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                            <button
                                onClick={clearHistory}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-slate-200 rounded-full text-[11px] font-bold text-slate-400 hover:text-red-500 hover:border-red-100 transition-all uppercase tracking-wide"
                                title="Очистить чат"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Очистить историю
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-[28px] shadow-2xl shadow-blue-900/10 flex items-end gap-2 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all"
                        >
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                rows={1}
                                placeholder="Спросите о налогах или документах..."
                                className="flex-1 bg-transparent border-none focus:ring-0 py-4 px-6 resize-none max-h-[200px] text-[15px] font-medium text-slate-800 placeholder-slate-400"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="mb-1 mr-1 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Always visible input for empty state */}
            {messages.length === 0 && (
                <div className="fixed bottom-0 left-0 w-full z-20 pointer-events-none">
                    <div className="max-w-3xl mx-auto w-full px-4 mb-12 pointer-events-auto">
                        <form
                            onSubmit={handleSubmit}
                            className="bg-white shadow-2xl shadow-blue-900/10 border border-slate-200 p-2 rounded-[24px] flex items-center gap-2 focus-within:ring-4 focus-within:ring-blue-50 transition-all transform hover:-translate-y-1"
                        >
                            <div className="pl-4 text-slate-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Напишите ваш вопрос..."
                                className="flex-1 bg-transparent border-none focus:ring-0 py-4 px-2 text-[16px] text-slate-800 placeholder-slate-400"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-30"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
