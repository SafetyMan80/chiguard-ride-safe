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
    { id: "groups", label: "University", emoji: "🎓" },
    { id: "general", label: "General", emoji: "👥" },
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
              flex flex-col items-center gap-1 h-auto py-2 px-2 min-h-[60px] justify-center
              ${isActive 
                ? 'text-chicago-blue bg-chicago-light-blue/20 dark:bg-chicago-blue/20' 
                : 'text-muted-foreground hover:text-chicago-blue hover:bg-muted/50'
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