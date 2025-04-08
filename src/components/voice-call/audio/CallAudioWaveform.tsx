import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { VoiceCallService } from '../VoiceCallService';
import { RealTimeWaveform, AudioWaveformState } from './AudioWaveform';

interface CallAudioWaveformProps {
    voiceCallService: VoiceCallService | null;
    isAudioPlaying: boolean;
    isProcessing?: boolean;
    isListening?: boolean;
    customMessage?: string;
    className?: string;
    debug?: boolean;
}


export function CallAudioWaveform({
    voiceCallService,
    isAudioPlaying,
    isProcessing = false,
    isListening = false,
    customMessage,
    className = '',
    debug = false
}: CallAudioWaveformProps) {

    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    const [audioState, setAudioState] = useState<AudioWaveformState>('silent');

    const serviceRef = useRef<VoiceCallService | null>(null);

    const prevStateRef = useRef<AudioWaveformState>('silent');


    const log = (message: string) => {
        if (debug) {
            console.log(`[CallAudioWaveform] ${message}`);
        }
    };


    useEffect(() => {
        if (!voiceCallService) {
            setAudioState('silent');
            setAudioElement(null);
            return;
        }


        serviceRef.current = voiceCallService;


        const element = voiceCallService.getAudioElement();
        if (element !== audioElement) {
            setAudioElement(element);
        }

        let newState: AudioWaveformState = 'silent';


        if (isAudioPlaying) {
            newState = 'playing';
        } else if (isListening) {
            newState = 'listening';
        } else if (isProcessing) {
            newState = 'silent';
        }

        if (newState !== prevStateRef.current) {
            prevStateRef.current = newState;
        }


        setAudioState(newState);
    }, [voiceCallService, isAudioPlaying, isProcessing, isListening, debug, audioElement]);


    // const shouldUseRealTime = audioElement !== null && (audioState === 'playing' || (debug && audioState !== 'silent'));

    return (
        <AnimatePresence mode="wait">
            {audioState !== 'silent' && (
                <RealTimeWaveform
                    audioElement={audioElement}
                    state={audioState}
                    className={className}
                    message={customMessage}
                />
            )}
        </AnimatePresence>
    );
} 