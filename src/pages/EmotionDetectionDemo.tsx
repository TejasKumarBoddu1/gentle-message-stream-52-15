
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CameraEmotionDetector from '@/components/interview/CameraEmotionDetector';
import { Brain } from 'lucide-react';

const EmotionDetectionDemo = () => {
  const handleEmotionUpdate = (emotion: any) => {
    console.log('Real-time emotion detected:', emotion);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              Real-Time Emotion Detection
            </CardTitle>
            <CardDescription>
              This uses your camera and MediaPipe Face Landmarker to detect your actual facial expressions in real-time.
              No hardcoded data - everything you see is based on your live camera feed and facial analysis.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <CameraEmotionDetector onEmotionUpdate={handleEmotionUpdate} />
    </div>
  );
};

export default EmotionDetectionDemo;
