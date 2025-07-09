import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

export const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-10 px-3 hover:bg-accent flex items-center gap-2"
      aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
    >
      <span className="text-base">
        {language === 'en' ? '🇺🇸' : '🇪🇸'}
      </span>
      <span className="text-sm font-medium">
        {language === 'en' ? 'English' : 'Español'}
      </span>
    </Button>
  );
};