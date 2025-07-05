import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useOffline } from "@/hooks/useOffline";
import { useToast } from "@/hooks/use-toast";

interface EmergencyButtonProps {
  onEmergencyActivated: () => void;
}

export const EmergencyButton = ({ onEmergencyActivated }: EmergencyButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const voiceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdProgressRef = useRef<NodeJS.Timeout | null>(null);
  const { isOnline, saveOfflineReport } = useOffline();
  const { toast } = useToast();
  
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
    
    // Play VERY loud alarm tone every 300ms for maximum urgency - continues until stopped
    intervalRef.current = setInterval(() => {
      createEmergencyTone();
    }, 300);

    // Initial tone
    createEmergencyTone();

    // Load voices first, then start announcements
    const loadVoicesAndStart = () => {
      const voices = speechSynthesis.getVoices();
      console.log("🎙️ Available voices:", voices.length, voices.map(v => v.name));
      
      if (voices.length === 0) {
        console.log("⏳ No voices loaded yet, waiting...");
        // Wait for voices to load
        speechSynthesis.addEventListener('voiceschanged', loadVoicesAndStart, { once: true });
        return;
      }

      // Voice announcement function - using male voice
      const announceMessage = () => {
        console.log("📢 Playing URGENT male voice announcement...");
        
        // Cancel any existing speech first
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance("Police are on their way. Police are on their way.");
        
        // Try to find a male voice with better detection
        const maleVoice = voices.find(voice => {
          const name = voice.name.toLowerCase();
          return name.includes('male') || 
                 name.includes('david') ||
                 name.includes('alex') ||
                 name.includes('daniel') ||
                 name.includes('fred') ||
                 name.includes('brian') ||
                 name.includes('mark') ||
                 name.includes('tom') ||
                 name.includes('john') ||
                 name.includes('microsoft david') ||
                 name.includes('google us-english') && !name.includes('female');
        }) || voices[0]; // Fallback to first voice
        
        if (maleVoice) {
          utterance.voice = maleVoice;
          console.log("🎤 Using voice:", maleVoice.name, "| Lang:", maleVoice.lang);
        } else {
          console.log("⚠️ No male voice found, using default");
        }
        
        // Voice settings for clarity and urgency
        utterance.rate = 0.8;    // Clear speaking rate
        utterance.volume = 1.0;  // Maximum volume
        utterance.pitch = 0.7;   // Lower pitch for male sound
        
        // Debug callbacks
        utterance.onstart = () => console.log("🔊 Voice announcement STARTED");
        utterance.onend = () => console.log("✅ Voice announcement ENDED");
        utterance.onerror = (e) => console.error("❌ Voice error:", e.error, e);
        
        try {
          speechSynthesis.speak(utterance);
          console.log("🚀 Speech synthesis command sent");
        } catch (error) {
          console.error("❌ Failed to speak:", error);
        }
      };
      
      // Start immediately
      announceMessage();
      
      // Repeat announcement every 4 seconds (gives time for full message)
      voiceIntervalRef.current = setInterval(() => {
        console.log("🔄 Repeating voice announcement...");
        announceMessage();
      }, 4000);
    };

    // Start the voice loading process
    loadVoicesAndStart();
  };

  const stopEmergencyAlert = () => {
    console.log("🛑 STOPPING EMERGENCY ALERT");
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log("✅ Alarm tone interval cleared");
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
      console.log("✅ Countdown interval cleared");
    }
    if (voiceIntervalRef.current) {
      clearInterval(voiceIntervalRef.current);
      voiceIntervalRef.current = null;
      console.log("✅ Voice interval cleared");
    }
    
    // Cancel all speech synthesis
    speechSynthesis.cancel();
    console.log("✅ Speech synthesis cancelled");
    
    // Also cancel any pending speech
    setTimeout(() => {
      speechSynthesis.cancel();
      console.log("✅ Delayed speech synthesis cancelled");
    }, 100);
  };

  const handleHoldStart = () => {
    if (isActive) return; // If already active, don't start hold timer
    
    console.log("🖱️ Emergency button hold started");
    setIsHolding(true);
    setHoldProgress(0);
    
    // Progress animation (20 updates over 2 seconds)
    let progress = 0;
    holdProgressRef.current = setInterval(() => {
      progress += 5; // 5% every 100ms = 2 seconds total
      setHoldProgress(progress);
    }, 100);
    
    // Activation timer (2 seconds)
    holdTimerRef.current = setTimeout(async () => {
      console.log("🆘 2-second hold completed - ACTIVATING EMERGENCY!");
      setIsHolding(false);
      setHoldProgress(0);
      
      // Activate emergency
      setIsActive(true);
      getCurrentLocation();
      
      const emergencyData = {
        timestamp: new Date().toISOString(),
        location: { latitude, longitude, accuracy },
        type: 'emergency_alert'
      };

      if (!isOnline) {
        const saved = await saveOfflineReport('emergency', emergencyData);
        if (saved) {
          toast({
            title: "🚨 EMERGENCY SAVED OFFLINE!",
            description: "Alert will be sent when connection returns",
            variant: "destructive"
          });
        }
      }
      
      onEmergencyActivated();
      playEmergencyAlert();
      
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
    }, 2000);
  };

  const handleHoldEnd = () => {
    console.log("🖱️ Emergency button hold ended");
    
    // Clear timers if holding was incomplete
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdProgressRef.current) {
      clearInterval(holdProgressRef.current);
      holdProgressRef.current = null;
    }
    
    setIsHolding(false);
    setHoldProgress(0);
  };

  const handleEmergencyClick = () => {
    if (isActive) {
      // Stop emergency immediately on click when active
      console.log("✅ Emergency stopped by user");
      setIsActive(false);
      setCountdown(30);
      stopEmergencyAlert();
    }
    // For activation, we now use hold instead of click
  };

  useEffect(() => {
    return () => {
      stopEmergencyAlert();
      stopWatching();
      
      // Clean up hold timers
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      if (holdProgressRef.current) {
        clearInterval(holdProgressRef.current);
      }
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
        onMouseDown={isActive ? undefined : handleHoldStart}
        onMouseUp={handleHoldEnd}
        onMouseLeave={handleHoldEnd}
        onTouchStart={isActive ? undefined : handleHoldStart}
        onTouchEnd={handleHoldEnd}
        className={`
          w-40 h-40 rounded-full text-xl font-bold shadow-[var(--shadow-emergency)] border-4 border-white/20 relative overflow-hidden
          ${isActive ? 'animate-pulse-emergency bg-red-600' : 'hover:scale-105 hover:shadow-[var(--shadow-floating)] bg-chicago-red'}
          ${isHolding ? 'scale-95' : ''}
          transition-all duration-300 backdrop-blur-sm
        `}
      >
        {/* Hold progress indicator */}
        {isHolding && (
          <div 
            className="absolute inset-0 bg-white/30 transition-all duration-100 ease-linear"
            style={{
              background: `conic-gradient(from 0deg, rgba(255,255,255,0.4) ${holdProgress * 3.6}deg, transparent ${holdProgress * 3.6}deg)`
            }}
          />
        )}
        
        <div className="flex flex-col items-center relative z-10">
          <div className="w-12 h-12 mb-3 bg-white rounded-full flex items-center justify-center text-chicago-red font-bold text-2xl shadow-md">
            🚨
          </div>
          {isActive ? (
            <div className="text-center">
              <span className="text-lg font-bold text-white">{countdown}s</span>
              <div className="text-sm font-semibold text-white">ACTIVE</div>
            </div>
          ) : isHolding ? (
            <div className="text-center">
              <span className="text-sm font-bold text-white">HOLD</span>
              <div className="text-xs font-semibold text-white">{Math.ceil((100 - holdProgress) / 50)}s</div>
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
            : isHolding
            ? "🔄 Keep holding for 2 seconds to activate emergency..."
            : "Hold for 2 seconds to activate LOUD emergency alert with male voice."
          }
        </p>
        
        {!isOnline && (
          <p className="text-yellow-600 font-medium">
            📱 OFFLINE - Emergency will be sent when connection returns
          </p>
        )}
        
        {isActive && (
          <div className="space-y-3">
            <Button 
              onClick={() => window.open('tel:911', '_self')}
              variant="destructive"
              size="lg"
              className="w-full font-bold text-lg animate-pulse-emergency"
            >
              📞 CALL 911 NOW
            </Button>
            
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
          </div>
        )}
      </div>
    </div>
  );
};