import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";

interface EmergencyButtonProps {
  onEmergencyActivated: () => void;
}

export const EmergencyButton = ({ onEmergencyActivated }: EmergencyButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const voiceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    latitude, 
    longitude, 
    accuracy,
    error: geoError,
    getCurrentLocation,
    startWatching,
    stopWatching
  } = useGeolocation({ trackLocation: isActive });

  const createEmergencyTone = () => {
    try {
      console.log("🚨 Creating LOUD emergency tone...");
      
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          console.log("✅ Audio context created");
        }
      }
      
      if (!audioContextRef.current) {
        console.log("❌ No audio context available");
        return;
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if it's suspended (required for mobile)
      if (ctx.state === 'suspended') {
        console.log("🔄 Resuming audio context...");
        ctx.resume();
      }
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // VERY LOUD and urgent alarm sound
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(1.0, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(1.0, ctx.currentTime + 0.4);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.6);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.6);
      
      console.log("🔊 LOUD Emergency tone played");
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
    }
  };

  const playEmergencyAlert = () => {
    console.log("🚨 STARTING EMERGENCY ALERT SYSTEM...");
    
    // Play VERY loud alarm tone every 300ms for maximum urgency
    intervalRef.current = setInterval(() => {
      createEmergencyTone();
    }, 300);

    // Initial tone
    createEmergencyTone();

    // Voice announcement every 2 seconds for the full 30 seconds
    const announceMessage = () => {
      console.log("📢 Playing URGENT voice announcement...");
      const utterance = new SpeechSynthesisUtterance("Police are on their way");
      utterance.rate = 0.8;
      utterance.volume = 1.0;
      utterance.pitch = 1.3;
      speechSynthesis.speak(utterance);
    };
    
    // Initial announcement
    announceMessage();
    
    // Repeat announcement every 2 seconds for maximum urgency
    voiceIntervalRef.current = setInterval(announceMessage, 2000);
    
    // Clear voice interval after 30 seconds
    setTimeout(() => {
      console.log("⏰ Stopping voice announcements after 30 seconds");
      if (voiceIntervalRef.current) {
        clearInterval(voiceIntervalRef.current);
        voiceIntervalRef.current = null;
      }
      speechSynthesis.cancel();
    }, 30000);
  };

  const stopEmergencyAlert = () => {
    console.log("🛑 STOPPING EMERGENCY ALERT");
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (voiceIntervalRef.current) {
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = null;
    }
    
    // Cancel all speech synthesis
    speechSynthesis.cancel();
    
    // Also cancel any pending speech
    setTimeout(() => {
      speechSynthesis.cancel();
    }, 100);
  };

  const handleEmergencyClick = () => {
    console.log("🚨 Emergency button clicked, current state:", isActive);
    
    if (isActive) {
      // Stop emergency
      setIsActive(false);
      setCountdown(30);
      stopEmergencyAlert();
      console.log("✅ Emergency stopped by user");
    } else {
      // Start emergency
      console.log("🆘 ACTIVATING EMERGENCY PROTOCOL...");
      setIsActive(true);
      
      // Get current location for emergency
      getCurrentLocation();
      
      onEmergencyActivated();
      playEmergencyAlert();
      
      // Pre-dial 911
      try {
        window.open('tel:911', '_self');
      } catch (error) {
        console.log('Unable to pre-dial 911:', error);
      }
      
      // Start countdown
      let timeLeft = 30;
      countdownRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        console.log("⏱️ Emergency countdown:", timeLeft, "seconds remaining");
        
        if (timeLeft <= 0) {
          setIsActive(false);
          setCountdown(30);
          stopEmergencyAlert();
          console.log("⏰ Emergency timeout reached - auto-stopping");
        }
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      stopEmergencyAlert();
      stopWatching();
    };
  }, [stopWatching]);

  // Reset emergency state when component unmounts or page changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopEmergencyAlert();
      setIsActive(false);
      setCountdown(30);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        variant={isActive ? "destructive" : "emergency"}
        size="lg"
        onClick={handleEmergencyClick}
        className={`
          w-40 h-40 rounded-full text-xl font-bold shadow-[var(--shadow-emergency)] border-4 border-white/20
          ${isActive ? 'animate-pulse-emergency bg-red-600' : 'hover:scale-105 hover:shadow-[var(--shadow-floating)] bg-chicago-red'}
          transition-all duration-300 backdrop-blur-sm
        `}
      >
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-3 bg-white rounded-full flex items-center justify-center text-chicago-red font-bold text-2xl shadow-md">
            🚨
          </div>
          {isActive ? (
            <div className="text-center">
              <span className="text-lg font-bold text-white">{countdown}s</span>
              <div className="text-sm font-semibold text-white">ACTIVE</div>
            </div>
          ) : (
            <span className="text-xl font-bold tracking-wide text-white">SOS</span>
          )}
        </div>
      </Button>
      
      <div className="text-center text-sm text-muted-foreground max-w-xs space-y-2">
        <p>
          {isActive 
            ? "🚨 EMERGENCY ALERT ACTIVE! Tap again to cancel."
            : "Tap to activate LOUD emergency alert and notify police."
          }
        </p>
        
        {isActive && (
          <div className="text-xs">
            {latitude && longitude ? (
              <span className="text-green-600">
                📍 Location tracked ({accuracy ? `±${Math.round(accuracy)}m` : 'GPS'})
              </span>
            ) : geoError ? (
              <span className="text-destructive">⚠️ Location unavailable</span>
            ) : (
              <span className="text-chicago-blue">📍 Getting location...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};