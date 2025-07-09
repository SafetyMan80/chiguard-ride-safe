import { ReactNode, useState, useEffect } from 'react';
import { LanguageContext, Language } from '@/hooks/useLanguage';
import { translations } from '@/data/translations';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('railsavior-language') as Language;
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('railsavior-language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  const t = (key: string) => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};