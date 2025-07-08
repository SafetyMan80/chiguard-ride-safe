import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useOffline } from "@/hooks/useOffline";
import { useToast } from "@/hooks/use-toast";
import { useEmergencyFailsafe } from "@/hooks/useEmergencyFailsafe";
import { rateLimiter } from "@/lib/security";

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
  const holdCompletedRef = useRef<number | null>(null);
  const activatingRef = useRef<boolean>(false);
  const cleanupRef = useRef<boolean>(false);
  const { isOnline, saveOfflineReport } = useOffline();
  const { toast } = useToast();
  const { triggerSOS } = useEmergencyFailsafe();
  
  const { 
    latitude, 
    longitude, 
    accuracy,
    error: geoError,
    getCurrentLocation,
    startWatching,
    stopWatching
  } = useGeolocation({ trackLocation: isActive });

  const createEmergencyTone = async () => {
    try {
      console.log("🚨 Creating emergency tone...");
      
      // Try Web Audio API first
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
          console.log("✅ Audio context created");
        }
      }
      
      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        
        // Resume context if suspended
        if (ctx.state === 'suspended') {
          await ctx.resume();
          console.log("🔄 Audio context resumed");
        }
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Urgent alarm sound - square wave for maximum urgency
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.type = 'square';
        
        // Pulsing volume for attention
        gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.8, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.5);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        
        console.log("🔊 Web Audio tone played");
        return;
      }
      
      // Fallback to HTML5 Audio with data URI
      console.log("📱 Using HTML5 Audio fallback...");
      const audio = new Audio();
      
      // Generate a simple beep tone using data URI
      const sampleRate = 8000;
      const duration = 0.5;
      const frequency = 1200;
      const samples = sampleRate * duration;
      const buffer = new ArrayBuffer(44 + samples);
      const view = new DataView(buffer);
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate, true);
      view.setUint16(32, 1, true);
      view.setUint16(34, 8, true);
      writeString(36, 'data');
      view.setUint32(40, samples, true);
      
      // Generate square wave samples
      for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const sample = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * 127;
        view.setInt8(44 + i, sample);
      }
      
      const blob = new Blob([buffer], { type: 'audio/wav' });
      audio.src = URL.createObjectURL(blob);
      audio.volume = 0.8;
      
      await audio.play();
      console.log("🔊 HTML5 Audio tone played");
      
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      
      // Ultimate fallback - system beep
      try {
        console.log("📢 Using system beep fallback");
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIgBFOo4O9yJQQmdcb1z4A7Chxxtujvpkl'); await audio.play();
      } catch {
        console.log("⚠️ All audio methods failed");
      }
    }
  };

  const playEmergencyAlert = async () => {
    console.log("🚨 STARTING EMERGENCY ALERT SYSTEM...");
    
    // Initial tone
    await createEmergencyTone();
    
    // Play alarm tone every 800ms (gives time for 500ms tone + gap) - continues until stopped
    intervalRef.current = setInterval(async () => {
      await createEmergencyTone();
    }, 800);

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
        
        const utterance = new SpeechSynthesisUtterance("POLICE HAVE BEEN NOTIFIED. POLICE HAVE BEEN NOTIFIED.");
        
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
      
      // Repeat announcement every 2.5 seconds for more frequent alerts
      voiceIntervalRef.current = setInterval(() => {
        console.log("🔄 Repeating voice announcement...");
        announceMessage();
      }, 2500);
    };

    // Start the voice loading process
    loadVoicesAndStart();
  };

  const stopEmergencyAlert = () => {
    if (cleanupRef.current) return; // Prevent multiple cleanup calls
    cleanupRef.current = true;
    
    console.log("🛑 STOPPING EMERGENCY ALERT");
    
    // Clear audio intervals
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
    try {
      speechSynthesis.cancel();
      console.log("✅ Speech synthesis cancelled");
    } catch (error) {
      console.log("⚠️ Speech synthesis cancel error:", error);
    }
    
    // Also cancel any pending speech with delay
    setTimeout(() => {
      try {
        speechSynthesis.cancel();
        console.log("✅ Delayed speech synthesis cancelled");
      } catch (error) {
        console.log("⚠️ Delayed speech synthesis error:", error);
      }
      cleanupRef.current = false; // Reset cleanup flag
    }, 200);
  };

  const handleHoldStart = () => {
    if (isActive || activatingRef.current) {
      console.log("🔒 Hold start prevented - already active/activating");
      return; // Prevent multiple activations
    }
    
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
      activatingRef.current = true; // Mark as activating
      console.log("🆘 2-second hold completed - ACTIVATING EMERGENCY!");
      holdCompletedRef.current = Date.now(); // Track when hold completed
      
      // Clear progress interval immediately
      if (holdProgressRef.current) {
        clearInterval(holdProgressRef.current);
        holdProgressRef.current = null;
      }
      
      setIsHolding(false);
      setHoldProgress(0);
      
      // User interaction happened - enable audio contexts
      try {
        // Enable Web Audio API with better error handling
        if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            audioContextRef.current = new AudioContext();
            if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
            }
            console.log("✅ Audio context initialized with user interaction");
          }
        } else if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log("✅ Audio context resumed");
        }
        
        // Prepare speech synthesis with delay
        speechSynthesis.getVoices();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for voices to load
        console.log("✅ Speech synthesis prepared");
      } catch (error) {
        console.error("⚠️ Audio initialization error:", error);
      }
      
      // Activate emergency (do this BEFORE starting alerts)
      
      // Rate limiting check for emergency activation
      const rateLimitKey = `emergency_activation_${Date.now().toString().slice(0, -6)}`; // Per minute
      if (!rateLimiter.canProceed(rateLimitKey, 3, 60000)) { // Max 3 emergency activations per minute
        const remainingTime = Math.ceil(rateLimiter.getRemainingTime(rateLimitKey) / 1000);
        toast({
          title: "Rate limit exceeded",
          description: `Please wait ${remainingTime} seconds before activating emergency again.`,
          variant: "destructive"
        });
        setIsHolding(false);
        setHoldProgress(0);
        activatingRef.current = false;
        return;
      }

      setIsActive(true);
      getCurrentLocation();
      
      // Use the emergency failsafe hook to trigger SOS and auto-create incident
      try {
        await triggerSOS("SOS button deployed - emergency assistance needed");
        console.log("✅ SOS triggered successfully");
      } catch (error) {
        console.error("❌ SOS trigger failed:", error);
      }
      
      // Notify parent component
      try {
        onEmergencyActivated();
      } catch (error) {
        console.error("Emergency activation callback error:", error);
      }
      
      // Start emergency alerts with delay to ensure state is set
      setTimeout(async () => {
        try {
          await playEmergencyAlert();
        } catch (error) {
          console.error("Emergency alert start error:", error);
        }
        // Reset activating flag AFTER alerts start
        activatingRef.current = false;
      }, 100);
      
      // Start countdown timer
      let timeLeft = 30;
      countdownRef.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        console.log("⏱️ Emergency countdown:", timeLeft, "seconds remaining");
        
        if (timeLeft <= 0) {
          console.log("⏰ Emergency timeout reached - auto-stopping");
          setIsActive(false);
          setCountdown(30);
          activatingRef.current = false;
          stopEmergencyAlert();
        }
      }, 1000);
    }, 2000);
  };

  const handleHoldEnd = () => {
    // Don't clear if emergency is active or activating
    if (isActive) {
      console.log("🖱️ Emergency hold ended but emergency is active - not clearing");
      return;
    }
    
    // Allow clearing if we're still in activation phase (activatingRef could be true)
    console.log("🖱️ Emergency button hold ended - clearing timers");
    
    // Clear timers if holding was incomplete
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      activatingRef.current = false; // Reset if we cancelled the hold
    }
    if (holdProgressRef.current) {
      clearInterval(holdProgressRef.current);
      holdProgressRef.current = null;
    }
    
    setIsHolding(false);
    setHoldProgress(0);
  };

  const handleEmergencyClick = (e: React.MouseEvent) => {
    console.log("🖱️ Emergency button clicked - isActive:", isActive, "activatingRef:", activatingRef.current);
    
    if (isActive) {
      // Stop emergency immediately on click when active
      console.log("✅ Emergency stopped by user click");
      setIsActive(false);
      setCountdown(30);
      activatingRef.current = false;
      stopEmergencyAlert();
      return;
    }
    
    // Prevent click if we just completed a hold (within 500ms - reduced from 1000ms)
    if (holdCompletedRef.current && Date.now() - holdCompletedRef.current < 500) {
      console.log("🔒 Click prevented - hold just completed");
      return;
    }
    
    // Prevent click during activation
    if (activatingRef.current) {
      console.log("🔒 Click prevented - emergency activating");
      return;
    }
    
    // For activation, we now use hold instead of click
    console.log("ℹ️ Click ignored - use hold to activate");
  };

  useEffect(() => {
    return () => {
      console.log("🧹 Emergency button cleanup");
      activatingRef.current = false;
      stopEmergencyAlert();
      stopWatching();
      
      // Clean up all timers
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (holdProgressRef.current) {
        clearInterval(holdProgressRef.current);
        holdProgressRef.current = null;
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
        onMouseDown={isActive ? undefined : (e) => {
          if (!isActive) {
            handleHoldStart();
          }
        }}
        onMouseUp={(e) => {
          if (!isActive) {
            handleHoldEnd();
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            handleHoldEnd();
          }
        }}
        onTouchStart={isActive ? undefined : (e) => {
          if (!isActive) {
            e.preventDefault(); // Prevent mouse events on touch devices
            handleHoldStart();
          }
        }}
        onTouchEnd={(e) => {
          if (!isActive) {
            e.preventDefault(); // Prevent mouse events on touch devices
            handleHoldEnd();
          }
        }}
        onTouchCancel={(e) => {
          if (!isActive) {
            handleHoldEnd();
          }
        }}
        className={`
          w-36 h-36 rounded-xl text-xl font-bold shadow-[var(--shadow-emergency)] border-4 border-white/20 relative overflow-hidden
          touch-target-large active:scale-95
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