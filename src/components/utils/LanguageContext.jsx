import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Translation } from '@/api/entities';
import { User } from '@/api/entities';

const LanguageContext = createContext();

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('nl');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [translationData, user] = await Promise.all([
          Translation.list(undefined, 1000).catch(() => []),
          User.me().catch(() => null)
        ]);

        const formatted = translationData.reduce((acc, item) => {
          acc[item.key] = {
            nl: item.nl,
            en: item.en,
            es: item.es,
            pl: item.pl,
            de: item.de,
            fr: item.fr,
            tr: item.tr,
            ar: item.ar,
          };
          return acc;
        }, {});
        setTranslations(formatted);

        if (user && user.language_preference) {
          setLanguage(user.language_preference);
          
          // Set RTL for Arabic
          if (user.language_preference === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
          } else {
            document.documentElement.setAttribute('dir', 'ltr');
          }
        }
      } catch (error) {
        console.error("Failed to bootstrap language context:", error);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    
    // Set RTL for Arabic
    if (lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }, []);

  const t = useCallback((key, options = {}) => {
    if (loading) return '...'; 

    const translationSet = translations[key];
    let translation = translationSet ? (translationSet[language] || translationSet['nl']) : key;

    if (!translationSet) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    
    if (translation) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{${optionKey}}`, options[optionKey]);
      });
    }

    return translation || key;
  }, [language, translations, loading]);

  const value = { language, changeLanguage, t, translations, loading };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 mx-auto"></div>
                <p className="text-gray-600 text-sm mt-4">Instellingen laden...</p>
            </div>
        </div>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}