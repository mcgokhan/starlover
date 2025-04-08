import { MP3StreamPlayer } from './StreamPlayer';

export interface VoiceCallOptions {
    voice_role?: string;
    speed?: number;
    volume?: number;
    format?: string;
}

export interface ApiEndpoints {
    callStatusUrl?: string;
    chatStreamUrl?: string;
}


export interface RequestHandlers {
    callStatusHandler?: (data: any) => Promise<Response>;
    chatStreamHandler?: (data: any) => Promise<Response>;
}


export class VoiceCallService {

    private audioPlayer: MP3StreamPlayer;


    private callStatus: 'idle' | 'connecting' | 'active' | 'ended' = 'idle';
    private callStartTime: number | null = null;


    private voiceRole: string = 'default';
    private format: string = 'mp3';
    private speed: number = 1.0;
    private volume: number = 1.0;

    private callStatusUrl: string = '/api/chat/call-status';
    private chatStreamUrl: string = '/api/chat/stream';


    private isAudioActive: boolean = false;
    private isAudioPlaying: boolean = false;


    private statusCheckInterval: number | null = null;


    private debug: boolean = false;


    private audioElement: HTMLAudioElement | null = null;


    private currentRequestController: AbortController | null = null;


    private requestHandlers: RequestHandlers | null = null;



    constructor(debug: boolean = false) {
        this.debug = debug;
        this.audioPlayer = new MP3StreamPlayer();
    }




    public initialize(): void {
        this.audioElement = this.audioPlayer.initialize(this.debug);
        this.log('Voice call service initialized');


        if (this.audioElement) {
            this.audioElement.addEventListener('playing', () => {
                this.log('Audio started playing');
                this.isAudioPlaying = true;
                this.isAudioActive = true;
            });

            this.audioElement.addEventListener('pause', () => {
                this.log('Audio paused');
                this.isAudioPlaying = false;
            });

            this.audioElement.addEventListener('ended', () => {
                this.log('Audio playback ended');
                this.isAudioPlaying = false;
                this.isAudioActive = false;
            });
        }


        this.startStatusCheck();
    }




    private startStatusCheck(): void {

        if (this.statusCheckInterval !== null) {
            window.clearInterval(this.statusCheckInterval);
        }


        this.statusCheckInterval = window.setInterval(() => {

            if (this.audioElement) {
                const isElementPlaying = !this.audioElement.paused &&
                    !this.audioElement.ended &&
                    this.audioElement.readyState > 2;


                if (isElementPlaying && !this.isAudioPlaying) {
                    this.isAudioPlaying = true;
                    this.isAudioActive = true;
                } else if (!isElementPlaying && this.isAudioPlaying) {
                    this.isAudioPlaying = false;

                    if (!this.isAudioActive) {
                        this.isAudioActive = false;
                    }
                }
            } else {
                this.isAudioPlaying = false;
            }
        }, 200);
    }


    public setApiEndpoints(endpoints: ApiEndpoints): void {
        if (endpoints.callStatusUrl) {
            this.callStatusUrl = endpoints.callStatusUrl;
        }
        if (endpoints.chatStreamUrl) {
            this.chatStreamUrl = endpoints.chatStreamUrl;
        }
        this.log(`API endpoints updated: callStatus=${this.callStatusUrl}, chatStream=${this.chatStreamUrl}`);
    }



    public setRequestHandlers(handlers: RequestHandlers): void {
        this.requestHandlers = handlers;
        this.log('Custom request handlers set');
    }




    private abortCurrentRequest(): void {
        if (this.currentRequestController) {
            this.log('Aborting current request');
            this.currentRequestController.abort();
            this.currentRequestController = null;
        }
    }


