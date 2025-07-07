import { Button } from "@/components/ui/button";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const tabs = [
    { id: "home", label: "Home", emoji: "🏠" },
    { id: "emergency", label: "SOS", emoji: "🆘" },
    { id: "incidents", label: "Reports", emoji: "📢" },
    { id: "groups", label: "Group Up", emoji: "👥" },
    { id: "schedule", label: "Schedule", emoji: "🚊" },
    { id: "settings", label: "Settings", emoji: "⚙️" },
  ];

  return (
    <div className="flex justify-around py-2 px-1 bg-background/95 backdrop-blur-md border-t border-border/50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center gap-1 h-auto py-3 px-3 min-h-[68px] min-w-[52px] justify-center
              touch-target rounded-2xl transition-all duration-300 ease-out relative
              ${isActive 
                ? 'text-chicago-blue bg-chicago-blue/10 shadow-[var(--shadow-interactive)] scale-105 border border-chicago-blue/20' 
                : 'text-muted-foreground hover:text-chicago-blue hover:bg-muted/30 hover:scale-105 active:scale-95'
              }
            `}
          >
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-b from-chicago-blue/5 to-chicago-blue/10 rounded-2xl"></div>
            )}
            <span className={`text-lg relative z-10 ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
              {tab.emoji}
            </span>
            <span className={`text-xs font-medium relative z-10 ${isActive ? 'font-semibold' : ''}`}>
              {tab.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
};