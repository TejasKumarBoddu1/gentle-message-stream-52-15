
import * as faceapi from 'face-api.js';

export interface FaceApiEmotionResult {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface FaceApiDetectionResult {
  emotions: FaceApiEmotionResult;
  dominant: string;
  confidence: number;
  age?: number;
  gender?: string;
  faceDetected: boolean;
}

export class FaceApiEmotionDetector {
  private isInitialized = false;
  private modelsLoaded = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🎭 Initializing face-api.js...');

      // Load models from CDN
      const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);

      this.modelsLoaded = true;
      this.isInitialized = true;
      console.log('✅ face-api.js models loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load face-api.js models:', error);
      throw error;
    }
  }

  async detectEmotions(
    video: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
  ): Promise<FaceApiDetectionResult | null> {
    if (!this.isInitialized || !this.modelsLoaded) {
      console.warn('⚠️ face-api.js not initialized');
      return null;
    }

    try {
      // Use tiny face detector for better performance
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      if (detections.length === 0) {
        console.log('👤 No face detected by face-api.js');
        return {
          emotions: {
            neutral: 1,
            happy: 0,
            sad: 0,
            angry: 0,
            fearful: 0,
            disgusted: 0,
            surprised: 0
          },
          dominant: 'neutral',
          confidence: 0,
          faceDetected: false
        };
      }

      const detection = detections[0];
      const expressions = detection.expressions;

      // Convert face-api expressions to our format
      const emotions: FaceApiEmotionResult = {
        neutral: expressions.neutral || 0,
        happy: expressions.happy || 0,
        sad: expressions.sad || 0,
        angry: expressions.angry || 0,
        fearful: expressions.fearful || 0,
        disgusted: expressions.disgusted || 0,
        surprised: expressions.surprised || 0
      };

      // Find dominant emotion
      const emotionEntries = Object.entries(emotions);
      const [dominantEmotion, confidence] = emotionEntries.reduce((max, current) => 
        current[1] > max[1] ? current : max
      );

      console.log('🎭 face-api.js emotion detected:', dominantEmotion, 'confidence:', (confidence * 100).toFixed(1) + '%');

      return {
        emotions,
        dominant: dominantEmotion,
        confidence: confidence,
        age: Math.round(detection.age || 0),
        gender: detection.gender || 'unknown',
        faceDetected: true
      };

    } catch (error) {
      console.error('❌ Error in face-api.js emotion detection:', error);
      return null;
    }
  }

  dispose(): void {
    this.isInitialized = false;
    this.modelsLoaded = false;
  }
}
