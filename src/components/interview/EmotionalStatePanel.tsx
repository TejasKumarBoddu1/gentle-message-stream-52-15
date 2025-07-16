
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Activity, User, Calendar } from 'lucide-react';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';

interface EmotionalStatePanelProps {
  emotionState: EmotionState;
  additionalData?: {
    age?: number;
    gender?: string;
    faceDetected: boolean;
  };
}

const EmotionalStatePanel: React.FC<EmotionalStatePanelProps> = ({ 
  emotionState, 
  additionalData 
}) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'High Confidence';
    if (confidence >= 0.4) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  const getEmotionalTone = (dominant: string) => {
    const toneMap: Record<string, string> = {
      'happy': 'Positive',
      'sad': 'Melancholic',
      'angry': 'Intense',
      'surprised': 'Energetic',
      'fearful': 'Anxious',
      'disgusted': 'Disapproving',
      'neutral': 'Balanced'
    };
    return toneMap[dominant] || 'Balanced';
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Emotional State Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current Emotion Display */}
        <div className="text-center space-y-3">
          <div className="text-4xl">{emotionState.icon}</div>
          <div>
            <h3 className="text-xl font-semibold capitalize text-slate-800">
              {emotionState.dominant}
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`text-sm font-medium ${getConfidenceColor(emotionState.confidence)}`}>
                {Math.round(emotionState.confidence * 100)}% confidence
              </span>
              <Badge variant="outline" className="text-xs">
                {getConfidenceLabel(emotionState.confidence)}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {getEmotionalTone(emotionState.dominant)}
            </p>
          </div>
        </div>

        {/* Detection Status */}
        <div className="flex items-center justify-center gap-2">
          <Activity className={`h-4 w-4 ${additionalData?.faceDetected ? 'text-green-500' : 'text-red-500'}`} />
          <span className="text-sm text-slate-600">
            {additionalData?.faceDetected ? 'Face Detected' : 'No Face Detected'}
          </span>
        </div>

        {/* Additional Data */}
        {additionalData?.faceDetected && (additionalData.age || additionalData.gender) && (
          <div className="flex justify-center gap-4 text-sm text-slate-600">
            {additionalData.age && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Age: {additionalData.age}</span>
              </div>
            )}
            {additionalData.gender && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>Gender: {additionalData.gender}</span>
              </div>
            )}
          </div>
        )}

        {/* Emotion Breakdown */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Emotion Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(emotionState.scores).map(([emotion, score]) => (
              <div key={emotion} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="capitalize text-slate-600">{emotion}</span>
                  <span className="font-medium text-slate-800">
                    {Math.round(score * 100)}%
                  </span>
                </div>
                <Progress 
                  value={score * 100} 
                  className="h-2"
                  style={{
                    backgroundColor: '#e2e8f0'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Powered by face-api.js */}
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            Powered by face-api.js
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionalStatePanel;
