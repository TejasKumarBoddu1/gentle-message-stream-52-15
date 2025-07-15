
import { EmotionState } from './emotionDetection';
import { FaceExpressions } from '../faceExpression/FaceExpressions';

export interface EmotionAnalysisResult {
  primary: EmotionState;
  secondary?: EmotionState;
  confidence: number;
  reliability: 'high' | 'medium' | 'low';
  sources: {
    mediapipe: boolean;
    tensorflow: boolean;
  };
}

export class EmotionAnalysisEngine {
  private static readonly CONFIDENCE_THRESHOLD_HIGH = 0.8;
  private static readonly CONFIDENCE_THRESHOLD_MEDIUM = 0.6;
  private static readonly AGREEMENT_BONUS = 0.15;

  static analyzeEmotions(
    mediapipeEmotion: EmotionState,
    tensorflowEmotion?: FaceExpressions
  ): EmotionAnalysisResult {
    const result: EmotionAnalysisResult = {
      primary: mediapipeEmotion,
      confidence: mediapipeEmotion.confidence,
      reliability: 'low',
      sources: {
        mediapipe: true,
        tensorflow: !!tensorflowEmotion
      }
    };

    if (!tensorflowEmotion) {
      // Only MediaPipe available
      result.reliability = this.getReliabilityLevel(mediapipeEmotion.confidence);
      return result;
    }

    // Both systems available - perform fusion
    const tfDominant = tensorflowEmotion.getDominantExpression();
    const emotionMapping = this.createEmotionMapping();
    const tfMappedEmotion = emotionMapping[tfDominant.expression] || 'neutral';

    // Check if both systems agree
    const systemsAgree = mediapipeEmotion.dominant === tfMappedEmotion;
    
    if (systemsAgree) {
      // Systems agree - boost confidence
      result.confidence = Math.min(
        (mediapipeEmotion.confidence + tfDominant.confidence) / 2 + this.AGREEMENT_BONUS,
        1.0
      );
      result.reliability = this.getReliabilityLevel(result.confidence);
    } else {
      // Systems disagree - determine which to trust more
      const confidenceDiff = Math.abs(mediapipeEmotion.confidence - tfDominant.confidence);
      
      if (confidenceDiff > 0.3) {
        // Significant difference - use the more confident one
        if (tfDominant.confidence > mediapipeEmotion.confidence) {
          result.primary = this.createEmotionStateFromTensorFlow(tensorflowEmotion);
          result.secondary = mediapipeEmotion;
        }
        result.confidence = Math.max(mediapipeEmotion.confidence, tfDominant.confidence);
      } else {
        // Similar confidence - use weighted average
        result.confidence = (mediapipeEmotion.confidence * 0.6 + tfDominant.confidence * 0.4);
        
        // Create blended emotion state
        result.primary = this.blendEmotionStates(mediapipeEmotion, tensorflowEmotion);
      }
      
      result.reliability = this.getReliabilityLevel(result.confidence * 0.8); // Penalty for disagreement
    }

    return result;
  }

  private static createEmotionMapping(): Record<string, string> {
    return {
      'happy': 'happy',
      'sad': 'sad',
      'angry': 'angry',
      'fearful': 'fearful',
      'disgusted': 'disgust',
      'surprised': 'surprised',
      'neutral': 'neutral'
    };
  }

  private static createEmotionStateFromTensorFlow(tfEmotion: FaceExpressions): EmotionState {
    const dominant = tfEmotion.getDominantExpression();
    const mapping = this.createEmotionMapping();
    const mappedEmotion = mapping[dominant.expression] || 'neutral';

    return {
      dominant: mappedEmotion,
      confidence: dominant.confidence,
      scores: {
        neutral: tfEmotion.neutral,
        happy: tfEmotion.happy,
        sad: tfEmotion.sad,
        angry: tfEmotion.angry,
        surprised: tfEmotion.surprised,
        fearful: tfEmotion.fearful,
        disgust: tfEmotion.disgusted
      },
      icon: this.getEmotionIcon(mappedEmotion),
      timestamp: Date.now()
    };
  }

  private static blendEmotionStates(
    mediapipeEmotion: EmotionState,
    tensorflowEmotion: FaceExpressions
  ): EmotionState {
    const mpWeight = 0.6;
    const tfWeight = 0.4;

    // Blend scores
    const blendedScores = {
      neutral: (mediapipeEmotion.scores.neutral || 0) * mpWeight + tensorflowEmotion.neutral * tfWeight,
      happy: (mediapipeEmotion.scores.happy || 0) * mpWeight + tensorflowEmotion.happy * tfWeight,
      sad: (mediapipeEmotion.scores.sad || 0) * mpWeight + tensorflowEmotion.sad * tfWeight,
      angry: (mediapipeEmotion.scores.angry || 0) * mpWeight + tensorflowEmotion.angry * tfWeight,
      surprised: (mediapipeEmotion.scores.surprised || 0) * mpWeight + tensorflowEmotion.surprised * tfWeight,
      fearful: (mediapipeEmotion.scores.fearful || 0) * mpWeight + tensorflowEmotion.fearful * tfWeight,
      disgust: (mediapipeEmotion.scores.disgust || 0) * mpWeight + tensorflowEmotion.disgusted * tfWeight
    };

    // Find dominant emotion from blended scores
    const dominantEmotion = Object.entries(blendedScores)
      .reduce((max, [emotion, score]) => score > max.score ? { emotion, score } : max, 
              { emotion: 'neutral', score: 0 });

    return {
      dominant: dominantEmotion.emotion,
      confidence: dominantEmotion.score,
      scores: blendedScores,
      icon: this.getEmotionIcon(dominantEmotion.emotion),
      timestamp: Date.now()
    };
  }

  private static getReliabilityLevel(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= this.CONFIDENCE_THRESHOLD_HIGH) return 'high';
    if (confidence >= this.CONFIDENCE_THRESHOLD_MEDIUM) return 'medium';
    return 'low';
  }

  private static getEmotionIcon(emotion: string): string {
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
}
