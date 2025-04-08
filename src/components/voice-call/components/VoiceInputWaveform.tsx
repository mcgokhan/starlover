import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

export interface VoiceInputWaveformProps {
    isActive: boolean;
    position?: 'bottom' | 'top';
    className?: string;
}

export function VoiceInputWaveform({
    isActive,
    position = 'bottom',
    className
}: VoiceInputWaveformProps) {

    const positionClasses = {
        bottom: "-bottom-6 left-1/2 transform -translate-x-1/2",
        top: "-top-6 left-1/2 transform -translate-x-1/2"
    };


    const waveElements = [];

    for (let i = 0; i < 5; i++) {
        const minHeight = 4;
        const maxHeight = 10;
        const randomDelay = Math.random() * 0.5;
        const randomDuration = 0.6 + Math.random() * 0.4;

        waveElements.push(
            <motion.div
                key={`wave-${i}`}
                className="w-[2px] bg-blue-200 rounded-full"
                style={{ height: minHeight }}
                animate={{ height: maxHeight }}
                initial={{ height: minHeight }}
                transition={{
                    duration: randomDuration,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: randomDelay,
                }}
            />
        );
    }

    const waveElements2 = [];

    for (let i = 0; i < 5; i++) {
        const minHeight = 4;
        const maxHeight = 10;
        const randomDelay = Math.random() * 0.5;
        const randomDuration = 0.6 + Math.random() * 0.4;

        waveElements2.push(
            <motion.div
                key={`wave2-${i}`}
                className="w-[2px] bg-blue-200 rounded-full"
                style={{ height: minHeight }}
                animate={{ height: maxHeight }}
                initial={{ height: minHeight }}
                transition={{
                    duration: randomDuration,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: randomDelay,
                }}
            />
        );
    }

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`absolute ${positionClasses[position]} bg-blue-500/20 backdrop-blur-md rounded-full p-2 px-4 flex items-center shadow-lg ${className}`}
                >
                    <div className="flex items-center gap-1 h-4">
                        {waveElements}
                        <Mic className="w-4 h-4 text-blue-200 mx-1" />
                        {waveElements2}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 