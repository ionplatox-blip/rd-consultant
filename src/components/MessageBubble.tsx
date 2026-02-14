import React from 'react';
import { User, Bot, FileText, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
    sources?: string[];
    followups?: string[];
    createdAt?: Date;
    onFollowUpClick?: (question: string) => void;
}

export function MessageBubble({ role, content, sources, followups, createdAt, onFollowUpClick }: MessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <div className={cn(
            "flex w-full mb-8 group",
            isUser ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "flex max-w-[90%] md:max-w-[80%] gap-4",
                isUser ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar */}
                <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110",
                    isUser
                        ? "bg-gradient-to-tr from-slate-700 to-slate-900 border border-slate-600"
                        : "bg-gradient-to-tr from-blue-600 to-blue-400 border border-blue-300"
                )}>
                    {isUser ? (
                        <User className="w-5 h-5 text-white" />
                    ) : (
                        <Bot className="w-5 h-5 text-white" />
                    )}
                </div>

                {/* Message Body */}
                <div className="flex flex-col space-y-2">
                    <div className={cn(
                        "px-7 py-5 rounded-[28px] shadow-sm relative",
                        isUser
                            ? "bg-slate-900 text-white rounded-tr-none"
                            : "bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-blue-900/5 shadow-xl"
                    )}>
                        <div className={cn(
                            "prose prose-sm max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-strong:text-inherit",
                            isUser ? "prose-invert" : "prose-slate"
                        )}>
                            <ReactMarkdown>
                                {content}
                            </ReactMarkdown>
                        </div>

                        {/* Follow-up Questions Chips */}
                        {!isUser && followups && followups.length > 0 && (
                            <div className="mt-6 flex flex-col gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Возможные вопросы:</span>
                                <div className="flex flex-wrap gap-2">
                                    {followups.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => onFollowUpClick?.(q)}
                                            className="text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-all border border-blue-100 hover:border-blue-300 active:scale-95 shadow-sm hover:shadow"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Timestamp */}
                    <div className={cn(
                        "text-[10px] font-bold uppercase tracking-widest text-slate-300 px-2 flex items-center gap-2",
                        isUser ? "justify-end" : "justify-start"
                    )}>
                        <ClientTimestamp date={createdAt} />
                        {!isUser && <span className="w-1 h-1 rounded-full bg-slate-200" />}
                        {!isUser && <span>Verified Grounding</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClientTimestamp({ date }: { date?: Date }) {
    const [formatted, setFormatted] = React.useState('');

    React.useEffect(() => {
        if (date) {
            setFormatted(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
    }, [date]);

    if (!formatted) return null;
    return <span>{formatted}</span>;
}
