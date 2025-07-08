import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, AlertTriangle, FileText, Users, Calendar, Settings } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const tabs = [
    { 
      id: "home", 
      label: "Home", 
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
      label: "Reports", 
      icon: FileText, 
      badge: null 
    },
    { 
      id: "groups", 
      label: "Group Up", 
      icon: Users, 
      badge: null 
    },
    { 
      id: "schedule", 
      label: "Schedule", 
      icon: Calendar, 
      badge: null 
    },
    { 
      id: "settings", 
      label: "Settings", 
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
                ${isActive 
                  ? 'text-chicago-blue bg-chicago-blue/12 shadow-[var(--shadow-interactive)] scale-105 border-2 border-white' 
                  : 'text-muted-foreground hover:text-chicago-blue hover:bg-chicago-blue/8 hover:scale-105 active:scale-95 hover:shadow-[var(--shadow-soft)] hover:border-2 hover:border-white'
                }
                ${tab.priority ? 'hover:shadow-[var(--shadow-emergency)]' : ''}
              `}
            >
              {/* Active state background gradient */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-b from-chicago-blue/8 to-chicago-blue/12 rounded-2xl animate-fade-in"></div>
              )}
              
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