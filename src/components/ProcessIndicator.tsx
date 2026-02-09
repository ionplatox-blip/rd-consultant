import React from 'react';
import { Loader2, CheckCircle2, Search, FileText, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming we have a utils file or will create one. I'll inline if needed, but standard is lib/utils.


// Steps in the consultation process
const STEPS = [
    { id: 'query', label: 'Analyzing Request', icon: Search },
    { id: 'retrieve', label: 'Consulting Knowledge Base', icon: FileText },
    { id: 'synthesize', label: 'Synthesizing Answer', icon: BrainCircuit },
];

interface ProcessIndicatorProps {
    currentStep: 'query' | 'retrieve' | 'synthesize' | null;
}

export function ProcessIndicator({ currentStep }: ProcessIndicatorProps) {
    if (!currentStep) return null;

    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full max-w-md mx-auto my-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-3">
                {STEPS.map((step, index) => {
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div key={step.id} className={cn(
                            "flex items-center gap-3 text-sm transition-colors duration-300",
                            isActive ? "text-blue-700 font-medium" :
                                isCompleted ? "text-green-600" : "text-slate-400"
                        )}>
                            <div className="relative flex items-center justify-center w-5 h-5">
                                {isActive && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                                {isPending && <div className="w-2 h-2 rounded-full bg-slate-200" />}
                            </div>
                            <span className="flex-1">{step.label}</span>
                            <step.icon className={cn(
                                "w-4 h-4",
                                isActive ? "text-blue-500" : "text-slate-300"
                            )} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
