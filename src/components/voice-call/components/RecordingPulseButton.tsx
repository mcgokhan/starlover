import { useState, useEffect, memo } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CallButton } from './CallButton';
import { ReactNode } from 'react';

export interface RecordingPulseButtonProps {
    isRecording: boolean;
    onClick: () => void;
    disabled: boolean;
    icon?: ReactNode;
}


export const RecordingPulseButton = memo(({ isRecording, onClick, disabled, icon }: RecordingPulseButtonProps) => {

    const [volumeIntensity, setVolumeIntensity] = useState(0.5);


    useEffect(() => {
        if (!isRecording) return;


        const updateVolumeIntensity = () => {
            const newIntensity = 0.3 + Math.random() * 0.7;
            setVolumeIntensity(newIntensity);
        };

        const interval = setInterval(() => {
            updateVolumeIntensity();
        }, 200 + Math.random() * 200);


        return () => clearInterval(interval);
    }, [isRecording]);

    return (
        <motion.div
            className="relative"
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
            <motion.div
                animate={isRecording ? {
                    scale: [1, 1.05, 1],
                    transition: {
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut"
                    }
                } : {}}
            >
                <CallButton
                    variant="purple"
                    onClick={onClick}
                    disabled={disabled}
                    isActive={isRecording}
                    icon={<Mic className="h-8 w-8 md:h-10 md:w-10 text-white" />}
                />
            </motion.div>
        </motion.div>
    );
}); 