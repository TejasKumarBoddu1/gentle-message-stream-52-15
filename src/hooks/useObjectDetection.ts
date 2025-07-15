
import { useEffect, useRef, useState } from 'react';
import { yoloDetector, ObjectDetectionResult } from '@/utils/objectDetection/yoloDetection';
import { speakText } from '@/utils/speechUtils';

interface ViolationState {
  phoneCount: number;
  peopleCount: number;
  phoneDetectionTimes: Date[];
  peopleDetectionTimes: Date[];
  isTerminated: boolean;
}

export const useObjectDetection = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  isActive: boolean,
  videoRef?: React.RefObject<HTMLVideoElement>
) => {
  const [violations, setViolations] = useState<ViolationState>({
    phoneCount: 0,
    peopleCount: 0,
    phoneDetectionTimes: [],
    peopleDetectionTimes: [],
    isTerminated: false
  });

  const [detectionResult, setDetectionResult] = useState<ObjectDetectionResult>({
    phones: [],
    people: [],
    otherObjects: []
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPhoneWarningRef = useRef<number>(0);
  const lastPersonWarningRef = useRef<number>(0);

  useEffect(() => {
    if (isActive) {
      yoloDetector.loadModel();
    }
  }, [isActive]);

  // Helper function to check if camera is actually working
  const isCameraReady = () => {
    if (!videoRef?.current) return false;
    const video = videoRef.current;
    return video.readyState >= 2 && !video.paused && video.srcObject !== null;
  };

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    intervalRef.current = setInterval(async () => {
      // Only run detection if camera is actually working
      if (!isCameraReady()) {
        console.log("📷 Camera not ready, skipping object detection");
        return;
      }

      if (canvasRef.current) {
        const result = await yoloDetector.detectObjects(canvasRef.current);
        setDetectionResult(result);

        const now = Date.now();

        // Handle phone detection
        if (result.phones.length > 0) {
          setViolations(prev => {
            const newPhoneCount = prev.phoneCount + 1;
            const newTimes = [...prev.phoneDetectionTimes, new Date()];

            // Phone warnings
            if (now - lastPhoneWarningRef.current > 5000) { // Throttle warnings
              if (newPhoneCount === 1) {
                speakText("Please avoid using your phone during the interview.");
              } else if (newPhoneCount >= 3) {
                speakText("Interview terminated for policy violation. Phone usage is not allowed.");
                return { ...prev, isTerminated: true };
              } else {
                speakText(`Phone detected. This is warning ${newPhoneCount} of 3.`);
              }
              lastPhoneWarningRef.current = now;
            }

            return {
              ...prev,
              phoneCount: newPhoneCount,
              phoneDetectionTimes: newTimes
            };
          });
        }

        // Handle person detection
        if (result.people.length > 1) { // More than 1 person (candidate)
          setViolations(prev => {
            const newPeopleCount = prev.peopleCount + 1;
            const newTimes = [...prev.peopleDetectionTimes, new Date()];

            if (now - lastPersonWarningRef.current > 8000) { // Throttle warnings
              speakText("There appears to be someone else in the room. Please ensure privacy during the interview.");
              lastPersonWarningRef.current = now;
            }

            return {
              ...prev,
              peopleCount: newPeopleCount,
              peopleDetectionTimes: newTimes
            };
          });
        }
      }
    }, 2000); // Check every 2 seconds instead of 1 second for better performance

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, canvasRef, videoRef]);

  return { violations, detectionResult };
};
