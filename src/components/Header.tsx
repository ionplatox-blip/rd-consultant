import React from 'react';
import Image from 'next/image';
import { User, Send } from 'lucide-react';

export function Header() {
    return (
        <header className="w-full bg-gradient-to-r from-[#4ade80] to-[#38bdf8] px-6 py-4 flex items-center justify-between shadow-lg mb-0 relative z-50">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
                <Image
                    src="/mik_logo_white.svg"
                    alt="Московский инновационный кластер"
                    width={200}
                    height={40}
                    className="h-10 w-auto object-contain"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                <button className="hidden md:block px-4 py-1.5 border border-white/60 text-white rounded-full text-xs font-bold hover:bg-white/10 transition-colors uppercase tracking-wider backdrop-blur-sm">
                    Кластер «Ломоносов»
                </button>

                <button className="w-9 h-9 flex items-center justify-center border border-white/60 rounded-full text-white hover:bg-white/10 transition-colors backdrop-blur-sm">
                    <Send className="w-4 h-4 ml-0.5" />
                </button>

                <button className="flex items-center gap-2 text-white font-bold text-sm hover:opacity-80 transition-opacity">
                    <span>Войти</span>
                    <User className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
