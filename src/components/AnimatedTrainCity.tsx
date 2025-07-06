import { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';

interface AnimatedTrainCityProps {
  interactive?: boolean;
  onInteraction?: () => void;
}

export const AnimatedTrainCity = ({ interactive = false, onInteraction }: AnimatedTrainCityProps) => {
  const [isAnimating, setIsAnimating] = useState(true);

  const handleClick = () => {
    if (interactive && onInteraction) {
      setIsAnimating(false);
      setTimeout(() => onInteraction(), 500);
    }
  };

  useEffect(() => {
    if (interactive) {
      const timer = setTimeout(() => {
        if (onInteraction) onInteraction();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [interactive, onInteraction]);

  return (
    <div 
      className={`relative w-full h-48 overflow-hidden rounded-lg ${interactive ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {/* City Skyline Background */}
      <svg
        viewBox="0 0 800 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Sky Gradient */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#98D8E8" />
          </linearGradient>
          <linearGradient id="trainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--chicago-blue))" />
            <stop offset="50%" stopColor="hsl(var(--chicago-dark-blue))" />
            <stop offset="100%" stopColor="hsl(var(--chicago-blue))" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        </defs>
        
        {/* Sky */}
        <rect width="800" height="120" fill="url(#skyGradient)" />
        
        {/* City Buildings */}
        <rect x="50" y="60" width="40" height="60" fill="#4A5568" />
        <rect x="100" y="40" width="35" height="80" fill="#2D3748" />
        <rect x="140" y="70" width="30" height="50" fill="#4A5568" />
        <rect x="180" y="30" width="45" height="90" fill="#2D3748" />
        <rect x="230" y="55" width="38" height="65" fill="#4A5568" />
        <rect x="280" y="45" width="42" height="75" fill="#2D3748" />
        <rect x="330" y="65" width="35" height="55" fill="#4A5568" />
        <rect x="380" y="35" width="40" height="85" fill="#2D3748" />
        <rect x="430" y="50" width="45" height="70" fill="#4A5568" />
        <rect x="480" y="40" width="38" height="80" fill="#2D3748" />
        <rect x="530" y="60" width="42" height="60" fill="#4A5568" />
        <rect x="580" y="45" width="35" height="75" fill="#2D3748" />
        <rect x="620" y="55" width="40" height="65" fill="#4A5568" />
        <rect x="670" y="35" width="45" height="85" fill="#2D3748" />
        <rect x="720" y="50" width="38" height="70" fill="#4A5568" />
        
        {/* Building Windows */}
        {Array.from({ length: 50 }, (_, i) => {
          const x = 55 + (i % 15) * 50;
          const y = 45 + Math.floor(i / 15) * 15;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="4"
              height="6"
              fill={Math.random() > 0.6 ? "#FEF08A" : "#1F2937"}
            />
          );
        })}
        
        {/* Train Track Base */}
        <rect x="0" y="140" width="800" height="20" fill="#4A5568" />
        <rect x="0" y="145" width="800" height="2" fill="#E5E7EB" />
        <rect x="0" y="153" width="800" height="2" fill="#E5E7EB" />
        
        {/* Moving Train */}
        <g className={`${isAnimating ? 'animate-train-city' : ''}`}>
          {/* Train Engine */}
          <rect x="0" y="125" width="60" height="20" fill="url(#trainGradient)" rx="3" filter="url(#glow)" />
          <rect x="5" y="130" width="50" height="10" fill="hsl(var(--chicago-light-blue))" rx="2" />
          
          {/* Train Cars */}
          <rect x="65" y="125" width="50" height="20" fill="url(#trainGradient)" rx="3" />
          <rect x="70" y="130" width="40" height="10" fill="hsl(var(--chicago-light-blue))" rx="2" />
          
          <rect x="120" y="125" width="50" height="20" fill="url(#trainGradient)" rx="3" />
          <rect x="125" y="130" width="40" height="10" fill="hsl(var(--chicago-light-blue))" rx="2" />
          
          <rect x="175" y="125" width="50" height="20" fill="url(#trainGradient)" rx="3" />
          <rect x="180" y="130" width="40" height="10" fill="hsl(var(--chicago-light-blue))" rx="2" />
          
          {/* Train Wheels */}
          <circle cx="15" cy="148" r="3" fill="#1F2937" />
          <circle cx="35" cy="148" r="3" fill="#1f2937" />
          <circle cx="45" cy="148" r="3" fill="#1F2937" />
          <circle cx="75" cy="148" r="3" fill="#1F2937" />
          <circle cx="105" cy="148" r="3" fill="#1F2937" />
          <circle cx="130" cy="148" r="3" fill="#1F2937" />
          <circle cx="160" cy="148" r="3" fill="#1F2937" />
          <circle cx="185" cy="148" r="3" fill="#1F2937" />
          <circle cx="215" cy="148" r="3" fill="#1F2937" />
        </g>
        
        {/* Ground */}
        <rect x="0" y="160" width="800" height="40" fill="#22C55E" />
      </svg>
      
      {/* Floating Shield Logo */}
      <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-10 ${isAnimating ? 'animate-float-logo' : ''}`}>
        <Logo className="w-16 h-16 drop-shadow-2xl" />
      </div>
      
      {/* Interactive Prompt */}
      {interactive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10">
          <p className="text-white text-sm font-medium drop-shadow-lg animate-pulse">
            {isAnimating ? 'Click to continue or wait...' : 'Loading...'}
          </p>
        </div>
      )}
    </div>
  );
};