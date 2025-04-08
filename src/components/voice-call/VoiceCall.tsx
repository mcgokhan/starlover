import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { SpeechRecognitionService, RecognitionState } from './speech';
import { VoiceCallService } from './VoiceCallService';
import { formatDuration } from './utils';
import { CallAudioWaveform } from './audio';
import {
  VoiceInputWaveform,
  AvatarFrame,
  CallDialButton,
  RecordingPulseButton
} from './components';
import { motion, AnimatePresence } from 'framer-motion';
import yangmi from './assets/yangmi.webp';
import { ChatTextInput } from './components/ChatTextInput';
import { InputModeSwitch, InputMode } from './components/InputModeSwitch';

const MemoizedCallDialButton = memo(CallDialButton);


interface VoiceCallProps {
  callerName?: string;
  callerAvatar?: string;
  description?: string;
  debug?: boolean;
  apiUrl?: {
    callStatus?: string;
    chatStream?: string;
  };


  requestHandlers?: {
    onCallStatusRequest?: (data: any) => Promise<Response>;
    onChatStreamRequest?: (data: any) => Promise<Response>;
  };
}

type CallState = 'incoming' | 'connecting' | 'active' | 'ended';
type MessageState = 'thinking' | 'reply' | 'listening' | null;


export default function VoiceCall({
  callerName = 'Yang Mi',
  callerAvatar = yangmi,
  description = 'Chinese actress, your virtual AI girlfriend',
  debug = false,
  apiUrl = {
    callStatus: '/api/chat/call-status',
    chatStream: '/api/chat/stream'
  },
  requestHandlers,
}: VoiceCallProps) {

  const [callState, setCallState] = useState<CallState>('incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isInputActive, setIsInputActive] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messageType, setMessageType] = useState<MessageState>(null);
  const [interimTranscript, setInterimTranscript] = useState('');

  const [buttonsPreloaded, setButtonsPreloaded] = useState(false);

  const [hasError, setHasError] = useState(false);

  const [inputMode, setInputMode] = useState<InputMode>('voice');


  const interimTimerRef = useRef<number | null>(null);


  const voiceCallServiceRef = useRef<VoiceCallService | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionService | null>(null);


  const mountedRef = useRef(false);


  const cooldownTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      if (mountedRef.current) {
        setButtonsPreloaded(true);
      }
    }, 10);

    return () => clearTimeout(preloadTimer);
  }, []);


  const clearInterimTranscriptTimer = useCallback(() => {
    if (interimTimerRef.current) {
      clearTimeout(interimTimerRef.current);
      interimTimerRef.current = null;
    }
  }, []);


  const clearCooldownTimer = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  }, []);


  const setupInterimTranscriptTimer = useCallback(() => {
    clearInterimTranscriptTimer();

    interimTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        setInterimTranscript('');
      }
    }, 1500);
  }, [clearInterimTranscriptTimer]);


  const initializeService = useCallback(() => {
    if (!voiceCallServiceRef.current) {
      const service = new VoiceCallService(debug);
      service.initialize();

      service.setApiEndpoints({
        callStatusUrl: apiUrl.callStatus,
        chatStreamUrl: apiUrl.chatStream
      });

      if (requestHandlers) {
        service.setRequestHandlers({
          callStatusHandler: requestHandlers.onCallStatusRequest,
          chatStreamHandler: requestHandlers.onChatStreamRequest
        });
      }

      voiceCallServiceRef.current = service;


      const isPlaying = service.isPlaying();
      if (isPlaying !== isAudioPlaying) {
        setIsAudioPlaying(isPlaying);
        if (isPlaying) {
          setMessageType('reply');
        }
      }
    }
    return voiceCallServiceRef.current;
  }, [debug, apiUrl, requestHandlers, isAudioPlaying]);


  const initializeSpeechRecognition = useCallback(() => {
    try {
      if (!speechRecognitionRef.current) {

        speechRecognitionRef.current = new SpeechRecognitionService({
          language: 'zh-CN',
          silenceTimeout: 2000,
          debug: debug
        });
      }
      return speechRecognitionRef.current;
    } catch (error) {
      console.error('Failed to initialize speech recognition service:', error);
      setHasError(true);
      return null;
    }
  }, [debug]);

  const sendRecordingMessage = useCallback(async (text: string) => {
    if (!text?.trim() || callState !== 'active' || isAudioPlaying || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setMessageType('thinking');


      const service = voiceCallServiceRef.current;
      if (!service) {
        throw new Error('Voice service not initialized');
      }


      await service.sendMessage(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsProcessing(false);
      setMessageType(null);
      setHasError(true);
    }
  }, [callState, isAudioPlaying, isProcessing]);


  const handleRecognitionResult = useCallback((finalText: string, interimText: string) => {
    if (interimText) {
      setInterimTranscript(interimText);
      setupInterimTranscriptTimer();
    } else {
      setInterimTranscript('');
    }


    if (finalText) {
      setCurrentMessage(finalText);
    }
  }, [setupInterimTranscriptTimer]);


  const safeStopRecognition = useCallback(() => {
    try {
      if (speechRecognitionRef.current) {
        const state = speechRecognitionRef.current.getState();

        if (state === RecognitionState.RUNNING || state === RecognitionState.STARTING) {
          speechRecognitionRef.current.stop();
        }
      }
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    } finally {
      setIsListening(false);
      setInterimTranscript('');
      clearInterimTranscriptTimer();
    }
  }, [clearInterimTranscriptTimer]);


  const startRecognition = useCallback(() => {
    if (cooldownTimerRef.current) {
      return false;
    }

    try {
      const speechRecognition = initializeSpeechRecognition();
      if (!speechRecognition) {
        throw new Error('Speech recognition service not initialized');
      }


      setCurrentMessage('');
      setInterimTranscript('');
      clearInterimTranscriptTimer();


      const success = speechRecognition.start({
        onStart: () => {
          setIsListening(true);
          setMessageType('listening');
          setHasError(false);
        },
        onResult: handleRecognitionResult,
        onError: (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          setIsInputActive(false);
          setMessageType(isAudioPlaying ? 'reply' : null);
          setHasError(true);
          clearInterimTranscriptTimer();

          clearCooldownTimer();
          cooldownTimerRef.current = window.setTimeout(() => {
            if (mountedRef.current) {
              clearCooldownTimer();
            }
          }, 1000);
        },
        onEnd: () => {
          setIsListening(false);
          setInterimTranscript('');
          setMessageType(isAudioPlaying ? 'reply' : null);
          clearInterimTranscriptTimer();
        },
        onComplete: (text) => {
          if (text?.trim() && !isProcessing && callState === 'active' && !isAudioPlaying) {
            requestAnimationFrame
            requestAnimationFrame(() => {
              if (mountedRef.current) {
                sendRecordingMessage(text);
              }
            });
          }
        }
      });

      return success;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      setIsInputActive(false);
      setHasError(true);


      clearCooldownTimer();
      cooldownTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          clearCooldownTimer();
        }
      }, 1000);

      return false;
    }
  }, [
    initializeSpeechRecognition,
    clearInterimTranscriptTimer,
    clearCooldownTimer,
    handleRecognitionResult,
    isAudioPlaying,
    isProcessing,
    callState,
    sendRecordingMessage
  ]);


  const toggleVoiceInput = useCallback(() => {
    if (isProcessing) return;

    if (isInputActive) {
      safeStopRecognition();
      setIsInputActive(false);
    } else {

      setIsInputActive(true);
      const success = startRecognition();

      if (!success) {
        setIsInputActive(false);
        console.error('Failed to start speech recognition');
        setHasError(true);
      }
    }
  }, [isInputActive, isProcessing, safeStopRecognition, startRecognition]);


  const cleanupResources = useCallback(async () => {
    if (!mountedRef.current) return;


    clearInterimTranscriptTimer();
    clearCooldownTimer();


    safeStopRecognition();
    speechRecognitionRef.current = null;


    try {
      if (voiceCallServiceRef.current) {
        await voiceCallServiceRef.current.endCall();
        voiceCallServiceRef.current.destroy();
        voiceCallServiceRef.current = null;
      }
    } catch (error) {
      console.error('Failed to clean up voice service:', error);
    }
  }, [clearInterimTranscriptTimer, clearCooldownTimer, safeStopRecognition]);


  useEffect(() => {
    mountedRef.current = true;

    const timerId = requestAnimationFrame(() => {
      if (mountedRef.current) {
        initializeService();
        initializeSpeechRecognition();
      }
    });


    return () => {
      cancelAnimationFrame(timerId);

      if (mountedRef.current) {
        mountedRef.current = false;
        cleanupResources();
      }
    };
  }, [initializeService, initializeSpeechRecognition, cleanupResources]);


  useEffect(() => {
    let timer: number;
    if (callState === 'active' && callStartTime) {
      timer = window.setInterval(() => {
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        setCallDuration(duration);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState, callStartTime]);


  useEffect(() => {
    const checkAudioStatus = () => {
      if (voiceCallServiceRef.current && mountedRef.current) {

        const isActuallyPlaying = voiceCallServiceRef.current.isActuallyPlaying();
        const isActive = voiceCallServiceRef.current.isActive();


        if (isAudioPlaying !== isActuallyPlaying) {
          setIsAudioPlaying(isActuallyPlaying);

          if (isActuallyPlaying) {
            setIsProcessing(false);
            setMessageType('reply');
          } else if (!isActive && messageType === 'reply') {
            setMessageType(null);
          }
        }
      }
    };

    const intervalId = setInterval(checkAudioStatus, 100);

    return () => clearInterval(intervalId);
  }, [isAudioPlaying, messageType]);


  const endCall = useCallback(async () => {
    try {

      safeStopRecognition();

      setCallState('ended');
      setCallStartTime(null);
      setIsAudioPlaying(false);
      setIsProcessing(false);
      setIsListening(false);
      setMessageType(null);
      setIsInputActive(false);

      if (voiceCallServiceRef.current) {
        await voiceCallServiceRef.current.endCall();
      }
    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }, [safeStopRecognition]);


  const answerCall = useCallback(async () => {
    try {
      setCallState('connecting');
      setIsProcessing(true);
      setHasError(false);


      const service = initializeService();


      await service.answerCall({
        voice_role: 'yangmi',
        speed: 1.0,
        volume: 1.0,
        format: 'mp3'
      });


      if (mountedRef.current) {
        if (debug) {
          console.log('Answer call successfully, update callState to active');
        }

        setIsProcessing(false);
        setMessageType('reply');
        setCallState('active');
        setCallStartTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to answer call:', error);


      if (mountedRef.current) {
        setCallState('ended');
        setIsAudioPlaying(false);
        setIsProcessing(false);
        setMessageType(null);
        setHasError(true);
      }
    }
  }, [initializeService, debug]);


  const getStatusMessage = useCallback(() => {
    if (hasError) {
      return 'Error occurred';
    } else if (messageType === 'thinking') {
      return 'Thinking...';
    } else if (messageType === 'listening') {
      return 'Listening...';
    } else if (messageType === 'reply') {
      return 'Talking...';
    }
    return undefined;
  }, [messageType, hasError]);

  const handleEndCall = useCallback(() => {
    endCall();
  }, [endCall]);

  const handleAnswerCall = useCallback(() => {
    answerCall();
  }, [answerCall]);

  const handleToggleVoiceInput = useCallback(() => {
    toggleVoiceInput();
  }, [toggleVoiceInput]);

  const handleTextMessageSend = useCallback(async (text: string) => {
    if (!text?.trim() || callState !== 'active' || isAudioPlaying || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setMessageType('thinking');

      const service = voiceCallServiceRef.current;
      if (!service) {
        throw new Error('Voice service not initialized');
      }

      await service.sendMessage(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsProcessing(false);
      setMessageType(null);
      setHasError(true);
    }
  }, [callState, isAudioPlaying, isProcessing]);


  const handleInputModeChange = useCallback((mode: InputMode) => {
    if (isProcessing) return;

    if (mode === 'voice') {
      setInputMode('voice');
      if (isInputActive) {
        safeStopRecognition();
      }
    } else {
      setInputMode('text');
      if (isInputActive) {
        safeStopRecognition();
        setIsInputActive(false);
      }
    }
  }, [isProcessing, isInputActive, safeStopRecognition]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500">
      <div className="w-full h-full md:w-[450px] md:h-[85vh] md:rounded-3xl bg-gradient-to-b from-purple-600/50 to-pink-500/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="h-full flex flex-col items-center justify-between p-6 md:p-8">
          <div className="w-full pt-safe flex items-center">
            <div className="flex-1 flex justify-start">
            </div>
            <h1 className="flex-1 text-center text-xl md:text-2xl font-semibold text-white">Voice Call</h1>
            <div className="flex-1" />
          </div>

          <div className="flex flex-col items-center justify-center flex-grow gap-8">
            <div className="relative">
              <AvatarFrame
                isActive={callState === 'connecting' || callState === 'active'}
                className="w-24 h-24 md:w-32 md:h-32"
              >
                <img
                  src={callerAvatar}
                  alt={callerName}
                  className="w-full h-full object-cover"
                />
              </AvatarFrame>

              <CallAudioWaveform
                voiceCallService={voiceCallServiceRef.current}
                isAudioPlaying={isAudioPlaying}
                isProcessing={isProcessing}
                isListening={isListening}
                customMessage={getStatusMessage()}
                className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 z-10 min-w-[80px]"
                debug={debug}
              />
            </div>

            <div className="text-center min-h-[120px] flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{callerName}</h2>
              <p className="text-lg md:text-xl text-white/80">
                {callState === 'incoming' && 'Incoming...'}
                {callState === 'connecting' && 'Connecting...'}
                {callState === 'active' && formatDuration(callDuration)}
                {callState === 'ended' && 'Call ended'}
              </p>
              {callState === 'incoming' && (
                <p className="text-xs md:text-sm text-white/60 mt-4 italic">
                  "{description}"
                </p>
              )}
            </div>
          </div>

          {callState === 'active' && (
            <div className="w-full flex flex-col items-center justify-center gap-6 mb-24">
              <AnimatePresence>
                {isListening && interimTranscript && (
                  <motion.div
                    key="interim-transcript"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-blue-500/20 backdrop-blur-sm rounded-lg px-6 py-3 max-w-[80%] text-center"
                  >
                    <p className="text-white/90 text-sm">{interimTranscript}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {isInputActive && inputMode === 'voice' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <motion.div
                      className="bg-purple-500/20 backdrop-blur-sm rounded-full px-8 py-3 flex items-center gap-3"
                    >
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-red-500"
                        animate={{
                          opacity: [1, 0.5],
                          scale: [1, 0.8],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      />
                      <span className="text-white text-sm font-medium">Recording...</span>
                    </motion.div>

                    <motion.p
                      className="text-white/80 text-sm mt-3 px-6 text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Click the microphone button again to send message.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {inputMode === 'voice' && !isInputActive && (
                  <motion.div
                    key="voice-instructions"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-white/80 text-base px-6">
                      Click the microphone button to start recording.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full mt-4">
                {callState === 'active' && (
                  <div className="flex justify-center mb-5">
                    <InputModeSwitch
                      mode={inputMode}
                      onModeChange={handleInputModeChange}
                      disabled={isProcessing}
                      className="transform scale-125 md:scale-140"
                    />
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {inputMode === 'voice' ? (
                    <motion.div
                      key="voice-controls"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex justify-center items-center gap-8"
                    >
                      <MemoizedCallDialButton
                        variant="decline"
                        onClick={handleEndCall}
                        icon={<PhoneOff className="h-8 w-8 md:h-10 md:w-10 text-white" />}
                        enableRipple={true}
                      />

                      <RecordingPulseButton
                        isRecording={isInputActive}
                        onClick={handleToggleVoiceInput}
                        disabled={isAudioPlaying || isProcessing}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="text-input"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="flex items-center gap-4 px-2 md:px-6 w-full"
                    >
                      <MemoizedCallDialButton
                        variant="decline"
                        onClick={handleEndCall}
                        icon={<PhoneOff className="h-8 w-8 md:h-10 md:w-10 text-white" />}
                        enableRipple={true}
                      />

                      <ChatTextInput
                        onSend={handleTextMessageSend}
                        disabled={isAudioPlaying || isProcessing}
                        className="flex-1 max-w-full md:max-w-[350px]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {isListening && (
            <VoiceInputWaveform isActive={isListening} />
          )}

          {callState !== 'active' && buttonsPreloaded && (
            <div className="w-full flex justify-center gap-6 md:gap-8 mb-24 pb-safe">
              {callState === 'incoming' ? (
                <>
                  <MemoizedCallDialButton
                    variant="decline"
                    onClick={handleEndCall}
                    pulseEffect={false}
                    enableRipple={buttonsPreloaded}
                    icon={<PhoneOff className="w-7 h-7 md:w-8 md:h-8 text-white" />}
                  />

                  <MemoizedCallDialButton
                    variant="accept"
                    onClick={handleAnswerCall}
                    pulseEffect={false}
                    enableRipple={buttonsPreloaded}
                    icon={<Phone className="w-7 h-7 md:w-8 md:h-8 text-white" />}
                  />
                </>
              ) : callState === 'connecting' ? (
                <MemoizedCallDialButton
                  variant="decline"
                  onClick={handleEndCall}
                  pulseEffect={false}
                  enableRipple={buttonsPreloaded}
                  icon={<PhoneOff className="w-7 h-7 md:w-8 md:h-8 text-white" />}
                />
              ) : callState === 'ended' ? (
                <div className="h-[64px] md:h-[72px]" />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}