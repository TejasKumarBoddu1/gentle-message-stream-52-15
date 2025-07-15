
import { useEffect, useRef, useState } from 'react';
import { EmotionState } from '@/utils/mediapipe/emotionDetection';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface EmotionDetectionResult extends EmotionState {
  isInitialized: boolean;
  isProcessing: boolean;
}

export const useEmotionDetection = (videoRef: React.RefObject<HTMLVideoElement>, isActive: boolean = false): EmotionDetectionResult => {
  const [emotionState, setEmotionState] = useState<EmotionState>({
    dominant: 'neutral',
    confidence: 0,
    scores: {
      happy: 0,
      sad: 0,
      surprised: 0,
      neutral: 1,
      disgust: 0,
      angry: 0,
      fearful: 0
    },
    icon: '😐'
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number>();
  const lastProcessTimeRef = useRef<number>(0);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;

    const initializeDetection = async () => {
      if (!isActive || isInitialized) return;

      try {
        console.log('🎭 Initializing MediaPipe Face Landmarker...');
        
        // Use a more reliable CDN
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1
        });

        if (isMounted) {
          faceLandmarkerRef.current = faceLandmarker;
          setIsInitialized(true);
          console.log('✅ MediaPipe Face Landmarker initialized successfully');
        }
      } catch (error) {
        console.error('❌ Failed to initialize MediaPipe Face Landmarker:', error);
        // Try to reinitialize after a delay
        setTimeout(() => {
          if (isMounted) {
            setIsInitialized(false);
          }
        }, 2000);
      }
    };

    initializeDetection();

    return () => {
      isMounted = false;
    };
  }, [isActive, isInitialized]);

  // Real-time emotion detection
  useEffect(() => {
    if (!isActive || !faceLandmarkerRef.current || !videoRef.current || !isInitialized) {
      return;
    }

    const detectEmotions = () => {
      const video = videoRef.current;
      const faceLandmarker = faceLandmarkerRef.current;

      if (!video || !faceLandmarker || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(detectEmotions);
        return;
      }

      const now = performance.now();
      
      // Process at 10 FPS for better responsiveness
      if (now - lastProcessTimeRef.current < 100) {
        animationFrameRef.current = requestAnimationFrame(detectEmotions);
        return;
      }
      
      lastProcessTimeRef.current = now;

      try {
        // Detect faces and blendshapes
        const results = faceLandmarker.detectForVideo(video, now);
        
        console.log('🔍 Detection results:', {
          facesDetected: results.faceBlendshapes?.length || 0,
          hasBlendshapes: !!results.faceBlendshapes?.[0]?.categories?.length
        });
        
        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
          const blendshapes = results.faceBlendshapes[0];
          console.log('📊 Blendshapes categories count:', blendshapes.categories?.length || 0);
          
          // Log some key blendshape values for debugging
          const categories = blendshapes.categories || [];
          const smileLeft = categories.find(c => c.categoryName === 'mouthSmileLeft')?.score || 0;
          const smileRight = categories.find(c => c.categoryName === 'mouthSmileRight')?.score || 0;
          const browDown = categories.find(c => c.categoryName === 'browDownLeft')?.score || 0;
          const eyeWide = categories.find(c => c.categoryName === 'eyeWideLeft')?.score || 0;
          
          console.log('🎭 Key blendshapes:', {
            smileLeft: smileLeft.toFixed(3),
            smileRight: smileRight.toFixed(3),
            browDown: browDown.toFixed(3),
            eyeWide: eyeWide.toFixed(3)
          });
          
          const newEmotionState = analyzeBlendshapes(blendshapes);
          setEmotionState(newEmotionState);
          
          console.log('🎭 Emotion detected:', newEmotionState.dominant, 'Confidence:', (newEmotionState.confidence * 100).toFixed(1) + '%');
        } else {
          console.log('👤 No face detected');
          setEmotionState({
            dominant: 'neutral',
            confidence: 0,
            scores: {
              happy: 0,
              sad: 0,
              surprised: 0,
              neutral: 1,
              disgust: 0,
              angry: 0,
              fearful: 0
            },
            icon: '😐'
          });
        }
      } catch (error) {
        console.error('❌ Error during emotion detection:', error);
      }

      animationFrameRef.current = requestAnimationFrame(detectEmotions);
    };

    console.log('🎬 Starting emotion detection loop');
    detectEmotions();

    return () => {
      if (animationFrameRef.current) {
        console.log('⏹️ Stopping emotion detection loop');
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, videoRef, isInitialized]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
        setIsInitialized(false);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    ...emotionState,
    isInitialized,
    isProcessing: isActive && isInitialized
  };
};

