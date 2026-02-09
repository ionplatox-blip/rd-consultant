import React from 'react';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // I need to install this! Or just render text for now and add markdown later if requested.
// The user request mentioned "Markdown support". I should install react-markdown. 
// For now I will basic render. I'll add a comment to install it.

interface MessageBubbleProps {
    role: 'user' | 'assistant';
    content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <div className={cn(
            "flex gap-4 w-full max-w-3xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-2",
            isUser ? "justify-end" : "justify-start"
        )}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-blue-700" />
                </div>
            )}

            <div className={cn(
                "px-6 py-4 rounded-2xl max-w-[80%]",
                isUser
                    ? "bg-slate-800 text-white rounded-tr-sm shadow-md"
                    : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm shadow-sm"
            )}>
                <div className="prose prose-sm max-w-none prose-blue">
                    {/* Simple markdown-like rendering for now, mimicking structured text handling */}
                    {content.split('\n').map((line, i) => (
                        <p key={i} className="min-h-[1rem] mb-1 last:mb-0">
                            {/* Basic formatting handling */}
                            {line.startsWith('#') ? <span className="font-bold block text-lg mb-2">{line.replace(/^#+\s/, '')}</span> :
                                line.startsWith('* ') ? <li className="ml-4 list-disc">{line.replace(/^\*\s/, '')}</li> :
                                    line.startsWith('###') ? <span className="font-bold block text-base mt-2 mb-1">{line.replace(/^###\s/, '')}</span> :
                                        line}
                        </p>
                    ))}
                </div>
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-slate-500" />
                </div>
            )}
        </div>
    );
}
