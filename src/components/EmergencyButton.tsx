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
      console.log("Creating emergency tone...");
      
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          console.log("Audio context created");
        }
      }
      
      if (!audioContextRef.current) {
        console.log("No audio context available");
        return;
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if it's suspended (required for mobile)
      if (ctx.state === 'suspended') {
        console.log("Resuming audio context...");
        ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Make it LOUDER and more urgent
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
      
      console.log("Emergency tone played");
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  const playEmergencyAlert = () => {
    console.log("Starting emergency alert audio/voice...");
    
    // Play loud alarm tone every 400ms for more urgency
    intervalRef.current = setInterval(() => {
      createEmergencyTone();
    }, 400);

    // Initial tone
    createEmergencyTone();

    // Voice announcement every 3 seconds for the full duration
    const announceMessage = () => {
      console.log("Playing voice announcement...");
      const utterance = new SpeechSynthesisUtterance("EMERGENCY ALERT ACTIVATED! POLICE ARE ON THEIR WAY! THIS IS AN EMERGENCY!");
      utterance.rate = 1.2;
      utterance.volume = 1.0;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    };
    
    // Initial announcement
    announceMessage();
    
    // Repeat announcement every 3 seconds for 30 seconds
    const voiceInterval = setInterval(announceMessage, 3000);
    
    // Clear voice interval after 30 seconds
    setTimeout(() => {
      console.log("Stopping voice announcements");
      clearInterval(voiceInterval);
    }, 30000);
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
    console.log("Emergency button clicked, current state:", isActive);
    
    if (isActive) {
      // Stop emergency
      setIsActive(false);
      setCountdown(30);
      stopEmergencyAlert();
      console.log("Emergency stopped");
    } else {
      // Start emergency
      console.log("Starting emergency alert...");
      setIsActive(true);
      onEmergencyActivated();
      playEmergencyAlert();
      
      // Start countdown
      let timeLeft = 30;
      countdownRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        console.log("Emergency countdown:", timeLeft);
        
        if (timeLeft <= 0) {
          setIsActive(false);
          setCountdown(30);
          stopEmergencyAlert();
          console.log("Emergency timeout reached");
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
          w-36 h-36 rounded-full text-xl font-bold shadow-[var(--shadow-emergency)] border-4 border-white/20
          ${isActive ? 'animate-pulse-emergency' : 'hover:scale-105 hover:shadow-[var(--shadow-floating)]'}
          transition-all duration-300 backdrop-blur-sm
        `}
      >
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 mb-3 bg-white rounded-full flex items-center justify-center text-chicago-red font-bold text-xl shadow-md">!</div>
          {isActive ? (
            <span className="text-base font-semibold">{countdown}s</span>
          ) : (
            <span className="text-lg font-bold tracking-wide">SOS</span>
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