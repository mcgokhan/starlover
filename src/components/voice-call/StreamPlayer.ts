export class MP3StreamPlayer {
    private mediaSource: MediaSource | null = null;
    private sourceBuffer: SourceBuffer | null = null;
    private audioElement: HTMLAudioElement | null = null;

    private dataQueue: ArrayBuffer[] = [];
    private pendingDataQueue: ArrayBuffer[] = [];
    private isProcessingQueue: boolean = false;
    private abortController: AbortController | null = null;

    private readonly bufferThreshold: number = 0.5;
    private isPlaying: boolean = false;
    private isInitialBuffering: boolean = true;
    private readonly mimeType: string = 'audio/mpeg';

    private debug: boolean = false;
    private playerInstanceId: string = `player_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    public initialize(debug: boolean = false): HTMLAudioElement {
        this.debug = debug;
        this.log('Initialize player');

        if (!this.audioElement) {
            this.audioElement = document.createElement('audio');
            this.audioElement.id = `mp3-stream-player-${this.playerInstanceId}`;
            document.body.appendChild(this.audioElement);

            this.audioElement.addEventListener('playing', () => this.log('Audio started playing'));
            this.audioElement.addEventListener('pause', () => this.log('Audio paused'));
            this.audioElement.addEventListener('ended', () => this.log('Audio playback ended'));
            this.audioElement.addEventListener('error', (e) => this.log('Audio playback error', e));
        }

        return this.audioElement;
    }

    private checkMediaSourceSupport(): boolean {
        if (!('MediaSource' in window)) {
            console.error('Your browser does not support the MediaSource API, so streaming playback is not available');
            return false;
        }
        return true;
    }


    public prepareMediaSource(): boolean {
        if (!this.checkMediaSourceSupport()) return false;

        this.log('Preparing media source');
        this.releaseResources();

        try {
            this.mediaSource = new MediaSource();
            this.dataQueue = [];
            this.pendingDataQueue = [];
            this.isProcessingQueue = false;
            this.isPlaying = false;
            this.isInitialBuffering = true;

            this.mediaSource.addEventListener('sourceopen', this.handleSourceOpen);

            if (this.audioElement) {
                this.audioElement.src = URL.createObjectURL(this.mediaSource);
                this.audioElement.load();
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize MediaSource:', error);
            return false;
        }
    }

    private handleSourceOpen = (): void => {
        if (!this.mediaSource || this.sourceBuffer) return;

        this.log('MediaSource opened, adding SourceBuffer');
        try {
            this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType);
            this.sourceBuffer.addEventListener('updateend', this.handleBufferUpdateEnd);
            this.sourceBuffer.addEventListener('updateend', this.handleBufferUpdateEnd);

            this.processDataQueue();
        } catch (error) {
            console.error('Failed to create SourceBuffer:', error);
        }
    };

    private handleBufferUpdateEnd = (): void => {
        this.isProcessingQueue = false;
        this.checkAndStartPlayback();
        this.processDataQueue();
    };

    public async playStream(response: Response): Promise<void> {
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        this.prepareMediaSource();

        this.log('Starting to receive audio data');
        this.abortController = new AbortController();

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Failed to read response data');
        }

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    this.log('Audio stream read completed');
                    this.finishStream();
                    break;
                }

                if (value && value.byteLength > 0) {
                    this.enqueueData(value.buffer.slice(0));
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                this.log('Audio stream read was interrupted');
            } else {
                console.error('Audio stream read error:', error);
                throw error;
            }
        }
    }

    private enqueueData(data: ArrayBuffer): void {
        this.dataQueue.push(data);
        this.processDataQueue();
    }

    private processDataQueue(): void {
        if (
            this.isProcessingQueue ||
            this.dataQueue.length === 0 ||
            !this.sourceBuffer ||
            this.sourceBuffer.updating
        ) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            const data = this.dataQueue.shift();
            if (data) {
                this.sourceBuffer.appendBuffer(data);
                this.log(`Added ${data.byteLength} bytes to buffer`);
            }
        } catch (error) {
            this.isProcessingQueue = false;

            if (error instanceof Error) {
                if (error.name === 'QuotaExceededError') {
                    this.log('Buffer full, trying to remove old data');
                    this.removeOldestBufferedRange();
                } else {
                    console.error('Failed to add data to buffer:', error);
                }
            }

            setTimeout(() => this.processDataQueue(), 50);
        }
    }

    private checkAndStartPlayback(): void {
        if (!this.audioElement || !this.sourceBuffer || this.sourceBuffer.updating) {
            return;
        }

        if (this.isInitialBuffering && this.audioElement.paused) {
            if (this.sourceBuffer.buffered.length > 0) {
                const bufferedSeconds = this.sourceBuffer.buffered.end(0) - this.sourceBuffer.buffered.start(0);

                if (bufferedSeconds >= this.bufferThreshold) {
                    this.log(`Buffer sufficient (${bufferedSeconds.toFixed(2)} seconds), starting playback`);

                    this.audioElement.currentTime = this.sourceBuffer.buffered.start(0);

                    this.audioElement.play()
                        .then(() => {
                            this.isPlaying = true;
                            this.isInitialBuffering = false;
                        })
                        .catch(error => {
                            console.error('Playback failed:', error);
                            setTimeout(() => this.checkAndStartPlayback(), 1000);
                        });
                } else {
                    this.log(`Buffer insufficient (${bufferedSeconds.toFixed(2)} seconds < ${this.bufferThreshold} seconds)`);
                }
            }
        }
    }

    private removeOldestBufferedRange(): void {
        if (!this.sourceBuffer || this.sourceBuffer.updating || !this.audioElement) {
            return;
        }

        const buffered = this.sourceBuffer.buffered;

        if (buffered.length > 0 && this.audioElement.currentTime > 0) {
            const currentTime = this.audioElement.currentTime;
            let removeEnd = Math.max(currentTime - 2, 0);

            if (removeEnd > buffered.start(0)) {
                this.log(`Remove buffer: ${buffered.start(0)} seconds - ${removeEnd} seconds`);
                this.sourceBuffer.remove(buffered.start(0), removeEnd);
            }
        }
    }

    private finishStream(): void {
        if (this.mediaSource && this.mediaSource.readyState === 'open') {
            if (this.dataQueue.length === 0 && this.sourceBuffer && !this.sourceBuffer.updating) {
                this.log('Mark media stream as ended');
                try {
                    this.mediaSource.endOfStream();
                } catch (error) {
                    console.warn('Failed to mark media stream as ended:', error);
                }
            } else {
                setTimeout(() => this.finishStream(), 200);
            }
        }
    }

    public stop(): void {
        this.log('Stopping playback');

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.audioElement) {
            this.audioElement.pause();
            try {
                this.audioElement.currentTime = 0;
            } catch (e) {
            }
        }

        this.releaseResources();
    }

    private releaseResources(): void {
        if (this.mediaSource) {
            if (this.mediaSource.readyState === 'open') {
                try {
                    if (this.sourceBuffer && !this.sourceBuffer.updating) {
                        this.mediaSource.endOfStream();
                    }
                } catch (e) {
                }
            }

            if (this.sourceBuffer) {
                try {
                    this.sourceBuffer.removeEventListener('updateend', this.handleBufferUpdateEnd);
                } catch (e) {
                }
            }

            try {
                this.mediaSource.removeEventListener('sourceopen', this.handleSourceOpen);
            } catch (e) {
            }
        }

        if (this.audioElement && this.audioElement.src) {
            if (this.audioElement.src.startsWith('blob:')) {
                URL.revokeObjectURL(this.audioElement.src);
            }
            this.audioElement.removeAttribute('src');
            this.audioElement.load();
        }

        this.mediaSource = null;
        this.sourceBuffer = null;
        this.dataQueue = [];
        this.pendingDataQueue = [];
        this.isProcessingQueue = false;
        this.isPlaying = false;
        this.isInitialBuffering = true;
    }

    public destroy(): void {
        this.log('Destroying player');
        this.stop();

        if (this.audioElement && this.audioElement.parentNode) {
            this.audioElement.removeEventListener('playing', () => { });
            this.audioElement.removeEventListener('pause', () => { });
            this.audioElement.removeEventListener('ended', () => { });
            this.audioElement.removeEventListener('error', () => { });

            this.audioElement.parentNode.removeChild(this.audioElement);
        }

        this.audioElement = null;
    }

    private log(message: string, data?: any): void {
        if (this.debug) {
            console.log(`[MP3StreamPlayer-${this.playerInstanceId}] ${message}`, data ? data : '');
        }
    }
} 