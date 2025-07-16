
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Activity, Brain } from 'lucide-react';
import { useFaceApiEmotionDetection } from '@/hooks/useFaceApiEmotionDetection';
import EmotionalStatePanel from './EmotionalStatePanel';

interface CameraEmotionDetectorProps {
  onEmotionUpdate?: (emotion: any) => void;
}

const CameraEmotionDetector: React.FC<CameraEmotionDetectorProps> = ({ onEmotionUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Use face-api.js emotion detection
  const emotionResult = useFaceApiEmotionDetection(videoRef, cameraEnabled && isVideoReady);

  // Call onEmotionUpdate when emotion changes
  useEffect(() => {
    if (onEmotionUpdate && emotionResult.dominant) {
      onEmotionUpdate(emotionResult);
    }
  }, [emotionResult, onEmotionUpdate]);

  // Initialize camera
  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { max: 30 },
          facingMode: 'user'
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraEnabled(true);
        
        videoRef.current.onloadeddata = () => {
          setIsVideoReady(true);
          console.log('📹 Video ready for face-api.js emotion detection');
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
    setIsVideoReady(false);
  };

  // Toggle camera
  const toggleCamera = () => {
    if (cameraEnabled) {
      stopCamera();
    } else {
      initializeCamera();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Camera Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Live Camera Feed
            </div>
            <Button
              variant={cameraEnabled ? "destructive" : "default"}
              size="sm"
              onClick={toggleCamera}
            >
              {cameraEnabled ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-80 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
            {!cameraEnabled && (
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Camera Disabled</p>
                <p className="text-sm opacity-75">Click "Start Camera" to begin emotion detection</p>
              </div>
            )}
            
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Status Indicators */}
            {cameraEnabled && (
              <div className="absolute top-4 left-4 space-y-2">
                <div className="bg-black/60 rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${emotionResult.isInitialized ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span>
                    {emotionResult.isInitialized ? 'face-api.js Ready' : 'Loading Models...'}
                  </span>
                </div>
                
                {emotionResult.additionalData?.faceDetected && (
                  <div className="bg-black/60 rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2">
                    <Activity className="h-3 w-3 text-green-400" />
                    <span>Face Detected</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Live Emotion Display */}
            {cameraEnabled && emotionResult.isInitialized && (
              <div className="absolute bottom-4 right-4 bg-black/60 rounded-lg px-4 py-3 text-white">
                <div className="text-center">
                  <div className="text-2xl mb-1">{emotionResult.icon}</div>
                  <div className="text-sm font-medium capitalize">{emotionResult.dominant}</div>
                  <div className="text-xs opacity-75">{Math.round(emotionResult.confidence * 100)}%</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emotion Analysis Panel */}
      <EmotionalStatePanel 
        emotionState={emotionResult}
        additionalData={emotionResult.additionalData}
      />
    </div>
  );
};

export default CameraEmotionDetector;
