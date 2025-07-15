
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Zap } from 'lucide-react';
import { EmotionScores } from '@/utils/mediapipe/emotionDetection';

interface EmotionDisplayProps {
  emotion: string;
  confidence: number;
  icon: string;
  scores?: EmotionScores;
  showDetails?: boolean;
}

const EmotionDisplay: React.FC<EmotionDisplayProps> = ({
  emotion,
  confidence,
  icon,
  scores,
  showDetails = false
}) => {
  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy': return 'text-green-600 bg-green-50 border-green-200';
      case 'sad': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'angry': return 'text-red-600 bg-red-50 border-red-200';
      case 'surprised': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'fearful': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'disgust': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const confidencePercentage = Math.round(confidence * 100);

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-lg capitalize text-slate-800">
                {emotion}
              </span>
              <Badge 
                className={`${getEmotionColor(emotion)} border`}
                variant="outline"
              >
                {confidencePercentage}%
              </Badge>
            </div>
            <Progress 
              value={confidencePercentage} 
              className="h-2 bg-slate-200"
            />
          </div>
        </div>

        {showDetails && scores && (
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Brain className="h-4 w-4" />
              Detailed Analysis
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="capitalize text-slate-600">Happy:</span>
                <span className="font-medium text-slate-800">
                  {Math.round(scores.happy * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="capitalize text-slate-600">Sad:</span>
                <span className="font-medium text-slate-800">
                  {Math.round(scores.sad * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="capitalize text-slate-600">Angry:</span>
                <span className="font-medium text-slate-800">
                  {Math.round(scores.angry * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="capitalize text-slate-600">Surprised:</span>
                <span className="font-medium text-slate-800">
                  {Math.round(scores.surprised * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="capitalize text-slate-600">Fearful:</span>
                <span className="font-medium text-slate-800">
                  {Math.round(scores.fearful * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="capitalize text-slate-600">Disgust:</span>
                <span className="font-medium text-slate-800">
                  {Math.round(scores.disgust * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="capitalize text-slate-600">Neutral:</span>
                <span className="font-medium text-slate-800">
                  {Math.round(scores.neutral * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Zap className="h-3 w-3" />
            <span>
              {confidence > 0.8 ? 'High confidence' : 
               confidence > 0.6 ? 'Medium confidence' : 
               'Processing...'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionDisplay;
