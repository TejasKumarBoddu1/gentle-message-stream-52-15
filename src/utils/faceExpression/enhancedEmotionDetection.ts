
import { FaceDetector, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { FaceExpressions } from './FaceExpressions';
import { TensorFlowEmotionDetector } from './tensorflowEmotionDetector';
import { EmotionState } from '../mediapipe/emotionDetection';

export interface EnhancedEmotionResult {
  mediapipeEmotion: EmotionState;
  tensorflowEmotion: FaceExpressions | null;
  combinedEmotion: EmotionState;
}

export class EnhancedEmotionDetector {
  private faceDetector: FaceDetector | null = null;
  private tensorflowDetector: TensorFlowEmotionDetector;
  private isInitialized = false;

  constructor() {
    this.tensorflowDetector = new TensorFlowEmotionDetector();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing enhanced emotion detector...');
      
      // Initialize MediaPipe Face Detector
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
      );

      this.faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
        minSuppressionThreshold: 0.3
      });

      // Initialize TensorFlow emotion detector
      await this.tensorflowDetector.loadModel();

      this.isInitialized = true;
      console.log('Enhanced emotion detector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize enhanced emotion detector:', error);
      throw error;
    }
  }

  async detectEmotions(
    video: HTMLVideoElement,
    timestamp: number,
    currentMediapipeEmotion: EmotionState
  ): Promise<EnhancedEmotionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let tensorflowEmotion: FaceExpressions | null = null;
    let combinedEmotion = currentMediapipeEmotion;

    try {
      // Detect faces using MediaPipe
      if (this.faceDetector) {
        const detections = this.faceDetector.detectForVideo(video, timestamp);
        
        if (detections.detections && detections.detections.length > 0) {
          // Extract face region for TensorFlow analysis
          const face = detections.detections[0];
          const faceImageData = this.extractFaceRegion(video, face);
          
          if (faceImageData) {
            // Get TensorFlow emotion prediction
            tensorflowEmotion = await this.tensorflowDetector.predictExpressions(faceImageData);
            
            // Combine both predictions
            combinedEmotion = this.combineEmotionPredictions(
              currentMediapipeEmotion,
              tensorflowEmotion
            );
          }
        }
      }
    } catch (error) {
      console.error('Error in enhanced emotion detection:', error);
    }

    return {
      mediapipeEmotion: currentMediapipeEmotion,
      tensorflowEmotion,
      combinedEmotion
    };
  }

  private extractFaceRegion(video: HTMLVideoElement, detection: any): ImageData | null {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Get bounding box
      const bbox = detection.boundingBox;
      const x = bbox.originX * video.videoWidth;
      const y = bbox.originY * video.videoHeight;
      const width = bbox.width * video.videoWidth;
      const height = bbox.height * video.videoHeight;

      // Set canvas size to face region
      canvas.width = width;
      canvas.height = height;

      // Draw the face region
      ctx.drawImage(
        video,
        x, y, width, height,
        0, 0, width, height
      );

      return ctx.getImageData(0, 0, width, height);
    } catch (error) {
      console.error('Error extracting face region:', error);
      return null;
    }
  }

  private combineEmotionPredictions(
    mediapipeEmotion: EmotionState,
    tensorflowEmotion: FaceExpressions
  ): EmotionState {
    // Get dominant emotion from TensorFlow
    const tfDominant = tensorflowEmotion.getDominantExpression();
    
    // Map TensorFlow emotions to MediaPipe format
    const emotionMapping: Record<string, string> = {
      'happy': 'happy',
      'sad': 'sad',
      'angry': 'angry',
      'fearful': 'fearful',
      'disgusted': 'disgust',
      'surprised': 'surprised',
      'neutral': 'neutral'
    };

    const mappedEmotion = emotionMapping[tfDominant.expression] || 'neutral';
    
    // Combine confidence scores (weighted average)
    const mediapipeWeight = 0.6;
    const tensorflowWeight = 0.4;
    
    const combinedConfidence = (
      mediapipeEmotion.confidence * mediapipeWeight +
      tfDominant.confidence * tensorflowWeight
    );

    // Use TensorFlow emotion if it has higher confidence and significant difference
    const shouldUseTensorFlow = (
      tfDominant.confidence > mediapipeEmotion.confidence + 0.2 &&
      tfDominant.confidence > 0.6
    );

    const finalEmotion = shouldUseTensorFlow ? mappedEmotion : mediapipeEmotion.dominant;
    const finalConfidence = shouldUseTensorFlow ? tfDominant.confidence : combinedConfidence;

    // Create combined emotion scores
    const combinedScores = { ...mediapipeEmotion.scores };
    
    // Blend TensorFlow scores into MediaPipe scores
    if (tensorflowEmotion.happy > 0.1) {
      combinedScores.happy = (combinedScores.happy || 0) * mediapipeWeight + tensorflowEmotion.happy * tensorflowWeight;
    }
    if (tensorflowEmotion.sad > 0.1) {
      combinedScores.sad = (combinedScores.sad || 0) * mediapipeWeight + tensorflowEmotion.sad * tensorflowWeight;
    }
    if (tensorflowEmotion.angry > 0.1) {
      combinedScores.angry = (combinedScores.angry || 0) * mediapipeWeight + tensorflowEmotion.angry * tensorflowWeight;
    }

    return {
      dominant: finalEmotion,
      confidence: Math.min(finalConfidence, 1.0),
      scores: combinedScores,
      icon: this.getEmotionIcon(finalEmotion),
      timestamp: Date.now()
    };
  }

  private getEmotionIcon(emotion: string): string {
    const iconMap: Record<string, string> = {
      'happy': '😊',
      'sad': '😢',
      'angry': '😠',
      'surprised': '😲',
      'fearful': '😨',
      'disgust': '🤢',
      'neutral': '😐'
    };
    return iconMap[emotion] || '😐';
  }

  dispose(): void {
    if (this.faceDetector) {
      this.faceDetector.close();
      this.faceDetector = null;
    }
    this.tensorflowDetector.dispose();
    this.isInitialized = false;
  }
}
