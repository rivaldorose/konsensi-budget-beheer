import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Translation } from '@/api/entities';
import { User } from '@/api/entities';

const LanguageContext = createContext();

// Fallback translations for missing keys
const fallbackTranslations = {
  'common.pleaseWait': {
    nl: 'Even geduld...',
    en: 'Please wait...',
    es: 'Por favor espera...',
    pl: 'Proszę czekać...',
    de: 'Bitte warten...',
    fr: 'Veuillez patienter...',
    tr: 'Lütfen bekleyin...',
    ar: 'يرجى الانتظار...'
  },
  'nav.adempauze': {
    nl: 'Adempauze',
    en: 'Breathing Space',
    es: 'Respiro',
    pl: 'Chwila oddechu',
    de: 'Atempause',
    fr: 'Pause',
    tr: 'Nefes Molası',
    ar: 'فترة راحة'
  },
  'notifications.title': {
    nl: 'Meldingen',
    en: 'Notifications',
    es: 'Notificaciones',
    pl: 'Powiadomienia',
    de: 'Benachrichtigungen',
    fr: 'Notifications',
    tr: 'Bildirimler',
    ar: 'الإشعارات'
  },
  'notifications.noNew': {
    nl: 'Geen nieuwe meldingen',
    en: 'No new notifications',
    es: 'No hay notificaciones nuevas',
    pl: 'Brak nowych powiadomień',
    de: 'Keine neuen Benachrichtigungen',
    fr: 'Aucune nouvelle notification',
    tr: 'Yeni bildirim yok',
    ar: 'لا توجد إشعارات جديدة'
  },
  'profile.accountDetails': {
    nl: 'Accountgegevens',
    en: 'Account Details',
    es: 'Detalles de la cuenta',
    pl: 'Szczegóły konta',
    de: 'Kontodetails',
    fr: 'Détails du compte',
    tr: 'Hesap Detayları',
    ar: 'تفاصيل الحساب'
  },
  'nav.settings': {
    nl: 'Instellingen',
    en: 'Settings',
    es: 'Configuración',
    pl: 'Ustawienia',
    de: 'Einstellungen',
    fr: 'Paramètres',
    tr: 'Ayarlar',
    ar: 'الإعدادات'
  },
  'profile.logout': {
    nl: 'Uitloggen',
    en: 'Logout',
    es: 'Cerrar sesión',
    pl: 'Wyloguj',
    de: 'Abmelden',
    fr: 'Déconnexion',
    tr: 'Çıkış Yap',
    ar: 'تسجيل الخروج'
  },
  'common.chooseLanguage': {
    nl: 'Kies taal',
    en: 'Choose language',
    es: 'Elegir idioma',
    pl: 'Wybierz język',
    de: 'Sprache wählen',
    fr: 'Choisir la langue',
    tr: 'Dil seç',
    ar: 'اختر اللغة'
  },
  'addmodal.add': {
    nl: 'Toevoegen',
    en: 'Add',
    es: 'Añadir',
    pl: 'Dodaj',
    de: 'Hinzufügen',
    fr: 'Ajouter',
    tr: 'Ekle',
    ar: 'إضافة'
  }
};

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

    // First check database translations, then fallback translations
    const translationSet = translations[key] || fallbackTranslations[key];
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