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
    <div className="flex justify-around py-3 px-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center gap-1 h-auto py-3 px-3 min-h-[64px] min-w-[48px] justify-center
              touch-target rounded-lg transition-all duration-200
              ${isActive 
                ? 'text-chicago-blue bg-chicago-light-blue/20 dark:bg-chicago-blue/20 scale-105' 
                : 'text-muted-foreground hover:text-chicago-blue hover:bg-muted/50 active:scale-95'
              }
            `}
          >
            <span className="text-lg">{tab.emoji}</span>
            <span className="text-xs">{tab.label}</span>
          </Button>
        );
      })}
    </div>
  );
};