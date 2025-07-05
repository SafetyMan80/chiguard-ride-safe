import { useOffline } from "@/hooks/useOffline";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff } from "lucide-react";

export const OfflineIndicator = () => {
  const { isOnline } = useOffline();

  if (isOnline) return null;

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50 text-yellow-800">
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2">
        <span>You're offline. Some features may be limited.</span>
      </AlertDescription>
    </Alert>
  );
};