import { useRef, useEffect, useState } from 'react';


interface AudioAnalyzerStore {
    context: AudioContext | null;
    sourceNode: MediaElementAudioSourceNode | null;
    analyzerNode: AnalyserNode | null;
    connectedElement: HTMLAudioElement | null;
}


const audioAnalyzerStore: AudioAnalyzerStore = {
    context: null,
    sourceNode: null,
    analyzerNode: null,
    connectedElement: null
};


export interface AudioAnalyzerProps {
    audioElement: HTMLAudioElement | null;
    fftSize?: number;
    smoothingTimeConstant?: number;
    onDataUpdate?: (data: AudioAnalysisData) => void;
}



export interface AudioAnalysisData {
    frequencyData: Uint8Array;
    timeDomainData: Uint8Array;
    volume: number;
    isPlaying: boolean;
}


function resetAudioAnalyzer() {
    if (audioAnalyzerStore.sourceNode) {
        try {
            audioAnalyzerStore.sourceNode.disconnect();
        } catch (e) {
            console.log('Error disconnecting AudioSource:', e);
        }
        audioAnalyzerStore.sourceNode = null;
    }

    if (audioAnalyzerStore.context) {
        try {
            audioAnalyzerStore.context.close();
        } catch (e) {
            console.log('Error closing AudioContext:', e);
        }
        audioAnalyzerStore.context = null;
    }

    audioAnalyzerStore.analyzerNode = null;
    audioAnalyzerStore.connectedElement = null;
}


