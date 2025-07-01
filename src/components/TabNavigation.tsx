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
    { id: "groups", label: "Groups", emoji: "👥" },
    { id: "schedule", label: "Schedule", emoji: "🚊" },
    { id: "settings", label: "Settings", emoji: "⚙️" },
  ];

  return (
    <div className="flex justify-around bg-white border-t border-border py-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`
              flex flex-col items-center gap-1 h-auto py-2 px-3
              ${isActive 
                ? 'text-chicago-blue bg-chicago-light-blue/20' 
                : 'text-muted-foreground hover:text-chicago-blue'
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