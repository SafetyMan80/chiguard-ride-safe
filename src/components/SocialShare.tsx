import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SocialShareProps {
  userName?: string;
  transitLine?: string;
  customMessage?: string;
  className?: string;
}

export const SocialShare = ({ 
  userName = "Someone", 
  transitLine = "CTA", 
  customMessage,
  className = ""
}: SocialShareProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  
  const shareMessage = customMessage || `${userName} is traveling safe with RailSavior and so should you! 🚇✨ #RailSavior #SafeCommute`;
  const shareUrl = window.location.origin;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        setIsSharing(true);
        await navigator.share({
          title: "RailSavior - Safe Transit",
          text: shareMessage,
          url: shareUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Thanks for spreading the word about safe transit!",
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: "Share failed",
            description: "Please try again or use one of the social media buttons below.",
            variant: "destructive",
          });
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareMessage} ${shareUrl}`);
      toast({
        title: "Link copied!",
        description: "Share message has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSocialShare = (platform: string) => {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let shareUrl_platform = "";
    
    switch (platform) {
      case 'facebook':
        shareUrl_platform = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
        break;
      case 'twitter':
        shareUrl_platform = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so we'll copy the message
        handleCopyLink();
        toast({
          title: "Message copied!",
          description: "Paste this in your Instagram story or post!",
        });
        return;
      case 'tiktok':
        // TikTok doesn't support direct URL sharing, so we'll copy the message
        handleCopyLink();
        toast({
          title: "Message copied!",
          description: "Paste this in your TikTok caption!",
        });
        return;
      default:
        return;
    }
    
    window.open(shareUrl_platform, '_blank', 'width=600,height=400');
    
    toast({
      title: "Thanks for sharing!",
      description: "Help us build a safer transit community.",
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="w-5 h-5" />
          Share Your Safe Journey
        </CardTitle>
        <CardDescription>
          Let friends know you're traveling safely with RailSavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Message */}
        <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-chicago-blue">
          <p className="text-sm text-muted-foreground italic">"{shareMessage}"</p>
        </div>
        
        {/* Social Media Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSocialShare('facebook')}
            className="flex items-center gap-2 hover-scale"
          >
            <Facebook className="w-4 h-4" />
            Facebook
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSocialShare('twitter')}
            className="flex items-center gap-2 hover-scale"
          >
            <Twitter className="w-4 h-4" />
            Twitter
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSocialShare('instagram')}
            className="flex items-center gap-2 hover-scale"
          >
            <Instagram className="w-4 h-4" />
            Instagram
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSocialShare('tiktok')}
            className="flex items-center gap-2 hover-scale"
          >
            <MessageCircle className="w-4 h-4" />
            TikTok
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};