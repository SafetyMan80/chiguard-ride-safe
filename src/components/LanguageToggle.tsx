import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className="h-10 w-auto px-2 hover:bg-accent"
      aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
    >
      <Languages className="h-4 w-4" />
      <span className="ml-1.5 text-xs font-medium">
        {language === 'en' ? 'ES' : 'EN'}
      </span>
    </Button>
  );
};