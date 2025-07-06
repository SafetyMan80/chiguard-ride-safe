import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-4 h-4" />
          Dark Mode
        </>
      ) : (
        <>
          <Sun className="w-4 h-4" />
          Light Mode
        </>
      )}
    </Button>
  );
};