    public async answerCall(options: VoiceCallOptions = {}): Promise<void> {
        try {
            this.log('Answering call...');


            this.abortCurrentRequest();

            if (this.isAudioActive) {
                this.audioPlayer.stop();
                this.isAudioActive = false;
            }


            this.callStatus = 'connecting';


            this.voiceRole = options.voice_role || 'default';
            this.format = options.format || 'mp3';
            this.speed = options.speed || 1.0;
            this.volume = options.volume || 1.0;


            this.audioPlayer.prepareMediaSource();


            const requestData = {
                status: 'accepted',
                voice_role: this.voiceRole,
                format: this.format,
                speed: this.speed,
                volume: this.volume
            };

            this.log('Sending answer request');


            const response = await this.sendRequest(this.callStatusUrl, requestData);

            if (this.currentRequestController?.signal.aborted) {
                this.log('Answer request was aborted');
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to answer call, status code: ${response.status}`);
            }


            this.isAudioActive = true;


            this.log('Playing greeting voice...');
            this.audioPlayer.playStream(response);


            this.callStatus = 'active';
            this.callStartTime = Date.now();
            this.log('Call activated');
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                this.log('Answer request aborted');
                return;
            }

            this.log('Failed to answer call', error);
            this.isAudioActive = false;
            this.isAudioPlaying = false;
            await this.endCall();
            throw error;
        } finally {

            this.currentRequestController = null;
        }
    }


    public async sendMessage(message: string): Promise<void> {
        if (this.callStatus !== 'active') {
            throw new Error('Failed to send message: call not activated');
        }

        try {
            this.log(`Sending message: "${message}"`);

            if (this.isAudioPlaying) {
                this.audioPlayer.stop();
                this.isAudioPlaying = false;
            }


            this.isAudioActive = true;


            const requestData = {
                query: message,
                voice_role: this.voiceRole,
                format: this.format,
                speed: this.speed,
                volume: this.volume
            };


            const response = await this.sendRequest(this.chatStreamUrl, requestData);

            if (!response.ok) {
                throw new Error(`Failed to send message, status code: ${response.status}`);
            }

            this.log('Playing AI reply...');
            await this.audioPlayer.playStream(response);

            this.log('Message processed, audio may still be playing');

        } catch (error) {
            this.log('Failed to send message', error);
            this.isAudioActive = false;
            this.isAudioPlaying = false;
            throw error;
        }
    }




    public async endCall(): Promise<void> {
        try {
            this.log('Ending call...');


            this.abortCurrentRequest();


            this.audioPlayer.stop();
            this.isAudioActive = false;
            this.isAudioPlaying = false;


            await this.sendRequest(this.callStatusUrl, { status: 'end' });

        } catch (error) {
            this.log('Failed to end call request', error);
        } finally {
            this.callStatus = 'ended';
            this.callStartTime = null;
            this.currentRequestController = null;
            this.log('Call ended');
        }
    }




    public getCallStatus(): 'idle' | 'connecting' | 'active' | 'ended' {
        return this.callStatus;
    }


    public getCallDuration(): number {
        if (this.callStatus === 'active' && this.callStartTime) {
            return Math.floor((Date.now() - this.callStartTime) / 1000);
        }
        return 0;
    }




    public isPlaying(): boolean {
        return this.isAudioPlaying || this.isAudioActive;
    }


    public isActuallyPlaying(): boolean {
        return this.isAudioPlaying;
    }


    public isActive(): boolean {
        return this.isAudioActive;
    }


    public getAudioElement(): HTMLAudioElement | null {
        return this.audioElement;
    }




    public destroy(): void {
        this.log('Destroying voice call service');

        if (this.statusCheckInterval !== null) {
            window.clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }

        if (this.audioElement) {
            this.audioElement.removeEventListener('playing', () => { });
            this.audioElement.removeEventListener('pause', () => { });
            this.audioElement.removeEventListener('ended', () => { });
        }

        this.audioPlayer.stop();
        this.isAudioActive = false;
        this.isAudioPlaying = false;
        this.audioPlayer.destroy();
        this.audioElement = null;
    }

    private async sendRequest(url: string, data: any): Promise<Response> {

        this.currentRequestController = new AbortController();

        if (this.requestHandlers) {
            if (url === this.callStatusUrl && this.requestHandlers.callStatusHandler) {
                this.log('Using custom call status handler');
                return this.requestHandlers.callStatusHandler(data);
            }
            if (url === this.chatStreamUrl && this.requestHandlers.chatStreamHandler) {
                this.log('Using custom chat stream handler');
                return this.requestHandlers.chatStreamHandler(data);
            }
        }

        this.log('Using default fetch request');
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: this.currentRequestController.signal
        });
    }

    private log(message: string, data?: any): void {
        if (this.debug) {
            console.log(`[VoiceCallService] ${message}`, data ? data : '');
        }
    }
} 