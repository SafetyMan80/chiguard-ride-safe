import { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo';

interface RealisticTrain3DProps {
  interactive?: boolean;
  onInteraction?: () => void;
}

export const RealisticTrain3D = ({ interactive = false, onInteraction }: RealisticTrain3DProps) => {
  const [trainScale, setTrainScale] = useState(0.1);
  const [isAnimating, setIsAnimating] = useState(true);

  const handleClick = () => {
    if (interactive && onInteraction) {
      setIsAnimating(false);
      setTimeout(() => onInteraction(), 500);
    }
  };

  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setTrainScale(prev => {
          const newScale = prev + 0.02;
          return newScale > 1.2 ? 0.1 : newScale;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  useEffect(() => {
    if (interactive) {
      const timer = setTimeout(() => {
        if (onInteraction) onInteraction();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [interactive, onInteraction]);

  return (
    <div 
      className={`relative w-full h-64 overflow-hidden rounded-lg bg-gradient-to-b from-sky-300 via-sky-200 to-green-300 ${interactive ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      style={{
        perspective: '1000px',
        backgroundImage: 'linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 50%, #98FB98 100%)'
      }}
    >
      {/* Railway Tracks with Perspective */}
      <div 
        className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
        style={{
          width: '400px',
          height: '200px',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(75deg) translateZ(-50px)'
        }}
      >
        {/* Track Rails */}
        <div 
          className="absolute w-full h-1 bg-gray-600 rounded"
          style={{ 
            top: '45%',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transform: 'translateY(-50%)'
          }}
        />
        <div 
          className="absolute w-full h-1 bg-gray-600 rounded"
          style={{ 
            top: '55%',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transform: 'translateY(-50%)'
          }}
        />
        
        {/* Railroad Ties */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute bg-amber-800 rounded"
            style={{
              width: '120%',
              height: '6px',
              left: '-10%',
              top: `${45 + (i * 2)}%`,
              transform: 'translateY(-50%)',
              opacity: 0.8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          />
        ))}
      </div>

      {/* Realistic 3D Train */}
      <div 
        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-out"
        style={{
          transform: `translateX(-50%) scale(${trainScale}) translateZ(${trainScale * 50}px)`,
          transformStyle: 'preserve-3d',
          filter: `blur(${Math.max(0, (1 - trainScale) * 2)}px)`
        }}
      >
        {/* Train Engine Body */}
        <div className="relative">
          {/* Main Engine Body */}
          <div 
            className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-lg shadow-2xl"
            style={{
              width: '200px',
              height: '80px',
              background: 'linear-gradient(45deg, hsl(var(--chicago-blue)), hsl(var(--chicago-dark-blue)), hsl(var(--chicago-navy)))',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 2px 8px rgba(255,255,255,0.2)'
            }}
          >
            {/* Front Nose Cone */}
            <div 
              className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-700 to-blue-900 rounded-r-full"
              style={{
                width: '40px',
                height: '60px',
                background: 'linear-gradient(90deg, hsl(var(--chicago-dark-blue)), hsl(var(--chicago-navy)))',
                boxShadow: '4px 0 16px rgba(0,0,0,0.3)'
              }}
            />
            
            {/* Shield Logo on Front */}
            <div 
              className="absolute -right-6 top-1/2 transform -translate-y-1/2 z-20"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
              }}
            >
              <Logo className="w-10 h-10" />
            </div>

            {/* Train Windows */}
            <div className="flex gap-2 absolute top-2 left-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="bg-sky-200 rounded border border-gray-300"
                  style={{
                    width: '20px',
                    height: '20px',
                    background: 'linear-gradient(135deg, #e0f2fe, #b3e5fc)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              ))}
            </div>

            {/* Train Details */}
            <div className="absolute bottom-2 left-4 right-4 flex justify-between items-center">
              <div className="bg-yellow-400 rounded px-2 py-1 text-xs font-bold text-black shadow-md">
                RAILSAVIOR
              </div>
              <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse shadow-md" />
            </div>

            {/* Side Vents */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 space-y-1">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="w-8 h-1 bg-gray-400 rounded opacity-60"
                  style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}
                />
              ))}
            </div>
          </div>

          {/* Train Wheels */}
          <div className="absolute -bottom-4 left-4 flex gap-8">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="relative">
                <div 
                  className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border-2 border-gray-500"
                  style={{
                    boxShadow: '0 4px 8px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
                    animation: `spin ${2 / trainScale}s linear infinite`
                  }}
                >
                  <div className="absolute inset-2 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full" />
                  <div className="absolute inset-3 bg-gray-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Headlight */}
          <div 
            className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-yellow-200 rounded-full border-2 border-yellow-400"
            style={{
              boxShadow: '0 0 20px rgba(255, 255, 0, 0.8), 0 0 40px rgba(255, 255, 0, 0.4)',
              background: 'radial-gradient(circle, #fff59d, #ffeb3b)'
            }}
          />
        </div>
      </div>

      {/* Motion Lines for Speed Effect */}
      {trainScale > 0.5 && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="absolute bg-white/30 rounded-full animate-pulse"
              style={{
                width: `${2 + i * 4}px`,
                height: '2px',
                left: `${20 + i * 8}%`,
                top: `${60 + Math.sin(i) * 10}%`,
                transform: `translateX(-${trainScale * 100}px)`,
                opacity: trainScale * 0.6
              }}
            />
          ))}
        </div>
      )}

      {/* Distance Markers */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-8 opacity-60">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="w-2 h-2 bg-gray-600 rounded-full"
            style={{
              transform: `scale(${0.5 + i * 0.2})`,
              opacity: 0.3 + i * 0.15
            }}
          />
        ))}
      </div>

      {/* Interactive Prompt */}
      {interactive && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center z-10">
          <p className="text-gray-800 text-sm font-medium drop-shadow-lg animate-bounce bg-white/80 px-3 py-1 rounded-full">
            {isAnimating ? 'Click to continue or wait...' : 'Loading...'}
          </p>
        </div>
      )}
    </div>
  );
};