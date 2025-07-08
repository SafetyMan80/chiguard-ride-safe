import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEmergencyFailsafe } from '@/hooks/useEmergencyFailsafe';
import { useToast } from '@/hooks/use-toast';

export const EmergencySOSButton = () => {
  const [isActivating, setIsActivating] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const { triggerSOS, isOnline } = useEmergencyFailsafe();
  const { toast } = useToast();
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const soundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playEmergencySound = async () => {
    console.log('🔊 EMERGENCY SOUND STARTING...');
    setIsSoundPlaying(true);
    
    try {
      // Create and configure audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🎵 Audio context created, state:', audioContext.state);
      
      // Force resume audio context
      if (audioContext.state !== 'running') {
        await audioContext.resume();
        console.log('▶️ Audio context resumed, state:', audioContext.state);
      }
      
      audioContextRef.current = audioContext;
      
      // Create loud emergency siren
      const createSiren = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Loud emergency siren pattern
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1500, audioContext.currentTime + 0.5);
        oscillator.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + 1);
        oscillator.type = 'sawtooth';
        
        // Maximum volume
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        
        console.log('🚨 SIREN TONE PLAYED');
        return oscillator;
      };
      
      // Start immediately
      createSiren();
      
      // Continue for 30 seconds
      let toneCount = 1;
      const toneInterval = setInterval(() => {
        if (toneCount >= 30 || !isSoundPlaying) {
          console.log('⏹️ STOPPING EMERGENCY SOUND');
          clearInterval(toneInterval);
          setIsSoundPlaying(false);
          return;
        }
        createSiren();
        toneCount++;
        console.log(`🔊 SIREN TONE ${toneCount}/30`);
      }, 1000);
      
      // Auto-stop after 30 seconds
      soundTimeoutRef.current = setTimeout(() => {
        console.log('⏰ AUTO-STOPPING AFTER 30 SECONDS');
        clearInterval(toneInterval);
        setIsSoundPlaying(false);
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      }, 30000);
      
    } catch (error) {
      console.error('❌ AUDIO FAILED:', error);
      setIsSoundPlaying(false);
      
      // Simple fallback beep
      try {
        const beep = () => {
          const audio = document.createElement('audio');
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIgBFOo4O9yJQQmdcb1z4A7Chxxtujvpkl';
          audio.volume = 1.0;
          audio.play().catch(console.error);
        };
        
        // Beep every second for 30 seconds
        for (let i = 0; i < 30; i++) {
          setTimeout(beep, i * 1000);
        }
        console.log('🔔 FALLBACK BEEPS STARTED');
        
      } catch (fallbackError) {
        console.error('❌ FALLBACK FAILED:', fallbackError);
      }
    }
  };

  const stopEmergencySound = () => {
    console.log('🔇 Stopping emergency sound...');
    setIsSoundPlaying(false);
    
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current);
      soundTimeoutRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handleMouseDown = () => {
    if (isActivating || isSoundPlaying) {
      console.log('⚠️ Button press ignored - already activating or sound playing');
      return;
    }
    
    console.log('👆 SOS button hold started...');
    setIsHolding(true);
    
    // Start 1-second countdown to activate
    holdTimeoutRef.current = setTimeout(async () => {
      console.log('🚨 SOS BUTTON HELD FOR 1 SECOND - Activating...');
      setIsActivating(true);
      setIsHolding(false);

      try {
        // Play emergency sound immediately
        console.log('🎵 About to play emergency sound...');
        await playEmergencySound();
        console.log('🎵 Emergency sound call completed');

        // Show immediate feedback
        toast({
          title: "🚨 SOS ACTIVATED",
          description: "Emergency services are being notified...",
          variant: "destructive",
        });

        console.log('📍 Triggering SOS with GPS location detection...');
        
        // Use the emergency failsafe to file incident report
        await triggerSOS("SOS Emergency - immediate assistance needed");
        
        console.log('✅ SOS successfully triggered and incident filed');
        
        // Success feedback
        toast({
          title: "✅ Emergency Report Filed",
          description: "SOS incident has been logged and emergency services notified",
        });

      } catch (error) {
        console.error('❌ SOS activation failed:', error);
        
        toast({
          title: "❌ SOS Error",
          description: "Failed to send emergency alert. Please call 911 directly.",
          variant: "destructive",
        });
      } finally {
        setIsActivating(false);
      }
    }, 1000);
  };

  const handleMouseUp = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    setIsHolding(false);
    console.log('👆 SOS button hold released');
  };

  const handleStopSound = () => {
    if (isSoundPlaying) {
      stopEmergencySound();
      toast({
        title: "🔇 Sound Stopped",
        description: "Emergency alert sound has been manually stopped",
      });
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-red-600">Emergency SOS</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Hold the button for 1 second to activate emergency alert with GPS location
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <Button
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={isActivating}
          className={`w-32 h-32 rounded-full text-white shadow-2xl border-4 transform transition-all duration-200 disabled:opacity-50 ${
            isHolding 
              ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 border-orange-300 scale-95' 
              : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 border-red-300 hover:border-red-200 hover:scale-105 active:scale-95'
          }`}
          size="lg"
        >
          <div className="flex flex-col items-center space-y-1">
            <AlertTriangle className={`w-12 h-12 ${isActivating ? 'animate-pulse' : isHolding ? 'animate-bounce' : ''}`} />
            <span className="text-lg font-bold">
              {isActivating ? 'ACTIVATING...' : isHolding ? 'HOLD...' : 'SOS'}
            </span>
          </div>
        </Button>

        {isSoundPlaying && (
          <Button
            onClick={handleStopSound}
            variant="outline"
            className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
          >
            🔇 Stop Sound
          </Button>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
        </p>
        <p className="text-xs text-muted-foreground">
          Will automatically detect nearest transit system
        </p>
        <p className="text-xs font-semibold text-red-600">
          For immediate help, always call 911
        </p>
        {isSoundPlaying && (
          <p className="text-xs font-semibold text-orange-600 animate-pulse">
            🔊 Emergency sound playing (30s max)
          </p>
        )}
      </div>
    </div>
  );
};