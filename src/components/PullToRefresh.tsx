import { RefreshCw, ChevronDown } from "lucide-react";

interface PullToRefreshProps {
  isRefreshing: boolean;
  pullDistance: number;
  isPulling: boolean;
  threshold: number;
}

export const PullToRefresh = ({ 
  isRefreshing, 
  pullDistance, 
  isPulling, 
  threshold 
}: PullToRefreshProps) => {
  const opacity = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  if (!isPulling && !isRefreshing) return null;

  return (
    <div 
      className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center bg-chicago-accent/95 backdrop-blur-sm border-b border-chicago-blue/20 transition-all duration-300 z-50"
      style={{ 
        height: Math.max(pullDistance, isRefreshing ? 80 : 0),
        opacity: isRefreshing ? 1 : opacity
      }}
    >
      <div className="flex flex-col items-center space-y-2 text-chicago-blue">
        {isRefreshing ? (
          <>
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-sm font-medium">Getting latest version...</p>
          </>
        ) : shouldTrigger ? (
          <>
            <ChevronDown className="w-6 h-6 animate-bounce" />
            <p className="text-sm font-medium">Release to refresh</p>
          </>
        ) : (
          <>
            <ChevronDown 
              className="w-6 h-6 transition-transform duration-200" 
              style={{ transform: `rotate(${Math.min(pullDistance / threshold * 180, 180)}deg)` }}
            />
            <p className="text-sm font-medium">Pull for latest version</p>
          </>
        )}
      </div>
    </div>
  );
};