import { motion } from 'framer-motion';
import { Volume2, Brain, Mic } from 'lucide-react';
import { useAudioAnalyzer } from './AudioAnalyzer';

export type AudioWaveformState = 'silent' | 'thinking' | 'playing' | 'listening';

interface RealTimeWaveformProps {
    audioElement: HTMLAudioElement | null;
    state: AudioWaveformState;
    className?: string;
    message?: string;
}

interface StaticWaveformProps {
    state: AudioWaveformState;
    className?: string;
    message?: string;
}


const stateTextMap: Record<AudioWaveformState, string> = {
    silent: '',
    thinking: 'Thinking...',
    playing: 'Playing...',
    listening: 'Listening...'
};


export function RealTimeWaveform({
    audioElement,
    state,
    className = '',
    message
}: RealTimeWaveformProps) {

    const audioData = useAudioAnalyzer({
        audioElement,
        fftSize: 128,
        smoothingTimeConstant: 0.7
    });

    if (state === 'silent' || !audioElement) {
        return null;
    }

    const isThinking = state === 'thinking';
    const isListening = state === 'listening';
    const volumeScale = Math.min(audioData.volume * 1.5, 1);


    const statusText = message || stateTextMap[state];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`bg-white/15 backdrop-blur-lg rounded-full py-1.5 px-4 flex items-center gap-2.5 shadow-lg border border-white/10 min-w-[120px] justify-center ${className}`}
        >

            <div className="flex items-center h-5 gap-[2px]">
                {isThinking ? (
                    <Brain className="w-5 h-5 text-purple-300" />
                ) : isListening ? (
                    <Mic className="w-5 h-5 text-blue-300" />
                ) : (
                    <>
                        <div className="flex items-center h-5 gap-[2px]">
                            {Array.from({ length: 5 }).map((_, i) => {

                                const frequencyIndex = Math.floor(i * (audioData.frequencyData.length / 5));
                                const frequencyValue = audioData.frequencyData[frequencyIndex] || 0;
                                const normalizedHeight = (frequencyValue / 255) * 12;


                                const dynamicHeight = audioData.isPlaying && normalizedHeight > 0
                                    ? Math.max(3, normalizedHeight)
                                    : 3;


                                const jitter = audioData.isPlaying
                                    ? Math.random() * 2
                                    : 0;

                                return (
                                    <motion.div
                                        key={`wave-left-${i}`}
                                        className="w-[2px] bg-gradient-to-t from-purple-400 to-pink-300 rounded-full"
                                        style={{
                                            height: `${dynamicHeight + jitter}px`
                                        }}
                                        animate={audioData.isPlaying ? {
                                            height: [
                                                `${dynamicHeight}px`,
                                                `${dynamicHeight + 2 + jitter}px`,
                                                `${dynamicHeight}px`
                                            ],
                                            opacity: [0.7, 1, 0.7]
                                        } : {
                                            height: '3px',
                                            opacity: 0.5
                                        }}
                                        transition={{
                                            duration: 0.4 + (i * 0.1),
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.05
                                        }}
                                    />
                                );
                            })}
                        </div>


                        <Volume2
                            className={`w-4.5 h-4.5 mx-1 ${audioData.isPlaying ? 'text-white' : 'text-white/60'}`}
                            strokeWidth={2.5}
                        />

                        <div className="flex items-center h-5 gap-[2px]">
                            {Array.from({ length: 5 }).map((_, i) => {

                                const frequencyIndex = Math.floor((audioData.frequencyData.length / 2) + i * (audioData.frequencyData.length / 10));
                                const frequencyValue = audioData.frequencyData[frequencyIndex] || 0;
                                const normalizedHeight = (frequencyValue / 255) * 12;


                                const dynamicHeight = audioData.isPlaying && normalizedHeight > 0
                                    ? Math.max(3, normalizedHeight)
                                    : 3;


                                const jitter = audioData.isPlaying
                                    ? Math.random() * 2
                                    : 0;

                                return (
                                    <motion.div
                                        key={`wave-right-${i}`}
                                        className="w-[2px] bg-gradient-to-t from-purple-400 to-pink-300 rounded-full"
                                        style={{
                                            height: `${dynamicHeight + jitter}px`
                                        }}
                                        animate={audioData.isPlaying ? {
                                            height: [
                                                `${dynamicHeight}px`,
                                                `${dynamicHeight + 2 + jitter}px`,
                                                `${dynamicHeight}px`
                                            ],
                                            opacity: [0.7, 1, 0.7]
                                        } : {
                                            height: '3px',
                                            opacity: 0.5
                                        }}
                                        transition={{
                                            duration: 0.4 + (i * 0.1),
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.05
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
}


export function StaticWaveform({
    state,
    className = '',
    message
}: StaticWaveformProps) {
    if (state === 'silent') {
        return null;
    }

    const isThinking = state === 'thinking';
    const isPlaying = state === 'playing';
    const isListening = state === 'listening';


    const statusText = message || stateTextMap[state];


    let Icon = Volume2;
    let iconColor = 'text-white';

    if (isThinking) {
        Icon = Brain;
        iconColor = 'text-purple-300';
    } else if (isListening) {
        Icon = Mic;
        iconColor = 'text-blue-300';
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`bg-white/15 backdrop-blur-lg rounded-full py-1.5 px-4 flex items-center gap-2.5 shadow-lg border border-white/10 min-w-[120px] justify-center ${className}`}
        >

            {isThinking ? (
                <Brain className="w-5 h-5 text-purple-300" />
            ) : isListening ? (
                <Mic className="w-5 h-5 text-blue-300" />
            ) : (
                <div className="flex items-center h-5 gap-[2px]">

                    <div className="flex items-center h-5 gap-[2px]">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={`wave-left-${i}`}
                                className="w-[2px] bg-gradient-to-t from-purple-300 to-pink-200 rounded-full"
                                animate={{
                                    height: [
                                        '4px',
                                        `${6 + Math.random() * 8}px`,
                                        '4px'
                                    ],
                                }}
                                transition={{
                                    duration: 0.8 + Math.random() * 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: Math.random() * 0.5
                                }}
                            />
                        ))}
                    </div>


                    <Volume2 className="w-4.5 h-4.5 text-white mx-0.5" strokeWidth={2.5} />


                    <div className="flex items-center h-5 gap-[2px]">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={`wave-right-${i}`}
                                className="w-[2px] bg-gradient-to-t from-purple-300 to-pink-200 rounded-full"
                                animate={{
                                    height: [
                                        '4px',
                                        `${6 + Math.random() * 8}px`,
                                        '4px'
                                    ],
                                }}
                                transition={{
                                    duration: 0.8 + Math.random() * 0.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: Math.random() * 0.5
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}


            <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs font-medium text-white/90 whitespace-nowrap"
            >
                {statusText}
            </motion.span>
        </motion.div>
    );
} 