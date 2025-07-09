import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, X, Shield, Camera, Image as ImageIcon, Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSecureUpload } from "@/hooks/useSecureUpload";
import { useCamera } from "@/hooks/useCamera";

interface Message {
  id: string;
  sender_id: string;
  message_text: string;
  message_type: string;
  image_url?: string;
  created_at: string;
  sender_name: string;
}

interface GroupRideMessengerProps {
  rideId: string;
  rideTitle: string;
  onClose: () => void;
}

export const GroupRideMessenger = ({ rideId, rideTitle, onClose }: GroupRideMessengerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile } = useSecureUpload();
  const { selectFromGallery } = useCamera();

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    subscribeToMessages();
  }, [rideId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for ride:', rideId);
      const { data: messagesData, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('ride_id', rideId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Messages fetched:', messagesData);

      // Get sender profiles
      const senderIds = [...new Set(messagesData?.map(msg => msg.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', senderIds);

      console.log('Profiles fetched:', profiles);

      const messagesWithNames = (messagesData || []).map(msg => ({
        ...msg,
        sender_name: profiles?.find(p => p.user_id === msg.sender_id)?.full_name || 'Anonymous'
      }));

      console.log('Messages with names:', messagesWithNames);
      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Failed to load messages",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const subscribeToMessages = () => {
    console.log('Setting up real-time subscription for ride:', rideId);
    const channel = supabase
      .channel(`messages-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `ride_id=eq.${rideId}`
        },
        (payload) => {
          console.log('Real-time message received:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from messages channel');
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    console.log('Sending message:', { rideId, userId: currentUser.id, message: newMessage.trim() });
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          ride_id: rideId,
          sender_id: currentUser.id,
          message_text: newMessage.trim(),
          message_type: 'text'
        })
        .select();

      if (error) throw error;
      console.log('Message sent successfully:', data);

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async () => {
    if (!currentUser) return;

    try {
      setUploadingPhoto(true);
      
      // Create a file input to select photos
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const { url, error } = await uploadFile(file, {
            bucket: 'group-chat-photos',
            folder: currentUser.id,
            allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            maxSize: 5 * 1024 * 1024 // 5MB
          });

          if (error) throw new Error(error);
          if (!url) throw new Error('Failed to upload photo');

          // Send photo message
          const { data, error: messageError } = await supabase
            .from('group_messages')
            .insert({
              ride_id: rideId,
              sender_id: currentUser.id,
              message_text: '',
              message_type: 'image',
              image_url: url
            })
            .select();

          if (messageError) throw messageError;

          toast({
            title: "Photo sent!",
            description: "Your photo has been shared with the group.",
          });

        } catch (error: any) {
          console.error('Error uploading photo:', error);
          toast({
            title: "Failed to send photo",
            description: error.message || "Please try again.",
            variant: "destructive"
          });
        }
      };

      input.click();
    } catch (error) {
      console.error('Error initiating photo upload:', error);
      toast({
        title: "Failed to open camera",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Card className="fixed inset-4 z-50 bg-background shadow-lg border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Group Chat - {rideTitle}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-3 h-3" />
          Only group ride members can see these messages
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col h-[60vh]">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender_id === currentUser?.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {message.sender_name[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      message.sender_id === currentUser?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender_id === currentUser?.id ? 'You' : message.sender_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    {message.message_type === 'image' && message.image_url ? (
                      <div className="rounded-lg overflow-hidden max-w-[200px]">
                        <img 
                          src={message.image_url} 
                          alt="Shared photo"
                          className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(message.image_url, '_blank')}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className={`rounded-lg px-3 py-2 text-sm ${
                          message.sender_id === currentUser?.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.message_text || (message.message_type === 'image' ? 'Photo' : '')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="space-y-3">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading || uploadingPhoto}
              maxLength={500}
            />
            <Button 
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePhotoUpload}
              disabled={loading || uploadingPhoto}
              className="flex-shrink-0"
            >
              {uploadingPhoto ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>
            <Button type="submit" disabled={loading || !newMessage.trim() || uploadingPhoto} size="sm">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <div className="text-xs text-muted-foreground text-center">
            📷 Share photos of stops, landmarks, or meeting points to help group members
          </div>
        </div>
      </CardContent>
    </Card>
  );
};