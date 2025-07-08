import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Phone } from 'lucide-react';
import { useEmergencyFailsafe } from '@/hooks/useEmergencyFailsafe';
import { cn } from '@/lib/utils';

export const EmergencySOSButton = () => {
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { triggerSOS, isOnline } = useEmergencyFailsafe();

  const playAlertSound = () => {
    // Create emergency alert sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // High-pitched alert sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const handleSOSPress = async () => {
    setSosActive(true);
    
    // Play immediate alert sound
    try {
      playAlertSound();
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
    
    // 3-second countdown before activation to prevent accidental triggers
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      
      // Play sound on each countdown tick
      if (count > 0) {
        try {
          playAlertSound();
        } catch (error) {
          console.warn('Could not play countdown sound:', error);
        }
      }
      
      if (count <= 0) {
        clearInterval(countdownInterval);
        // Play final activation sound
        try {
          playAlertSound();
        } catch (error) {
          console.warn('Could not play activation sound:', error);
        }
        triggerSOS("Emergency SOS activated from RAILSAVIOR app");
        setSosActive(false);
        setCountdown(0);
      }
    }, 1000);

    // Allow cancellation during countdown
    setTimeout(() => {
      if (sosActive) {
        setSosActive(false);
        setCountdown(0);
        clearInterval(countdownInterval);
      }
    }, 100); // Small delay to prevent immediate cancellation
  };

  const cancelSOS = () => {
    setSosActive(false);
    setCountdown(0);
  };

  if (sosActive) {
    return (
      <div className="fixed inset-0 bg-red-500/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center space-y-6 max-w-sm mx-4 shadow-2xl">
          <div className="text-red-500">
            <AlertTriangle className="w-16 h-16 mx-auto animate-pulse" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              SOS ACTIVATING
            </h2>
            <p className="text-lg font-mono text-red-500">
              {countdown}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Emergency services will be notified
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={cancelSOS}
              variant="outline" 
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              CANCEL SOS
            </Button>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>Location: {isOnline ? 'Tracking' : 'Offline'}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-3 h-3" />
                <span>Call 911 for immediate help</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSOSPress}
      className={cn(
        "fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl z-40",
        "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
        "border-4 border-red-300 hover:border-red-200",
        "transform hover:scale-105 active:scale-95 transition-all duration-200",
        !isOnline && "animate-pulse border-orange-300 from-orange-500 to-orange-600"
      )}
      size="icon"
    >
      <div className="flex flex-col items-center">
        <AlertTriangle className="w-6 h-6 text-white" />
        <span className="text-xs font-bold text-white">SOS</span>
      </div>
    </Button>
  );
};