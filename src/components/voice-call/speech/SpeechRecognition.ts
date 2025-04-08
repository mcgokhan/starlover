
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    onstart: (event: Event) => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    onend: (event: Event) => void;
}


export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

export interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

export interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}


export enum RecognitionState {
    IDLE = 'idle',
    STARTING = 'starting',
    RUNNING = 'running',
    STOPPING = 'stopping',
    ERROR = 'error'
}


export interface SpeechRecognitionOptions {
    language?: string;
    silenceTimeout?: number;
    debug?: boolean;
}


export interface SpeechRecognitionCallbacks {
    onStart?: () => void;
    onResult?: (finalText: string, interimText: string) => void;
    onError?: (error: any) => void;
    onEnd?: () => void;
    onNoSpeech?: () => void;
    onComplete?: (completeText: string) => void;
}




export class SpeechRecognitionService {
    private recognition: SpeechRecognition | null = null;
    private options: SpeechRecognitionOptions;
    private callbacks: SpeechRecognitionCallbacks = {};


    private state: RecognitionState = RecognitionState.IDLE;
    private completeCalled: boolean = false;


    private finalTranscript: string = '';
    private interimTranscript: string = '';



    constructor(options: SpeechRecognitionOptions = {}) {
        this.options = {
            language: options.language || 'zh-CN',
            silenceTimeout: options.silenceTimeout || 1500,
            debug: options.debug || false
        };


        this.checkBrowserSupport();
    }




    public getState(): RecognitionState {
        return this.state;
    }




    private checkBrowserSupport(): boolean {
        if (!('webkitSpeechRecognition' in window) &&
            !('SpeechRecognition' in window)) {
            console.error('Current browser does not support speech recognition!');
            return false;
        }
        return true;
    }




    private setupRecognition() {

        if (this.recognition) {
            return;
        }

        const SpeechRecognitionAPI = (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        this.recognition = new SpeechRecognitionAPI();
        const recognition = this.recognition;

        if (!recognition) {
            this.state = RecognitionState.ERROR;
            return;
        }


        recognition.lang = this.options.language!;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;


        recognition.onstart = this.handleStart.bind(this);
        recognition.onresult = this.handleResult.bind(this);
        recognition.onerror = this.handleError.bind(this);
        recognition.onend = this.handleEnd.bind(this);


        this.finalTranscript = '';
        this.interimTranscript = '';
        this.completeCalled = false;
        this.state = RecognitionState.STARTING;
    }

    public start(callbacks: SpeechRecognitionCallbacks = {}): boolean {
        try {
            if (this.state !== RecognitionState.IDLE) {
                this.forceRelease();
            }

            this.callbacks = callbacks;
            this.state = RecognitionState.STARTING;
            this.setupRecognition();

            if (!this.recognition) {
                this.state = RecognitionState.ERROR;
                console.error('Speech recognition initialization failed');
                return false;
            }

            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            this.state = RecognitionState.ERROR;
            this.safeCallbackError(error);
            this.forceRelease();
            return false;
        }
    }




    public stop() {
        if (!this.recognition || this.state === RecognitionState.STOPPING) {
            return;
        }

        this.state = RecognitionState.STOPPING;
        this.completeCalled = false;

        try {

            const completeText = this.getCombinedText();


            this.recognition.stop();


            this.safeCallbackComplete(completeText);
        } catch (error) {
            console.error('Failed to stop speech recognition:', error);
            this.forceRelease();
        }
    }




    private forceRelease() {
        if (this.recognition) {
            try {

                this.recognition.stop();
            } catch (error) {
            }


            this.recognition = null;
        }


        this.state = RecognitionState.IDLE;
        this.completeCalled = false;
    }




    private getCombinedText(): string {
        return (this.finalTranscript + this.interimTranscript).trim();
    }



    private safeCallbackError(error: any) {
        if (this.callbacks.onError) {
            this.callbacks.onError(error);
        }
    }


    private safeCallbackComplete(text: string) {
        if (!this.completeCalled && this.callbacks.onComplete && text) {
            this.completeCalled = true;
            this.callbacks.onComplete(text);
        }
    }




    private handleStart() {
        if (this.options.debug) {
            console.log('Speech recognition started');
        }


        this.state = RecognitionState.RUNNING;
        this.completeCalled = false;

        if (this.callbacks.onStart) {
            this.callbacks.onStart();
        }
    }



    private handleResult(event: SpeechRecognitionEvent) {

        if (this.state !== RecognitionState.RUNNING) return;


        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];

            if (result.isFinal) {
                this.finalTranscript += result[0].transcript;
            } else {
                interimTranscript += result[0].transcript;
            }
        }


        this.interimTranscript = interimTranscript;


        if (this.callbacks.onResult) {
            this.callbacks.onResult(this.finalTranscript, this.interimTranscript);
        }

        if (this.options.debug) {
            console.log('Speech recognition result:', {
                final: this.finalTranscript,
                interim: this.interimTranscript,
                combined: this.getCombinedText()
            });
        }
    }




    private handleError(event: any) {
        const errorMsg = event.error || event;


        this.state = RecognitionState.ERROR;

        if (this.options.debug) {
            console.error('Speech recognition error:', errorMsg);
        }


        this.safeCallbackError(errorMsg);


        const completeText = this.getCombinedText();


        this.safeCallbackComplete(completeText);


        this.forceRelease();
    }




    private handleEnd() {
        if (this.options.debug) {
            console.log('Speech recognition ended');
        }


        const completeText = this.getCombinedText();


        if (this.callbacks.onEnd) {
            this.callbacks.onEnd();
        }


        this.safeCallbackComplete(completeText);


        this.recognition = null;
        this.state = RecognitionState.IDLE;
    }
} 