export function useAudioAnalyzer({
    audioElement,
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    onDataUpdate
}: AudioAnalyzerProps): AudioAnalysisData {

    const [analysisData, setAnalysisData] = useState<AudioAnalysisData>({
        frequencyData: new Uint8Array(0),
        timeDomainData: new Uint8Array(0),
        volume: 0,
        isPlaying: false
    });


    const rafRef = useRef<number | null>(null);

    const frequencyDataRef = useRef<Uint8Array | null>(null);
    const timeDomainDataRef = useRef<Uint8Array | null>(null);


    const calculateVolume = (dataArray: Uint8Array): number => {
        if (!dataArray || !dataArray.length) return 0;


        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        return average / 255;
    };


    useEffect(() => {
        if (!audioElement) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        try {

            if (
                !audioAnalyzerStore.context ||
                !audioAnalyzerStore.analyzerNode ||
                audioAnalyzerStore.connectedElement !== audioElement
            ) {
                if (audioAnalyzerStore.connectedElement &&
                    audioAnalyzerStore.connectedElement !== audioElement) {
                    resetAudioAnalyzer();
                }


                const context = new (window.AudioContext || (window as any).webkitAudioContext)();
                const analyzerNode = context.createAnalyser();


                analyzerNode.fftSize = fftSize;
                analyzerNode.smoothingTimeConstant = smoothingTimeConstant;


                if (!audioAnalyzerStore.sourceNode) {

                    const sourceNode = context.createMediaElementSource(audioElement);
                    sourceNode.connect(analyzerNode);
                    analyzerNode.connect(context.destination);


                    audioAnalyzerStore.context = context;
                    audioAnalyzerStore.sourceNode = sourceNode;
                    audioAnalyzerStore.analyzerNode = analyzerNode;
                    audioAnalyzerStore.connectedElement = audioElement;
                }


                frequencyDataRef.current = new Uint8Array(analyzerNode.frequencyBinCount);
                timeDomainDataRef.current = new Uint8Array(analyzerNode.frequencyBinCount);
            } else {
                if (audioAnalyzerStore.analyzerNode) {
                    audioAnalyzerStore.analyzerNode.fftSize = fftSize;
                    audioAnalyzerStore.analyzerNode.smoothingTimeConstant = smoothingTimeConstant;

                    if (!frequencyDataRef.current || !timeDomainDataRef.current ||
                        frequencyDataRef.current.length !== audioAnalyzerStore.analyzerNode.frequencyBinCount) {
                        frequencyDataRef.current = new Uint8Array(audioAnalyzerStore.analyzerNode.frequencyBinCount);
                        timeDomainDataRef.current = new Uint8Array(audioAnalyzerStore.analyzerNode.frequencyBinCount);
                    }
                }
            }


            setAnalysisData({
                frequencyData: frequencyDataRef.current || new Uint8Array(0),
                timeDomainData: timeDomainDataRef.current || new Uint8Array(0),
                volume: 0,
                isPlaying: !audioElement.paused
            });


            const updateData = () => {
                if (!audioAnalyzerStore.analyzerNode || !frequencyDataRef.current || !timeDomainDataRef.current) {
                    rafRef.current = requestAnimationFrame(updateData);
                    return;
                }

                try {

                    audioAnalyzerStore.analyzerNode.getByteFrequencyData(frequencyDataRef.current);


                    audioAnalyzerStore.analyzerNode.getByteTimeDomainData(timeDomainDataRef.current);


                    const volume = calculateVolume(frequencyDataRef.current);


                    const newData = {
                        frequencyData: frequencyDataRef.current,
                        timeDomainData: timeDomainDataRef.current,
                        volume,
                        isPlaying: audioElement && !audioElement.paused
                    };

                    setAnalysisData(newData);


                    if (onDataUpdate) {
                        onDataUpdate(newData);
                    }
                } catch (e) {
                    console.error('Error analyzing audio data:', e);
                }


                rafRef.current = requestAnimationFrame(updateData);
            };


            rafRef.current = requestAnimationFrame(updateData);

        } catch (error) {
            console.error('Error initializing audio analyzer:', error);
        }


        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, [audioElement, fftSize, smoothingTimeConstant, onDataUpdate]);

    return analysisData;
}


export interface WaveformProps {
    audioData: AudioAnalysisData;
    color?: string;
    barCount?: number;
    barWidth?: number;
    barGap?: number;
    height?: number;
    className?: string;
}


export function FrequencyGraph({
    audioData,
    color = 'rgba(255, 255, 255, 0.8)',
    barCount = 32,
    barWidth = 2,
    barGap = 1,
    height = 40,
    className = ''
}: WaveformProps) {

    const { frequencyData, isPlaying } = audioData;
    const bars = Math.min(barCount, frequencyData.length);
    const step = Math.floor(frequencyData.length / bars) || 1;

    return (
        <div
            className={`flex items-end justify-center overflow-hidden ${className}`}
            style={{ height: `${height}px` }}
        >
            {isPlaying && frequencyData.length > 0 ? (
                Array.from({ length: bars }).map((_, i) => {

                    const index = i * step;
                    const value = frequencyData[index] / 255.0;
                    const barHeight = Math.max(value * height, 2);

                    return (
                        <div
                            key={`freq-${i}`}
                            style={{
                                width: `${barWidth}px`,
                                height: `${barHeight}px`,
                                backgroundColor: color,
                                marginLeft: `${barGap}px`,
                                marginRight: `${barGap}px`,
                                borderRadius: '1px'
                            }}
                        />
                    );
                })
            ) : (

                <div
                    style={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '1px'
                    }}
                />
            )}
        </div>
    );
}

export function WaveformGraph({
    audioData,
    color = 'rgba(255, 255, 255, 0.8)',
    barCount = 32,
    barWidth = 2,
    barGap = 1,
    height = 40,
    className = ''
}: WaveformProps) {

    const { timeDomainData, isPlaying } = audioData;
    const bars = Math.min(barCount, timeDomainData.length);
    const step = Math.floor(timeDomainData.length / bars) || 1;

    return (
        <div
            className={`flex items-center justify-center overflow-hidden ${className}`}
            style={{ height: `${height}px` }}
        >
            {isPlaying && timeDomainData.length > 0 ? (
                Array.from({ length: bars }).map((_, i) => {
                    const index = i * step;
                    const normalizedValue = ((timeDomainData[index] / 255) * 2) - 1;
                    const barHeight = Math.abs(normalizedValue) * height;

                    return (
                        <div
                            key={`wave-${i}`}
                            style={{
                                width: `${barWidth}px`,
                                height: `${barHeight}px`,
                                backgroundColor: color,
                                marginLeft: `${barGap}px`,
                                marginRight: `${barGap}px`,
                                borderRadius: '1px'
                            }}
                        />
                    );
                })
            ) : (

                <div
                    style={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '1px'
                    }}
                />
            )}
        </div>
    );
} 