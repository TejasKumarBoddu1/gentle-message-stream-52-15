
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Heart, Smile, Frown, Zap } from 'lucide-react';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';

interface EmotionalStatePanelProps {
  emotionState: EmotionState;
  showDetailedScores?: boolean;
}

const EmotionalStatePanel: React.FC<EmotionalStatePanelProps> = ({
  emotionState,
  showDetailedScores = true
}) => {
  const getEmotionColor = (emotion: string) => {
    switch (emotion) {
      case 'happy': return 'text-green-600';
      case 'sad': return 'text-blue-600';
      case 'angry': return 'text-red-600';
      case 'surprised': return 'text-yellow-600';
      case 'fearful': return 'text-purple-600';
      case 'disgust': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getEmotionBadgeVariant = (emotion: string) => {
    if (emotionState.confidence > 0.7) {
      switch (emotion) {
        case 'happy': return 'default';
        case 'neutral': return 'secondary';
        default: return 'outline';
      }
    }
    return 'outline';
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Emotional State Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Dominant Emotion */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emotionState.icon}</span>
            <div>
              <div className={`font-semibold text-lg capitalize ${getEmotionColor(emotionState.dominant)}`}>
                {emotionState.dominant}
              </div>
              <div className="text-sm text-slate-600">
                {Math.round(emotionState.confidence * 100)}% confidence
              </div>
            </div>
          </div>
          <Badge variant={getEmotionBadgeVariant(emotionState.dominant)}>
            {emotionState.dominant === 'happy' ? 'Positive' : 
             emotionState.dominant === 'neutral' ? 'Balanced' : 'Needs Attention'}
          </Badge>
        </div>

        {/* Detailed Emotion Scores */}
        {showDetailedScores && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-800 mb-2">Emotion Breakdown</h4>
            {Object.entries(emotionState.scores).map(([emotion, score]) => (
              <div key={emotion} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="capitalize font-medium flex items-center gap-2">
                    {emotion === 'happy' && <Smile className="h-3 w-3 text-green-500" />}
                    {emotion === 'sad' && <Frown className="h-3 w-3 text-blue-500" />}
                    {emotion === 'surprised' && <Zap className="h-3 w-3 text-yellow-500" />}
                    {emotion !== 'happy' && emotion !== 'sad' && emotion !== 'surprised' && 
                     <Heart className="h-3 w-3 text-gray-500" />}
                    {emotion}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {Math.round(score * 100)}%
                  </span>
                </div>
                <Progress 
                  value={score * 100} 
                  className="h-2 bg-slate-200"
                />
              </div>
            ))}
          </div>
        )}

        {/* Emotional Feedback */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border-l-4 border-purple-400">
          <div className="text-sm">
            <strong className="text-slate-800">Emotional Feedback:</strong>
            <p className="mt-1 text-slate-600">
              {emotionState.dominant === 'happy' && 
                "Great! You're showing positive emotions which reflects confidence and engagement."}
              {emotionState.dominant === 'neutral' && 
                "You appear calm and composed. This is good for maintaining professionalism."}
              {emotionState.dominant === 'sad' && 
                "You seem a bit down. Try to think of positive experiences or take a moment to relax."}
              {emotionState.dominant === 'angry' && 
                "You appear tense. Take a deep breath and try to stay calm during the interview."}
              {emotionState.dominant === 'surprised' && 
                "You seem surprised. Take your time to process questions before responding."}
              {emotionState.dominant === 'fearful' && 
                "It's normal to feel nervous. Remember that you're well-prepared for this interview."}
              {emotionState.dominant === 'disgust' && 
                "You appear concerned. Stay positive and focus on your strengths."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionalStatePanel;
