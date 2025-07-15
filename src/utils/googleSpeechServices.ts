// Enhanced Google Speech Services with advanced features and better accuracy
export interface GoogleSpeechConfig {
  apiKey?: string;
  language?: string;
  sampleRate?: number;
  // Enhanced config options
  alternativeLanguages?: string[];
  profanityFilter?: boolean;
  enableWordTimeOffsets?: boolean;
  enableWordConfidence?: boolean;
  model?: 'latest_long' | 'latest_short' | 'command_and_search' | 'phone_call' | 'video';
  useEnhanced?: boolean;
  maxAlternatives?: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  // Enhanced result properties
  alternatives?: Array<{
    transcript: string;
    confidence: number;
    words?: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
  }>;
  languageCode?: string;
  stability?: number;
}

export interface TTSOptions {
  voice?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  // Enhanced TTS options
  voiceGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  ssmlText?: string;
  effectsProfile?: string[];
  audioEncoding?: 'MP3' | 'OGG_OPUS' | 'MULAW' | 'LINEAR16';
}

// Enhanced microphone management with advanced Google Speech features
export class EnhancedMicrophoneManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private isMutedDuringAIResponse = false;
  private recognition: SpeechRecognition | null = null;
  private isAISpeaking = false;
  private onTranscript?: (result: SpeechRecognitionResult) => void;
  private onError?: (error: string) => void;
  
  // Enhanced properties for better speech processing
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private streamingRecognitionActive = false;
  private lastTranscriptTime = 0;
  private confidenceThreshold = 0.7;
  private speechDetectionTimeout: NodeJS.Timeout | null = null;
  private adaptiveLanguageDetection = true;
  
  // Enhanced TTS coordination
  private speechEndTimeout: NodeJS.Timeout | null = null;
  private speechEndDelayMs = 2000; // Wait 2 seconds after TTS ends before resuming mic

  constructor(
    private config: GoogleSpeechConfig = {},
    callbacks: {
      onTranscript?: (result: SpeechRecognitionResult) => void;
      onError?: (error: string) => void;
    } = {}
  ) {
    this.onTranscript = callbacks.onTranscript;
    this.onError = callbacks.onError;
    
    // Enhanced default configuration
    this.config = {
      language: 'en-US',
      sampleRate: 48000,
      alternativeLanguages: ['en-GB', 'en-AU', 'en-IN'],
      profanityFilter: false,
      enableWordTimeOffsets: true,
      enableWordConfidence: true,
      model: 'latest_long',
      useEnhanced: true,
      maxAlternatives: 3,
      ...config
    };
    
    this.confidenceThreshold = 0.7;
  }

  async startRecording(): Promise<void> {
    if (this.isRecording || this.isMutedDuringAIResponse || this.isAISpeaking) {
      console.log('🎤 Microphone blocked - AI is speaking or already recording');
      return;
    }

    try {
      // Enhanced audio constraints for better quality
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.config.sampleRate || 48000,
          channelCount: 1
        }
      });

      // Initialize enhanced audio processing
      this.initializeAudioProcessing();

      // Use enhanced Google Speech API if available
      if (this.config.apiKey) {
        await this.startEnhancedGoogleSpeechRecognition();
        return;
      }

      // Enhanced Web Speech API fallback
      this.startEnhancedWebSpeechRecognition();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.onError?.('Failed to access microphone. Please check permissions.');
    }
  }

  private initializeAudioProcessing(): void {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.audioStream!);
      this.analyser = this.audioContext.createAnalyser();
      
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      
      // Voice activity detection for better speech recognition
      this.startVoiceActivityDetection();
    } catch (error) {
      console.warn('Audio processing initialization failed:', error);
    }
  }

  private startVoiceActivityDetection(): void {
    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const detectVoiceActivity = () => {
      if (!this.analyser || this.isAISpeaking) return;
      
      this.analyser.getByteFrequencyData(dataArray);
      
      // Enhanced voice activity detection algorithm
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const speechFrequencies = dataArray.slice(10, 80); // Focus on speech frequencies
      const speechEnergy = speechFrequencies.reduce((sum, value) => sum + value, 0) / speechFrequencies.length;
      
      const isSpeechDetected = speechEnergy > 30 && average > 20;
      
      if (isSpeechDetected && !this.streamingRecognitionActive) {
        this.streamingRecognitionActive = true;
        console.log('🎤 Voice activity detected - starting recognition');
      }
      
      if (this.streamingRecognitionActive && !this.isAISpeaking) {
        requestAnimationFrame(detectVoiceActivity);
      }
    };
    
    detectVoiceActivity();
  }

  private async startEnhancedGoogleSpeechRecognition(): Promise<void> {
    this.mediaRecorder = new MediaRecorder(this.audioStream!, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.audioChunks = [];
    let processingQueue: Blob[] = [];
    let isProcessing = false;

    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && !this.isAISpeaking) {
        processingQueue.push(event.data);
        
        // Process audio chunks in parallel for better responsiveness
        if (!isProcessing) {
          isProcessing = true;
          await this.processAudioQueue(processingQueue);
          processingQueue = [];
          isProcessing = false;
        }
      }
    };

    this.mediaRecorder.onstop = async () => {
      if (!this.isAISpeaking && processingQueue.length > 0) {
        await this.processAudioQueue(processingQueue);
      }
    };

    // Reduced chunk interval for better real-time performance
    this.mediaRecorder.start(500);
    this.isRecording = true;
    console.log('🎤 Enhanced Google Speech Recognition started');
  }

  private startEnhancedWebSpeechRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      this.onError?.('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.config.language || 'en-US';
    this.recognition.maxAlternatives = this.config.maxAlternatives || 3;
    
    // Enhanced Web Speech settings - only set grammars if supported
    const grammar = this.createSpeechGrammar();
    if (grammar && this.recognition.grammars !== undefined) {
      this.recognition.grammars = grammar;
    }

    this.recognition.onstart = () => {
      console.log('🎤 Enhanced Web Speech Recognition started');
      this.isRecording = true;
    };

    this.recognition.onresult = (event) => {
      if (this.isAISpeaking || this.isMutedDuringAIResponse) {
        console.log('🔇 Ignoring speech result - AI is speaking');
        return;
      }

      const results = Array.from(event.results);
      const latestResult = results[results.length - 1];
      
      if (latestResult && latestResult[0].confidence > this.confidenceThreshold) {
        const alternatives = Array.from(latestResult).map(alt => ({
          transcript: alt.transcript,
          confidence: alt.confidence || 0.8
        }));

        this.onTranscript?.({
          transcript: latestResult[0].transcript,
          confidence: latestResult[0].confidence || 0.8,
          isFinal: latestResult.isFinal,
          alternatives: alternatives.slice(0, this.config.maxAlternatives || 3),
          languageCode: this.config.language,
          stability: latestResult.isFinal ? 1.0 : 0.5
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Enhanced Speech recognition error:', event.error);
      if (!['no-speech', 'aborted', 'audio-capture'].includes(event.error)) {
        this.onError?.(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      console.log('🎤 Enhanced Web Speech Recognition ended');
      this.isRecording = false;
      
      // Only restart if AI is not speaking and we're not intentionally muted
      if (!this.isMutedDuringAIResponse && !this.isAISpeaking) {
        setTimeout(() => {
          try {
            if (this.recognition && !this.isAISpeaking && !this.isMutedDuringAIResponse) {
              this.recognition.start();
            }
          } catch (error) {
            console.error('Failed to restart recognition:', error);
          }
        }, 300);
      }
    };

    try {
      this.recognition.start();
      this.isRecording = true;
    } catch (error) {
      this.onError?.('Failed to start enhanced speech recognition');
    }
  }

  private createSpeechGrammar(): SpeechGrammarList | null {
    try {
      const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
      if (!SpeechGrammarList) return null;

      const grammar = new SpeechGrammarList();
      // Enhanced grammar for better recognition of common phrases
      const grammarString = `
        #JSGF V1.0; grammar commands;
        public <command> = (what | how | when | where | why | who | tell | show | explain | describe | help | please | thank | yes | no | stop | start | pause | resume | again | more | less | next | previous | back | forward | up | down | left | right | okay | alright | sure | certainly | absolutely | definitely | probably | maybe | perhaps | exactly | precisely | specifically | generally | basically | actually | really | truly | honestly | obviously | clearly | apparently | seemingly | presumably | allegedly | reportedly | supposedly | theoretically | practically | essentially | fundamentally | ultimately | eventually | finally | initially | originally | previously | recently | currently | now | today | tomorrow | yesterday | morning | afternoon | evening | night | time | date | year | month | week | day | hour | minute | second);
      `;
      grammar.addFromString(grammarString, 1);
      return grammar;
    } catch (error) {
      console.warn('Failed to create speech grammar:', error);
      return null;
    }
  }

  private async processAudioQueue(audioChunks: Blob[]): Promise<void> {
    if (audioChunks.length === 0 || !this.config.apiKey || this.isAISpeaking) return;

    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    
    try {
      const base64Audio = await this.blobToBase64(audioBlob);
      const result = await this.callEnhancedGoogleSpeechToText(base64Audio);
      
      if (result && !this.isAISpeaking) {
        this.onTranscript?.(result);
      }
    } catch (error) {
      console.error('Failed to process audio queue:', error);
      if (!this.isAISpeaking) {
        this.onError?.('Failed to process speech');
      }
    }
  }

  private async callEnhancedGoogleSpeechToText(base64Audio: string): Promise<SpeechRecognitionResult | null> {
    if (!this.config.apiKey || this.isAISpeaking) return null;

    try {
      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: this.config.sampleRate || 48000,
            languageCode: this.config.language || 'en-US',
            alternativeLanguageCodes: this.config.alternativeLanguages || ['en-GB', 'en-AU', 'en-IN'],
            enableAutomaticPunctuation: true,
            enableWordTimeOffsets: this.config.enableWordTimeOffsets || true,
            enableWordConfidence: this.config.enableWordConfidence || true,
            model: this.config.model || 'latest_long',
            useEnhanced: this.config.useEnhanced || true,
            maxAlternatives: this.config.maxAlternatives || 3,
            profanityFilter: this.config.profanityFilter || false,
            enableSpeakerDiarization: false,
            diarizationSpeakerCount: 1,
            enableSpokenPunctuation: true,
            enableSpokenEmojis: true,
            adaptation: {
              phraseSets: [{
                phrases: [
                  { value: "artificial intelligence", boost: 10 },
                  { value: "machine learning", boost: 10 },
                  { value: "neural network", boost: 10 },
                  { value: "deep learning", boost: 10 },
                  { value: "natural language processing", boost: 10 }
                ]
              }]
            }
          },
          audio: {
            content: base64Audio.split(',')[1]
          }
        })
      });

      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        const primaryResult = result.results[0];
        const alternatives = primaryResult.alternatives || [];
        const primaryAlternative = alternatives[0];
        
        return {
          transcript: primaryAlternative.transcript,
          confidence: primaryAlternative.confidence || 0.9,
          isFinal: true,
          alternatives: alternatives.slice(0, this.config.maxAlternatives || 3).map((alt: any) => ({
            transcript: alt.transcript,
            confidence: alt.confidence || 0.8,
            words: alt.words ? alt.words.map((word: any) => ({
              word: word.word,
              startTime: parseFloat(word.startTime?.seconds || 0) + (word.startTime?.nanos || 0) / 1000000000,
              endTime: parseFloat(word.endTime?.seconds || 0) + (word.endTime?.nanos || 0) / 1000000000,
              confidence: word.confidence || 0.8
            })) : undefined
          })),
          languageCode: result.results[0].languageCode || this.config.language,
          stability: 1.0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Enhanced Google Speech-to-Text API error:', error);
      return null;
    }
  }

  stopRecording(): void {
    console.log('🔇 Stopping enhanced microphone recording');
    this.isRecording = false;
    this.streamingRecognitionActive = false;
    
    if (this.speechDetectionTimeout) {
      clearTimeout(this.speechDetectionTimeout);
      this.speechDetectionTimeout = null;
    }
    
    if (this.speechEndTimeout) {
      clearTimeout(this.speechEndTimeout);
      this.speechEndTimeout = null;
    }
    
    if (this.recognition) {
      try {
        this.recognition.stop();
        this.recognition = null;
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  muteForAIResponse(): void {
    console.log('🔇 Muting microphone for AI response');
    this.isMutedDuringAIResponse = true;
    this.isAISpeaking = true;
    this.stopRecording();
  }

  resumeAfterAIResponse(): void {
    console.log('🎤 Resuming microphone after AI response');
    this.isMutedDuringAIResponse = false;
    this.isAISpeaking = false;
    
    // Clear any existing timeout
    if (this.speechEndTimeout) {
      clearTimeout(this.speechEndTimeout);
    }
    
    // Wait for enhanced delay before resuming microphone
    this.speechEndTimeout = setTimeout(() => {
      if (!this.isRecording && !this.isAISpeaking && !this.isMutedDuringAIResponse) {
        console.log('🎤 Actually starting enhanced microphone recording after delay');
        this.startRecording();
      }
    }, this.speechEndDelayMs);
  }

  setAISpeakingState(isSpeaking: boolean): void {
    this.isAISpeaking = isSpeaking;
    if (isSpeaking) {
      console.log('🤖 AI started speaking - muting microphone');
      this.stopRecording();
    } else {
      console.log('🤖 AI finished speaking - scheduling microphone resume');
      
      // Clear any existing timeout
      if (this.speechEndTimeout) {
        clearTimeout(this.speechEndTimeout);
      }
      
      // Enhanced delay before resuming microphone to prevent interruption
      this.speechEndTimeout = setTimeout(() => {
        if (!this.isMutedDuringAIResponse) {
          console.log('🎤 Resuming microphone after AI speech completion');
          this.startRecording();
        }
      }, this.speechEndDelayMs);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording && !this.isMutedDuringAIResponse && !this.isAISpeaking;
  }

  // Enhanced utility methods
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold));
  }

  toggleAdaptiveLanguageDetection(enabled: boolean): void {
    this.adaptiveLanguageDetection = enabled;
  }

  setSpeechEndDelay(delayMs: number): void {
    this.speechEndDelayMs = Math.max(1000, Math.min(5000, delayMs));
  }
}

// Enhanced Text-to-Speech with advanced Google TTS features
export class EnhancedTextToSpeech {
  private currentAudio: HTMLAudioElement | null = null;
  private onSpeechStart?: () => void;
  private onSpeechEnd?: () => void;
  private audioQueue: HTMLAudioElement[] = [];
  private isProcessingQueue = false;
  private isSpeaking = false;
  private speechEndTimeout: NodeJS.Timeout | null = null;

  constructor(
    private config: GoogleSpeechConfig = {},
    callbacks: {
      onSpeechStart?: () => void;
      onSpeechEnd?: () => void;
    } = {}
  ) {
    this.onSpeechStart = callbacks.onSpeechStart;
    this.onSpeechEnd = callbacks.onSpeechEnd;
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    this.stop();

    console.log('🗣️ AI starting enhanced speech:', text.substring(0, 50) + '...');
    this.isSpeaking = true;

    if (this.config.apiKey) {
      await this.speakWithEnhancedGoogleTTS(text, options);
    } else {
      this.speakWithEnhancedWebAPI(text, options);
    }
  }

  private async speakWithEnhancedGoogleTTS(text: string, options: TTSOptions): Promise<void> {
    if (!this.config.apiKey) return;

    try {
      // Split long text into chunks for better synthesis
      const textChunks = this.splitTextIntoChunks(text);
      
      for (const chunk of textChunks) {
        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.config.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: options.ssmlText ? { ssml: options.ssmlText } : { text: chunk },
            voice: {
              languageCode: this.config.language || 'en-US',
              name: options.voice || 'en-US-Neural2-F',
              ssmlGender: options.voiceGender || 'FEMALE'
            },
            audioConfig: {
              audioEncoding: options.audioEncoding || 'MP3',
              pitch: options.pitch || 0,
              speakingRate: options.rate || 0.95,
              volumeGainDb: options.volume ? (options.volume - 0.5) * 20 : 0,
              effectsProfileId: options.effectsProfile || ['headphone-class-device', 'large-home-entertainment-class-device'],
              sampleRateHertz: 44100
            }
          })
        });

        const result = await response.json();
        
        if (result.audioContent) {
          const audioBlob = this.base64ToBlob(result.audioContent, 'audio/mp3');
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audio = new Audio(audioUrl);
          audio.volume = options.volume || 0.8;
          audio.preload = 'auto';
          
          this.audioQueue.push(audio);
        }
      }
      
      await this.processAudioQueue();
      
    } catch (error) {
      console.error('Enhanced Google TTS error:', error);
      this.speakWithEnhancedWebAPI(text, options);
    }
  }

  private splitTextIntoChunks(text: string, maxLength: number = 5000): string[] {
    if (text.length <= maxLength) return [text];
    
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
      }
      currentChunk += sentence + '. ';
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  private async processAudioQueue(): Promise<void> {
    if (this.isProcessingQueue || this.audioQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    for (const audio of this.audioQueue) {
      await new Promise<void>((resolve) => {
        this.currentAudio = audio;
        
        audio.onplay = () => {
          if (this.audioQueue.indexOf(audio) === 0) {
            this.onSpeechStart?.();
          }
        };
        
        audio.onended = () => {
          if (this.audioQueue.indexOf(audio) === this.audioQueue.length - 1) {
            // Enhanced delay before calling onSpeechEnd
            this.speechEndTimeout = setTimeout(() => {
              this.isSpeaking = false;
              this.onSpeechEnd?.();
            }, 500); // Half second delay
          }
          URL.revokeObjectURL(audio.src);
          resolve();
        };
        
        audio.onerror = () => {
          console.error('Audio playback error');
          resolve();
        };
        
        audio.play().catch(error => {
          console.error('Audio play error:', error);
          resolve();
        });
      });
    }
    
    this.audioQueue = [];
    this.isProcessingQueue = false;
  }

  private speakWithEnhancedWebAPI(text: string, options: TTSOptions): void {
    if (typeof window === 'undefined') return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Enhanced voice selection with neural and premium voices
    const voices = speechSynthesis.getVoices();
    
    const premiumVoices = [
      'Google US English Neural Female',
      'Google US English Neural Male',
      'Microsoft Aria Online (Natural)',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Guy Online (Natural)',
      'Samantha (Enhanced)',
      'Alex (Enhanced)',
      'Victoria (Premium)',
      'Karen (Neural)',
      'Susan (Enhanced)'
    ];
    
    let selectedVoice = null;
    for (const voiceName of premiumVoices) {
      selectedVoice = voices.find(voice => 
        voice.name.includes(voiceName.split(' ')[0]) && 
        voice.lang.includes('en') &&
        (voice.name.includes('Neural') || voice.name.includes('Enhanced') || voice.name.includes('Premium'))
      );
      if (selectedVoice) break;
    }
    
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.includes('en-US') && 
        voice.name.toLowerCase().includes('female') &&
        voice.name.toLowerCase().includes('google')
      ) || voices.find(voice => voice.lang.includes('en-US'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🗣️ Selected voice:', selectedVoice.name);
    }
    
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;
    
    utterance.onstart = () => {
      this.onSpeechStart?.();
    };
    
    utterance.onend = () => {
      // Enhanced delay before calling onSpeechEnd
      this.speechEndTimeout = setTimeout(() => {
        this.isSpeaking = false;
        this.onSpeechEnd?.();
      }, 500); // Half second delay
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.isSpeaking = false;
      this.onSpeechEnd?.();
    };
    
    speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (this.speechEndTimeout) {
      clearTimeout(this.speechEndTimeout);
      this.speechEndTimeout = null;
    }
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    // Clear audio queue
    this.audioQueue.forEach(audio => {
      audio.pause();
      URL.revokeObjectURL(audio.src);
    });
    this.audioQueue = [];
    this.isProcessingQueue = false;
    
    if (typeof window !== 'undefined') {
      speechSynthesis.cancel();
    }
    
    this.isSpeaking = false;
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type });
  }

  // Enhanced utility methods
  async getAvailableVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        speechSynthesis.onvoiceschanged = () => {
          resolve(speechSynthesis.getVoices());
        };
      }
    });
  }

  setVoicePreference(voiceName: string): void {
    // Store voice preference for future use
    localStorage.setItem('preferredVoice', voiceName);
  }

  isSpeechActive(): boolean {
    return this.isSpeaking;
  }
}
