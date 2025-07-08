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
    console.log('🔊 EMERGENCY SOUND STARTING - CONTINUOUS EVERY 200MS FOR 30 SECONDS');
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
      
      let beepCount = 0;
      const maxBeeps = 150; // 30 seconds / 0.2 seconds = 150 beeps
      let intervalId: NodeJS.Timeout;
      
      console.log(`🚨 Starting beeping sequence: ${maxBeeps} beeps over 30 seconds`);
      
      // Function to create a single loud beep
      const createBeep = () => {
        console.log(`🚨 Creating beep ${beepCount + 1}/${maxBeeps}`);
        
        if (beepCount >= maxBeeps) {
          console.log('⏰ Max beeps reached, stopping');
          clearInterval(intervalId);
          setIsSoundPlaying(false);
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          return;
        }
        
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          console.log('❌ Audio context not available, stopping');
          clearInterval(intervalId);
          setIsSoundPlaying(false);
          return;
        }
        
        try {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          // Very loud, harsh emergency tone
          oscillator.frequency.setValueAtTime(1000, audioContextRef.current.currentTime);
          oscillator.type = 'square'; // Very harsh, attention-grabbing sound
          
          // Maximum volume with sharp attack and quick decay
          gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
          gainNode.gain.linearRampToValueAtTime(1.0, audioContextRef.current.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.15);
          
          // Play for 150ms
          oscillator.start(audioContextRef.current.currentTime);
          oscillator.stop(audioContextRef.current.currentTime + 0.15);
          
          beepCount++;
          console.log(`✅ Beep ${beepCount}/${maxBeeps} played successfully`);
        } catch (error) {
          console.error('❌ Error creating beep:', error);
        }
      };
      
      // Start the first beep immediately
      createBeep();
      
      // Schedule beeps every 200ms
      intervalId = setInterval(() => {
        createBeep();
      }, 200);
      
      // Store interval for cleanup
      soundTimeoutRef.current = intervalId as any;
      
      // Auto-stop after 30 seconds as backup
      const backupTimeout = setTimeout(() => {
        console.log('⏰ AUTO-STOPPING AFTER 30 SECONDS (BACKUP)');
        clearInterval(intervalId);
        setIsSoundPlaying(false);
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
      }, 30000);
      
    } catch (error) {
      console.error('❌ AUDIO SETUP FAILED:', error);
      setIsSoundPlaying(false);
      
      // Fallback using HTML5 Audio with repeated creation
      try {
        console.log('🔔 STARTING FALLBACK BEEPING');
        let fallbackBeeps = 0;
        const maxFallbackBeeps = 150;
        
        const fallbackBeep = () => {
          if (fallbackBeeps >= maxFallbackBeeps) {
            console.log('⏰ Fallback beeping complete');
            setIsSoundPlaying(false);
            return;
          }
          
          console.log(`🔔 Fallback beep ${fallbackBeeps + 1}/${maxFallbackBeeps}`);
          
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIgBFUo4O9yJQQmdcb1z4A7Chxxtujvpkl');
          audio.volume = 1.0;
          audio.play().catch(e => console.error('Fallback audio play failed:', e));
          
          fallbackBeeps++;
        };
        
        // Start fallback beeps every 200ms
        fallbackBeep();
        const fallbackInterval = setInterval(fallbackBeep, 200);
        soundTimeoutRef.current = fallbackInterval as any;
        
        // Stop fallback after 30 seconds
        setTimeout(() => {
          clearInterval(fallbackInterval);
          setIsSoundPlaying(false);
          console.log('⏰ Fallback auto-stop after 30 seconds');
        }, 30000);
        
      } catch (fallbackError) {
        console.error('❌ FALLBACK FAILED:', fallbackError);
        setIsSoundPlaying(false);
      }
    }
  };

  const stopEmergencySound = () => {
    console.log('🔇 Stopping emergency sound manually...');
    setIsSoundPlaying(false);
    
    if (soundTimeoutRef.current) {
      clearInterval(soundTimeoutRef.current);
      soundTimeoutRef.current = null;
      console.log('✅ Interval cleared');
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      console.log('✅ Audio context closed');
    }
  };

  const handleDial911 = () => {
    // Use tel: protocol to pre-dial 911 on mobile devices
    window.location.href = 'tel:911';
    
    toast({
      title: "📞 Dialing 911",
      description: "Emergency number pre-dialed on your device",
    });
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

        {/* 911 Dialing Option */}
        <div className="border-t pt-4 w-full">
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Need immediate emergency assistance?
            </p>
            <Button
              onClick={handleDial911}
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3"
            >
              📞 Dial 911 Now
            </Button>
          </div>
        </div>
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
            🔊 Emergency sound playing - Press "Stop Sound" to silence
          </p>
        )}
      </div>
    </div>
  );
};