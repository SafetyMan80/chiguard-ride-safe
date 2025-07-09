import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, AlertTriangle, FileText, Users, Calendar, Settings } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const { t } = useLanguage();
  
  const tabs = [
    { 
      id: "home", 
      label: t("Home"), 
      icon: Home, 
      badge: null 
    },
    { 
      id: "emergency", 
      label: "SOS", 
      icon: AlertTriangle, 
      badge: "⚡",
      priority: true
    },
    { 
      id: "incidents", 
      label: t("Reports"), 
      icon: FileText, 
      badge: null 
    },
    { 
      id: "groups", 
      label: t("Group Up"), 
      icon: Users, 
      badge: null 
    },
    { 
      id: "schedule", 
      label: t("Schedule"), 
      icon: Calendar, 
      badge: null 
    },
    { 
      id: "settings", 
      label: t("Settings"), 
      icon: Settings, 
      badge: null 
    },
  ];

  return (
    <div className="flex justify-around py-3 px-2 bg-background/98 backdrop-blur-xl border-t border-border/50 shadow-[var(--shadow-floating)]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <div key={tab.id} className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center gap-1.5 h-auto py-2 px-2 min-h-[60px] min-w-[48px] justify-center
                touch-target-large rounded-2xl transition-all duration-300 ease-out relative group
                bg-transparent hover:bg-transparent active:bg-transparent focus:bg-transparent
                ${isActive 
                  ? 'text-chicago-blue shadow-[var(--shadow-interactive)] scale-105 border-2 border-black dark:border-white' 
                  : 'text-muted-foreground hover:text-chicago-blue hover:scale-105 active:scale-95 hover:shadow-[var(--shadow-soft)] hover:border-2 hover:border-black dark:hover:border-white border-2 border-transparent'
                }
                ${tab.priority ? 'hover:shadow-[var(--shadow-emergency)]' : ''}
              `}
            >
              
              {/* Icon with enhanced styling */}
              <div className={`relative z-10 transition-all duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon 
                  size={20} 
                  className={`${isActive ? 'text-chicago-blue' : ''} ${tab.priority && !isActive ? 'text-chicago-red' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              
              {/* Label with improved typography */}
              <span className={`
                text-xs font-medium relative z-10 transition-all duration-200
                ${isActive ? 'font-semibold text-chicago-blue' : ''}
              `}>
                {tab.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-chicago-blue rounded-full animate-fade-in"></div>
              )}
            </Button>
            
          </div>
        );
      })}
    </div>
  );
};