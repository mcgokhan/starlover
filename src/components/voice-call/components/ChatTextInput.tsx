import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useCallback, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ChatTextInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    className?: string;
}

export function ChatTextInput({
    onSend,
    disabled = false,
    className
}: ChatTextInputProps) {
    const [message, setMessage] = useState('');
    const [isHovered, setIsHovered] = useState(false);

    const handleSend = useCallback(() => {
        if (message.trim() && !disabled) {
            onSend(message.trim());
            setMessage('');
        }
    }, [message, disabled, onSend]);

    const handleKeyPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    return (
        <div className={cn(
            "flex items-end gap-2 w-full bg-white/10 rounded-2xl p-2 backdrop-blur-sm",
            disabled && "opacity-50",
            className
        )}>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                disabled={disabled}
                className="flex-1 bg-transparent border-none resize-none text-white placeholder-white/50 focus:outline-none focus:ring-0 min-h-[40px] max-h-[120px] py-2 px-3"
                rows={1}
            />
            <div className="flex-shrink-0">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                    onClick={handleSend}
                    disabled={disabled || !message.trim()}
                    className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-xl",
                        "bg-gradient-to-br from-purple-500 to-pink-500",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "transition-all duration-200",
                        "shadow-lg hover:shadow-purple-500/25",
                        !disabled && message.trim() && "hover:-translate-y-0.5"
                    )}
                >
                    <Send
                        size={20}
                        strokeWidth={2.5}
                        className={cn(
                            "text-white transition-transform duration-200",
                            isHovered && !disabled && message.trim() && "translate-x-0.5"
                        )}
                    />
                    {!disabled && message.trim() && (
                        <motion.div
                            className="absolute inset-0 rounded-xl bg-white/20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                </motion.button>
            </div>
        </div>
    );
} 