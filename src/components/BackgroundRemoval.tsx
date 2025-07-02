import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Download, Wand2 } from 'lucide-react';
import { removeBackground, loadImageFromUrl } from '@/utils/backgroundRemoval';
import { useToast } from '@/hooks/use-toast';

interface BackgroundRemovalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onProcessed: (processedImageUrl: string) => void;
  title?: string;
}

export const BackgroundRemoval = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  onProcessed, 
  title = "Remove Background" 
}: BackgroundRemovalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemoveBackground = async () => {
    if (!imageUrl) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      
      // Load the image
      const imageElement = await loadImageFromUrl(imageUrl);
      setProgress(30);
      
      // Remove background
      const processedBlob = await removeBackground(imageElement);
      setProgress(90);
      
      // Create URL for processed image
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
      setProgress(100);
      
      toast({
        title: "Background Removed!",
        description: "Your image background has been successfully removed.",
      });
      
    } catch (error) {
      console.error('Background removal failed:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to remove background. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleUseProcessed = () => {
    if (processedImageUrl) {
      onProcessed(processedImageUrl);
      handleClose();
    }
  };

  const handleClose = () => {
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
      setProcessedImageUrl(null);
    }
    setProgress(0);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Original</CardTitle>
            </CardHeader>
            <CardContent>
              <img 
                src={imageUrl} 
                alt="Original" 
                className="w-full h-32 object-contain bg-gray-100 rounded"
              />
            </CardContent>
          </Card>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {progress < 30 ? 'Loading image...' : 
                 progress < 90 ? 'Removing background...' : 
                 'Finalizing...'}
              </p>
            </div>
          )}

          {/* Processed Image */}
          {processedImageUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Background Removed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-transparent bg-opacity-50 bg-[linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px] rounded">
                  <img 
                    src={processedImageUrl} 
                    alt="Background removed" 
                    className="w-full h-32 object-contain rounded"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!processedImageUrl ? (
              <>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleRemoveBackground} 
                  disabled={isProcessing}
                  className="flex-1 bg-chicago-blue hover:bg-chicago-dark-blue"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Remove Background'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleUseProcessed} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Use This Image
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};