// Enhanced emotion analysis with better sensitivity and mapping
const analyzeBlendshapes = (blendshapes: any): EmotionState => {
  const categories = blendshapes.categories || [];
  
  // Helper to get blendshape score
  const getScore = (name: string): number => {
    const category = categories.find((c: any) => c.categoryName === name);
    return category ? Math.max(0, Math.min(1, category.score)) : 0;
  };

  // More sensitive emotion detection with lower thresholds
  const rawScores = {
    // Happy detection - look for any smile indicators
    happy: Math.max(
      getScore('mouthSmileLeft') * 2,
      getScore('mouthSmileRight') * 2,
      (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) * 1.5,
      getScore('cheekSquintLeft') * 1.2,
      getScore('cheekSquintRight') * 1.2
    ),
    
    // Sad detection
    sad: Math.max(
      getScore('mouthFrownLeft') * 2,
      getScore('mouthFrownRight') * 2,
      getScore('mouthLowerDownLeft') * 1.5,
      getScore('mouthLowerDownRight') * 1.5,
      getScore('browDownLeft') * 1.3,
      getScore('browDownRight') * 1.3
    ),
    
    // Surprised detection
    surprised: Math.max(
      getScore('eyeWideLeft') * 2,
      getScore('eyeWideRight') * 2,
      getScore('jawOpen') * 1.8,
      getScore('browOuterUpLeft') * 1.5,
      getScore('browOuterUpRight') * 1.5
    ),
    
    // Angry detection - lower threshold for better detection
    angry: Math.max(
      getScore('browDownLeft') * 2,
      getScore('browDownRight') * 2,
      getScore('eyeSquintLeft') * 1.5,
      getScore('eyeSquintRight') * 1.5,
      getScore('mouthPressLeft') * 1.3,
      getScore('mouthPressRight') * 1.3,
      getScore('browInnerUp') * 1.2
    ),
    
    // Disgust detection
    disgust: Math.max(
      getScore('noseSneerLeft') * 2,
      getScore('noseSneerRight') * 2,
      getScore('mouthUpperUpLeft') * 1.5,
      getScore('mouthUpperUpRight') * 1.5
    ),
    
    // Fearful detection
    fearful: Math.max(
      getScore('eyeWideLeft') * 1.5,
      getScore('eyeWideRight') * 1.5,
      getScore('browInnerUp') * 1.8,
      getScore('mouthStretchLeft') * 1.3,
      getScore('mouthStretchRight') * 1.3
    ),
    
    // Neutral - inverse of all other emotions
    neutral: Math.max(0.1, 1 - Math.max(
      getScore('mouthSmileLeft'),
      getScore('mouthSmileRight'),
      getScore('mouthFrownLeft'),
      getScore('mouthFrownRight'),
      getScore('eyeWideLeft'),
      getScore('eyeWideRight'),
      getScore('browDownLeft'),
      getScore('browDownRight'),
      getScore('jawOpen')
    ))
  };

  // Clamp scores between 0 and 1
  const scores = Object.fromEntries(
    Object.entries(rawScores).map(([key, value]) => [key, Math.max(0, Math.min(1, value))])
  ) as typeof rawScores;

  // Find dominant emotion
  const emotionEntries = Object.entries(scores);
  const [dominantEmotion, confidence] = emotionEntries.reduce((max, current) => 
    current[1] > max[1] ? current : max
  );

  // Boost confidence for better detection sensitivity
  const boostedConfidence = Math.min(1, confidence * 2);

  // Emotion icons
  const emotionIcons: Record<string, string> = {
    happy: '😊',
    sad: '😢',
    surprised: '😮',
    angry: '😠',
    disgust: '🤢',
    fearful: '😨',
    neutral: '😐'
  };

  console.log('📈 Emotion scores:', scores);
  console.log('🎯 Dominant emotion:', dominantEmotion, 'Raw confidence:', confidence, 'Boosted:', boostedConfidence);

  return {
    dominant: dominantEmotion,
    confidence: boostedConfidence,
    scores,
    icon: emotionIcons[dominantEmotion] || '😐',
    timestamp: Date.now()
  };
};
