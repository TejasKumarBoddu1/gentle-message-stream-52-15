
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import { useFaceApiEmotionDetection } from '@/hooks/useFaceApiEmotionDetection';
import EmotionalStatePanel from './EmotionalStatePanel';
import BehaviorMetricsPanel from './BehaviorMetricsPanel';

const IntegratedAIInterviewWithTracking: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Use face-api.js emotion detection
  const emotionResult = useFaceApiEmotionDetection(videoRef, cameraEnabled && isVideoReady);

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
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraEnabled(true);
        setMicEnabled(true);
        
        videoRef.current.onloadeddata = () => {
          setIsVideoReady(true);
          console.log('📹 Video ready for face-api.js processing');
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
    setMicEnabled(false);
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

  // Toggle microphone
  const toggleMicrophone = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Main Interview Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Camera Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Interview Camera</span>
              <div className="flex gap-2">
                <Button
                  variant={cameraEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleCamera}
                >
                  {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                  {cameraEnabled ? 'Camera On' : 'Camera Off'}
                </Button>
                <Button
                  variant={micEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleMicrophone}
                  disabled={!cameraEnabled}
                >
                  {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {micEnabled ? 'Mic On' : 'Mic Off'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-80 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
              {!cameraEnabled && (
                <div className="text-center text-white">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Camera Disabled</p>
                  <p className="text-sm opacity-75">Click "Camera On" to enable emotion detection</p>
                </div>
              )}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
              />
              
              {/* Emotion Detection Status */}
              {cameraEnabled && (
                <div className="absolute top-4 left-4 bg-black/60 rounded-lg px-3 py-2 text-white text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${emotionResult.isInitialized ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <span>
                      {emotionResult.isInitialized ? 'face-api.js Ready' : 'Loading Models...'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interview Questions Panel */}
        <Card>
          <CardHeader>
            <CardTitle>AI Interview Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground mb-4">
                Start your camera to begin emotion detection analysis
              </p>
              <p className="text-sm text-muted-foreground">
                The system will analyze your facial expressions in real-time using face-api.js
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Emotional State Analysis */}
        <EmotionalStatePanel 
          emotionState={emotionResult}
          additionalData={emotionResult.additionalData}
        />

        {/* Behavior Metrics */}
        <BehaviorMetricsPanel
          metrics={{
            handDetectionCounter: 0,
            handDetectionDuration: 0,
            notFacingCounter: 0,
            notFacingDuration: 0,
            badPostureDetectionCounter: 0,
            badPostureDuration: 0,
            handPresence: false,
            eyeContact: emotionResult.additionalData?.faceDetected || false,
            posture: 'good'
          }}
          emotionState={emotionResult}
          confidenceScore={Math.round(emotionResult.confidence * 100)}
          engagementScore={emotionResult.additionalData?.faceDetected ? 85 : 50}
          attentivenessScore={Math.round(emotionResult.confidence * 80)}
        />
      </div>
    </div>
  );
};

export default IntegratedAIInterviewWithTracking;
