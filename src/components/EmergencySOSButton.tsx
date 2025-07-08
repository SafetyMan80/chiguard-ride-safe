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

  const playEmergencySound = () => {
    console.log('🔊 Playing 30-second emergency sound...');
    setIsSoundPlaying(true);
    
    try {
      // Create Web Audio emergency tone that loops
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const playTone = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Emergency siren sound pattern
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.6);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
        
        return oscillator;
      };
      
      // Play initial tone
      playTone();
      
      // Set up repeating tones for 30 seconds
      let toneCount = 0;
      const maxTones = Math.floor(30 / 1); // 30 tones over 30 seconds
      
      const toneInterval = setInterval(() => {
        if (toneCount >= maxTones || !isSoundPlaying) {
          clearInterval(toneInterval);
          setIsSoundPlaying(false);
          return;
        }
        playTone();
        toneCount++;
      }, 1000); // Play tone every second
      
      // Auto-stop after 30 seconds
      soundTimeoutRef.current = setTimeout(() => {
        clearInterval(toneInterval);
        setIsSoundPlaying(false);
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        console.log('⏰ Emergency sound auto-stopped after 30 seconds');
      }, 30000);
      
      console.log('✅ Emergency sound sequence started');
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      setIsSoundPlaying(false);
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
    if (isActivating || isSoundPlaying) return;
    
    console.log('👆 SOS button hold started...');
    setIsHolding(true);
    
    // Start 1-second countdown to activate
    holdTimeoutRef.current = setTimeout(async () => {
      console.log('🚨 SOS BUTTON HELD FOR 1 SECOND - Activating...');
      setIsActivating(true);
      setIsHolding(false);

      try {
        // Play emergency sound immediately
        playEmergencySound();

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