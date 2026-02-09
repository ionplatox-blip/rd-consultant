"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, User, Bot, Sparkles, Loader2, Globe, MessageSquare, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const SUGGESTED_QUESTIONS = [
    "Как оформить налоговый вычет на НИОКР?",
    "Какие документы нужны для фонда МИК?",
    "Порядок учета НМА в 2024 году",
];

const RDConsultant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async (customMessage?: string) => {
        const text = customMessage || inputValue;
        if (!text.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationId: conversationId
                }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();

            if (data.conversationId) {
                setConversationId(data.conversationId);
            }

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: data.answer || "Извините, база знаний не вернула ответ.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'ai',
                    content: 'Произошла ошибка при обращении к серверу. Попробуйте позже.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setConversationId(undefined);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const renderMessageContent = (content: string) => {
        return content.split('\n').map((line, i) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <div key={i} className="h-2" />;

            // Headings
            if (trimmedLine.startsWith('###')) {
                return <h3 key={i} className="text-lg font-bold text-slate-900 mt-6 mb-2">{trimmedLine.replace(/^###\s*/, '')}</h3>;
            }
            if (trimmedLine.startsWith('####') || trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                return <h4 key={i} className="text-base font-bold text-slate-800 mt-4 mb-1">{trimmedLine.replace(/[\*#]/g, '').trim()}</h4>;
            }

            // List items
            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                return (
                    <div key={i} className="flex gap-2 pl-2">
                        <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        <span className="flex-1">
                            {trimmedLine.replace(/^[-*]\s*/, '').split('**').map((part, idx) =>
                                idx % 2 === 1 ? <strong key={idx} className="font-bold text-slate-900">{part}</strong> : part
                            )}
                        </span>
                    </div>
                );
            }

            // Normal text with bold support
            return (
                <p key={i} className="text-slate-700 leading-relaxed">
                    {trimmedLine.split('**').map((part, idx) =>
                        idx % 2 === 1 ? <strong key={idx} className="font-bold text-slate-900">{part}</strong> : part
                    )}
                </p>
            );
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col selection:bg-cyan-100 selection:text-cyan-900">
            {/* Background Gradient & Illustration */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-[#E0F7F9] to-white opacity-80" />
                <div className="absolute right-[-10%] top-[10%] opacity-20 hidden lg:block">
                    <svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 200L300 100L500 200L300 300L100 200Z" stroke="#25C2D9" strokeWidth="2" />
                        <path d="M100 240L300 140L500 240L300 340L100 240Z" stroke="#25C2D9" strokeWidth="1" />
                        <rect x="280" y="150" width="40" height="100" fill="#25C2D9" fillOpacity="0.2" stroke="#25C2D9" />
                    </svg>
                </div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-tr from-[#00A7B5] to-[#25C2D9] rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                            <span className="text-white font-bold text-xl uppercase leading-none">M</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 leading-none tracking-wider uppercase">Московский</span>
                            <span className="text-sm font-extrabold text-slate-800 leading-tight">Инновационный кластер</span>
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block" />
                    <nav className="hidden lg:flex gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                        <a href="#" className="hover:text-[#00A7B5] transition-colors">О кластере</a>
                        <a href="#" className="hover:text-[#00A7B5] transition-colors">Сервисы</a>
                        <a href="#" className="hover:text-[#00A7B5] transition-colors">Мероприятия</a>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#F1F5F9] hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-all uppercase tracking-wide">
                        Кластер «Ломоносов»
                    </button>
                    <div className="flex gap-3">
                        <Globe className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                        <MessageSquare className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 hover:shadow-sm transition-all shadow-sm">
                        <User className="w-3.5 h-3.5" />
                        Войти
                    </button>
                </div>
            </header>

            {/* Main Container */}
            <main className="relative z-10 flex-1 flex flex-col items-center p-4 md:p-8 overflow-hidden">
                <div className="w-full max-w-5xl bg-white rounded-[40px] shadow-2xl shadow-cyan-900/5 flex flex-col overflow-hidden border border-white h-[calc(100vh-180px)]">

                    {/* Chat Sub-header */}
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">Консультант по учету НИОКР</h1>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 text-[10px] font-bold uppercase rounded border border-cyan-100">AI Assistant</span>
                                <span className="text-[11px] text-slate-400 font-semibold tracking-wide">На основе программы учета фонда МИК</span>
                            </div>
                        </div>
                        <button
                            onClick={clearChat}
                            className={cn(
                                "p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all",
                                messages.length === 0 && "opacity-0 pointer-events-none"
                            )}
                            title="Очистить чат"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
                                <div className="w-20 h-20 bg-cyan-50 rounded-[32px] flex items-center justify-center border border-cyan-100 shadow-inner">
                                    <Bot className="w-10 h-10 text-cyan-600" />
                                </div>
                                <div className="max-w-md space-y-3">
                                    <h2 className="text-xl font-black text-slate-900">Чем я могу помочь?</h2>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        Здравствуйте. Я готов проконсультировать вас по вопросам учета НИОКР.
                                        Мои ответы основаны строго на загруженной базе знаний.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendMessage(q)}
                                            className="px-5 py-3 bg-slate-50 hover:bg-cyan-50 text-slate-600 hover:text-cyan-700 border border-slate-200 hover:border-cyan-200 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group text-left"
                                        >
                                            <span className="flex-1">{q}</span>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-500 shrink-0 ml-2" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            "max-w-[85%] md:max-w-[75%] p-6 rounded-[28px] shadow-sm relative group",
                                            msg.role === 'user'
                                                ? 'bg-cyan-600 text-white rounded-tr-none shadow-cyan-200'
                                                : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                                        )}>
                                            <div className={cn("space-y-4 text-[15px] font-medium leading-relaxed", msg.role === 'user' ? 'text-white' : 'text-slate-700')}>
                                                {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start animate-in fade-in duration-300">
                                        <div className="flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-[28px] rounded-tl-none border border-slate-100">
                                            <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                                            <span className="text-sm font-bold text-slate-500 tracking-tight">Анализирую базу знаний...</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-slate-50 bg-white shrink-0">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                            className="relative flex items-center gap-3 max-w-4xl mx-auto bg-[#F8FAFC] p-2 rounded-[32px] border border-slate-200 focus-within:border-cyan-500 focus-within:ring-8 focus-within:ring-cyan-50 transition-all shadow-inner"
                        >
                            <textarea
                                rows={1}
                                placeholder="Спросите меня об учете НИОКР..."
                                className="w-full bg-transparent border-none focus:ring-0 py-3 px-6 resize-none text-[15px] max-h-40 overflow-y-auto font-medium text-slate-800 placeholder-slate-400"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className={cn(
                                    "p-4 rounded-2xl transition-all shadow-lg active:scale-95",
                                    inputValue.trim() && !isLoading
                                        ? 'bg-cyan-600 text-white hover:bg-cyan-700 shadow-cyan-200'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        <p className="mt-4 text-[10px] text-center text-slate-400 uppercase tracking-widest font-black opacity-80">
                            Ответы формируются исключительно на основе предоставленных документов. ИИ может не знать внешней информации.
                        </p>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 py-6 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest opacity-60">
                &copy; 2024 Фонд «Московский инновационный кластер»
            </footer>
        </div>
    );
};

export default RDConsultant;
