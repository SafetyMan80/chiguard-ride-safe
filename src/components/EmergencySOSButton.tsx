import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEmergencyFailsafe } from '@/hooks/useEmergencyFailsafe';
import { useToast } from '@/hooks/use-toast';

export const EmergencySOSButton = () => {
  const [isActivating, setIsActivating] = useState(false);
  const { triggerSOS, isOnline } = useEmergencyFailsafe();
  const { toast } = useToast();

  const playEmergencySound = () => {
    console.log('🔊 Playing emergency sound...');
    
    try {
      // Create Web Audio emergency tone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Emergency siren sound
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.4);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
      
      console.log('✅ Emergency sound played successfully');
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      
      // Fallback: System beep
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIgBFOo4O9yJQQmdcb1z4A7Chxxtujvpkl');
        audio.volume = 0.5;
        audio.play();
        console.log('✅ Fallback sound played');
      } catch (fallbackError) {
        console.warn('⚠️ All audio methods failed:', fallbackError);
      }
    }
  };

  const handleSOSClick = async () => {
    if (isActivating) {
      console.log('⚠️ SOS already activating, ignoring click');
      return;
    }

    console.log('🚨 SOS BUTTON CLICKED - Starting activation...');
    setIsActivating(true);

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
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-red-600">Emergency SOS</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Click the button below to activate emergency alert with GPS location
        </p>
      </div>

      <Button
        onClick={handleSOSClick}
        disabled={isActivating}
        className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white shadow-2xl border-4 border-red-300 hover:border-red-200 transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
        size="lg"
      >
        <div className="flex flex-col items-center space-y-1">
          <AlertTriangle className={`w-12 h-12 ${isActivating ? 'animate-pulse' : ''}`} />
          <span className="text-lg font-bold">
            {isActivating ? 'ACTIVATING...' : 'SOS'}
          </span>
        </div>
      </Button>

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
      </div>
    </div>
  );
};