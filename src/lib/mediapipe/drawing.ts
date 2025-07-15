
import { DrawingUtils } from "@mediapipe/tasks-vision";
import { Landmark } from "@/types/mediapipe";

export const drawHandLandmarks = (
  canvas: HTMLCanvasElement,
  landmarksArray: Landmark[][]
): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const drawingUtils = new DrawingUtils(ctx);
  landmarksArray.forEach((landmarks) => {
    // Draw hand connections
    const HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index finger
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle finger
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring finger
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17] // Palm connections
    ];

    // Draw connections
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    HAND_CONNECTIONS.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        const startPoint = {
          x: landmarks[start].x * canvas.width,
          y: landmarks[start].y * canvas.height
        };
        const endPoint = {
          x: landmarks[end].x * canvas.width,
          y: landmarks[end].y * canvas.height
        };
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });

    // Draw landmarks
    landmarks.forEach((landmark) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      ctx.beginPath();
      ctx.fillStyle = "#ff0000";
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  });
};

export const drawFaceMeshLandmarks = (
  canvas: HTMLCanvasElement,
  faceResults: any
): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (!faceResults.faceLandmarks || faceResults.faceLandmarks.length === 0) return;

  const landmarks = faceResults.faceLandmarks[0];
  if (!landmarks || landmarks.length === 0) return;

  // Draw face outline and key points
  ctx.fillStyle = "#00ffff";
  landmarks.forEach((landmark: Landmark, index: number) => {
    const x = landmark.x * canvas.width;
    const y = landmark.y * canvas.height;
    
    // Draw larger points for key facial features
    const radius = (index < 468) ? 1 : 3; // Larger for iris points
    
    ctx.beginPath();
    if (index >= 468 && index < 478) {
      ctx.fillStyle = "#ff00ff"; // Iris points in magenta
    } else if (index >= 0 && index < 17) {
      ctx.fillStyle = "#ffff00"; // Face contour in yellow
    } else {
      ctx.fillStyle = "#00ffff"; // Other points in cyan
    }
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  });

  // Draw eye tracking indicator
  const rightEyeOuter = landmarks[33];
  const rightEyeInner = landmarks[133];
  if (rightEyeOuter && rightEyeInner) {
    const eyeCenterX = ((rightEyeOuter.x + rightEyeInner.x) / 2) * canvas.width;
    const eyeCenterY = ((rightEyeOuter.y + rightEyeInner.y) / 2) * canvas.height;
    
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(eyeCenterX, eyeCenterY, 15, 0, 2 * Math.PI);
    ctx.stroke();
  }
};

export const drawPoseLandmarkers = (
  canvas: HTMLCanvasElement,
  poseLandmarks: Landmark[][]
): void => {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  poseLandmarks.forEach((landmarks) => {
    // Define pose connections
    const POSE_CONNECTIONS = [
      [11, 12], // Shoulders
      [11, 13], [13, 15], // Left arm
      [12, 14], [14, 16], // Right arm
      [11, 23], [12, 24], // Torso
      [23, 24], // Hips
      [23, 25], [25, 27], // Left leg
      [24, 26], [26, 28], // Right leg
    ];

    // Draw connections
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 3;
    POSE_CONNECTIONS.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        const startPoint = {
          x: landmarks[start].x * canvas.width,
          y: landmarks[start].y * canvas.height
        };
        const endPoint = {
          x: landmarks[end].x * canvas.width,
          y: landmarks[end].y * canvas.height
        };
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });

    // Draw key landmarks with different colors
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      ctx.beginPath();
      // Color code different body parts
      if (index === 0) {
        ctx.fillStyle = "#ff0000"; // Head/nose - red
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
      } else if (index >= 11 && index <= 16) {
        ctx.fillStyle = "#ffff00"; // Arms - yellow
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
      } else if (index >= 23 && index <= 28) {
        ctx.fillStyle = "#ff00ff"; // Legs - magenta
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
      } else {
        ctx.fillStyle = "#00ff00"; // Other points - green
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
      }
      ctx.fill();
    });
  });
};
