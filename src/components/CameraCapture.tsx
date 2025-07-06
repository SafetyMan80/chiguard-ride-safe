import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, X, Check, Image, AlertTriangle } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { validateFileUpload } from '@/lib/security';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageUrl: string) => void;
  title?: string;
}

export const CameraCapture = ({ 
  isOpen, 
  onClose, 
  onCapture, 
  title = "Take Photo" 
}: CameraCaptureProps) => {
  const {
    isSupported,
    isStreaming,
    error,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    selectFromGallery
  } = useCamera();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(true);

  useEffect(() => {
    if (isOpen && !showLegalDisclaimer) {
      startCamera();
    }

    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [isOpen, showLegalDisclaimer, startCamera, stopCamera, capturedImage]);

  const handleAcceptDisclaimer = () => {
    setShowLegalDisclaimer(false);
  };

  const handleCapture = async () => {
    const imageUrl = await capturePhoto();
    if (imageUrl) {
      setCapturedImage(imageUrl);
      stopCamera();
    }
  };

  const handleSelectFromGallery = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/jpg,image/png,image/webp';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file before processing
        const validation = validateFileUpload(file);
        if (!validation.valid) {
          alert(`File validation failed: ${validation.error}`);
          return;
        }
        
        // Create secure blob URL
        const imageUrl = URL.createObjectURL(file);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    };
    fileInput.click();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      onClose();
    }
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    setShowLegalDisclaimer(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {showLegalDisclaimer ? (
          <div className="flex-1 flex flex-col space-y-4">
            <Alert className="border-chicago-red/20 bg-chicago-red/5">
              <AlertTriangle className="h-4 w-4 text-chicago-red" />
              <AlertDescription className="text-sm">
                <strong className="text-chicago-red">LEGAL DISCLAIMER & PRIVACY NOTICE</strong>
              </AlertDescription>
            </Alert>

            <Card className="flex-1">
              <CardContent className="p-4 space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-chicago-red mb-2">Photography Guidelines:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Do NOT photograph people without their explicit consent</li>
                    <li>• Do NOT photograph private property or businesses without permission</li>
                    <li>• Only photograph public incidents where you are legally present</li>
                    <li>• Respect privacy laws and local regulations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-chicago-red mb-2">Legal Protection:</h4>
                  <p className="text-muted-foreground mb-2">
                    By using this feature, you acknowledge that:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• You are solely responsible for compliance with all applicable laws</li>
                    <li>• CHIGUARD and its creators are held harmless from any legal consequences</li>
                    <li>• You will not use photos for harassment, stalking, or illegal purposes</li>
                    <li>• Images may be shared with law enforcement if required by law</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-chicago-red mb-2">Privacy Notice:</h4>
                  <p className="text-muted-foreground">
                    Photos are stored locally on your device and only shared when you explicitly submit them with an incident report. We recommend removing identifying information when possible.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleAcceptDisclaimer} className="flex-1 bg-chicago-blue hover:bg-chicago-dark-blue">
                I Understand & Agree
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {capturedImage ? (
              // Show captured image for confirmation
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleRetake} className="flex-1">
                    Retake
                  </Button>
                  <Button onClick={handleConfirm} className="flex-1 bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-2" />
                    Use Photo
                  </Button>
                </div>
              </div>
            ) : (
              // Show camera view or error
              <div className="flex-1 flex flex-col">
                {error ? (
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <Alert className="border-chicago-red/20 bg-chicago-red/5">
                      <AlertTriangle className="h-4 w-4 text-chicago-red" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button 
                      onClick={handleSelectFromGallery}
                      variant="outline"
                      className="w-full"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Select from Gallery
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative">
                      {isSupported ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          Camera not supported
                        </div>
                      )}
                      
                      {isStreaming && (
                        <div className="absolute inset-x-0 bottom-4 flex justify-center">
                          <Button
                            onClick={handleCapture}
                            size="lg"
                            className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 text-black"
                          >
                            <Camera className="w-6 h-6" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSelectFromGallery}
                        variant="outline"
                        className="flex-1"
                      >
                        <Image className="w-4 h-4 mr-2" />
                        Gallery
                      </Button>
                      {!isStreaming && isSupported && (
                        <Button 
                          onClick={startCamera}
                          className="flex-1 bg-chicago-blue hover:bg-chicago-dark-blue"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Start Camera
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};