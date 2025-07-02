import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BackgroundRemoval } from '@/components/BackgroundRemoval';
import { Wand2 } from 'lucide-react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  const [showBackgroundRemoval, setShowBackgroundRemoval] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/lovable-uploads/3e4ff657-9082-43ff-9824-0c952875017b.png");
  const [isProcessed, setIsProcessed] = useState(false);

  const handleProcessedImage = (processedImageUrl: string) => {
    setLogoUrl(processedImageUrl);
    setIsProcessed(true);
  };

  return (
    <div className="relative group">
      <img
        src={logoUrl}
        alt="ChiGuard Shield Logo"
        className={`${className} object-contain ${isProcessed ? 'drop-shadow-lg' : ''}`}
      />
      
      {/* Show background removal button on hover in development */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowBackgroundRemoval(true)}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Wand2 className="w-3 h-3 mr-1" />
          Remove BG
        </Button>
      )}

      <BackgroundRemoval
        isOpen={showBackgroundRemoval}
        onClose={() => setShowBackgroundRemoval(false)}
        imageUrl="/lovable-uploads/3e4ff657-9082-43ff-9824-0c952875017b.png"
        onProcessed={handleProcessedImage}
        title="Remove Shield Background"
      />
    </div>
  );
};