
import React from 'react';
import { Target, Scan } from 'lucide-react';

interface TrackingMetrics {
  handPresence: boolean;
  facePresence: boolean;
  posePresence: boolean;
  eyeContact: boolean;
  posture: 'good' | 'poor';
  confidence: number;
}

interface FuturisticTrackingOverlayProps {
  metrics: TrackingMetrics;
  className?: string;
}

const FuturisticTrackingOverlay: React.FC<FuturisticTrackingOverlayProps> = ({ 
  metrics, 
  className = "" 
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none z-30 ${className}`}>
      {/* Scanning Grid Effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(6,182,212,0.2)_50%,transparent_100%)] animate-[scan_3s_ease-in-out_infinite]"></div>
      </div>
      
      {/* Corner Brackets */}
      <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 border-cyan-400 animate-pulse"></div>
      <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 border-cyan-400 animate-pulse"></div>
      <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 border-cyan-400 animate-pulse"></div>
      <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 border-cyan-400 animate-pulse"></div>
      
      {/* Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border border-cyan-400/50 rounded-full animate-ping"></div>
          <div className="absolute inset-1 border border-cyan-400 rounded-full"></div>
          <Target className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
        </div>
      </div>
      
      {/* Minimal Status Indicators */}
      <div className="absolute top-4 left-4 space-y-1">
        <div className={`w-2 h-2 rounded-full ${metrics.facePresence ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
        <div className={`w-2 h-2 rounded-full ${metrics.eyeContact ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
        <div className={`w-2 h-2 rounded-full ${metrics.posture === 'good' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
      </div>
      
      {/* Scanning Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 animate-[scan_2s_ease-in-out_infinite]"></div>
      
      {/* Status Text */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/50 backdrop-blur-sm border border-cyan-400/30 rounded px-3 py-1 text-xs text-cyan-400 font-mono">
          TRACKING ACTIVE
        </div>
      </div>
    </div>
  );
};

export default FuturisticTrackingOverlay;
