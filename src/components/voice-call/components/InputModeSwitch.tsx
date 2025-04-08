import { Mic, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type InputMode = 'voice' | 'text';

interface InputModeSwitchProps {
    mode: InputMode;
    onModeChange: (mode: InputMode) => void;
    disabled?: boolean;
    className?: string;
}

export function InputModeSwitch({
    mode,
    onModeChange,
    disabled = false,
    className
}: InputModeSwitchProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn("relative", className)}
        >
            <div className={cn(
                "inline-flex items-center p-1 rounded-full bg-white/10 backdrop-blur-lg",
                "shadow-lg relative z-10",
                disabled && "opacity-50 cursor-not-allowed"
            )}>
                {/* Voice Mode Button */}
                <motion.button
                    onClick={() => !disabled && onModeChange('voice')}
                    className={cn(
                        "relative flex items-center gap-2 px-4 h-8 rounded-full transition-all bg-purple-500/30",
                        mode === 'voice' 
                            ? "bg-white/20 text-white shadow-sm" 
                            : "text-white/60 hover:text-white/80 hover:bg-white/10",
                        disabled && "cursor-not-allowed"
                    )}
                    whileHover={!disabled && mode !== 'voice' ? { scale: 1.02 } : {}}
                    whileTap={!disabled ? { scale: 0.98 } : {}}
                    disabled={disabled}
                >
                    <Mic className="w-4 h-4 stroke-[2.5px]" />
                </motion.button>

                {/* Text Mode Button */}
                <motion.button
                    onClick={() => !disabled && onModeChange('text')}
                    className={cn(
                        "relative flex items-center gap-2 px-4 h-8 rounded-full transition-all bg-purple-500/30",
                        mode === 'text'
                            ? "bg-white/20 text-white shadow-sm"
                            : "text-white/60 hover:text-white/80 hover:bg-white/10",
                        disabled && "cursor-not-allowed"
                    )}
                    whileHover={!disabled && mode !== 'text' ? { scale: 1.02 } : {}}
                    whileTap={!disabled ? { scale: 0.98 } : {}}
                    disabled={disabled}
                >
                    <MessageSquare className="w-4 h-4 stroke-[2.5px]" />
                </motion.button>
            </div>

            {/* Active Mode Highlight Effect */}
            <motion.div
                className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-r",
                    "from-white/10 to-white/5",
                    "transition-opacity duration-300 blur-md",
                    mode === 'voice' ? "-translate-x-[2%] opacity-100" : "translate-x-[2%] opacity-100"
                )}
                layoutId="mode-highlight"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        </motion.div>
    );
}