import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
// Audio and emergency functionality

interface EmergencyButtonProps {
  onEmergencyActivated: () => void;
}

export const EmergencyButton = ({ onEmergencyActivated }: EmergencyButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const createEmergencyTone = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
        }
      }
      
      if (!audioContextRef.current) return;
      
      const ctx = audioContextRef.current;
      
      // Resume context if it's suspended (required for mobile)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  };

  const playEmergencyAlert = () => {
    // Play intermittent tone every 2 seconds
    intervalRef.current = setInterval(() => {
      createEmergencyTone();
    }, 2000);

    // Initial tone
    createEmergencyTone();

    // Voice announcement
    const utterance = new SpeechSynthesisUtterance("Emergency alert activated. Police are on their way!");
    utterance.rate = 1.2;
    utterance.volume = 0.8;
    speechSynthesis.speak(utterance);
  };

  const stopEmergencyAlert = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    speechSynthesis.cancel();
  };

  const handleEmergencyClick = () => {
    if (isActive) {
      // Stop emergency
      setIsActive(false);
      setCountdown(30);
      stopEmergencyAlert();
    } else {
      // Start emergency
      setIsActive(true);
      onEmergencyActivated();
      playEmergencyAlert();
      
      // Start countdown
      let timeLeft = 30;
      countdownRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        
        if (timeLeft <= 0) {
          setIsActive(false);
          setCountdown(30);
          stopEmergencyAlert();
        }
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      stopEmergencyAlert();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        variant={isActive ? "destructive" : "emergency"}
        size="lg"
        onClick={handleEmergencyClick}
        className={`
          w-32 h-32 rounded-full text-xl font-bold
          ${isActive ? 'animate-pulse-emergency' : 'hover:scale-105'}
          transition-all duration-200
        `}
      >
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 mb-2 bg-white rounded-full flex items-center justify-center text-chicago-red font-bold text-lg">!</div>
          {isActive ? (
            <span className="text-sm">{countdown}s</span>
          ) : (
            <span>SOS</span>
          )}
        </div>
      </Button>
      
      <p className="text-center text-sm text-muted-foreground max-w-xs">
        {isActive 
          ? "Emergency alert active. Tap again to cancel."
          : "Tap to activate emergency alert and notify nearby riders."
        }
      </p>
    </div>
  );
};