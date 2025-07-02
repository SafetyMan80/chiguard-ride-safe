import { useState, useRef, useCallback } from 'react';

interface CameraState {
  isSupported: boolean;
  isStreaming: boolean;
  error: string | null;
}

export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    isSupported: typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    isStreaming: false,
    error: null
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Camera is not supported on this device' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setState(prev => ({ ...prev, isStreaming: true }));
      return true;
    } catch (error) {
      let errorMessage = 'Failed to access camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera is not supported on this device.';
        }
      }

      setState(prev => ({ ...prev, error: errorMessage, isStreaming: false }));
      return false;
    }
  }, [state.isSupported]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState(prev => ({ ...prev, isStreaming: false }));
  }, []);

  const capturePhoto = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !state.isStreaming) {
        resolve(null);
        return;
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        resolve(null);
        return;
      }

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.9);
    });
  }, [state.isStreaming]);

  // File input alternative for devices without camera API support
  const selectFromGallery = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Suggest camera on mobile
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          resolve(url);
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }, []);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    selectFromGallery
  };
};