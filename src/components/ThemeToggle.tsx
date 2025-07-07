import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="chicago-outline"
      size="default"
      onClick={toggleTheme}
      className="flex items-center gap-2 shadow-md"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Light Mode</span>
        </>
      )}
    </Button>
  );
};