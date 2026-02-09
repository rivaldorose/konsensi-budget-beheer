
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from './LanguageContext';
import { Globe } from 'lucide-react';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';


const languages = [
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export default function LanguageSelector({ variant = 'default' }) {
  const { language, changeLanguage, t } = useTranslation();
  const { toast } = useToast();

  const handleLanguageChange = async (newLang) => {
    // Immediately update the UI language
    changeLanguage(newLang);

    try {
        const user = await User.me();
        if (user && user.id) { // Ensure user and user.id exist before attempting to update
            await User.updateMe({ language_preference: newLang });
            toast({
                title: t('settings.languageUpdated'),
                description: t('settings.languageRefresh'),
            });
            // Force a reload to apply the new language everywhere
            setTimeout(() => window.location.reload(), 1500);
        } else {
            // If user is not logged in, just change the language locally
            toast({
              title: t('settings.languageUpdated'),
              description: t('settings.languageLocalChange'),
            });
        }
    } catch (error) {
        console.error("Error updating language preference:", error);
        toast({
            title: t('common.error'),
            description: t('settings.languageError'),
            variant: "destructive",
        });
    }
  };

  if (variant === 'compact') {
    return (
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full border-0 bg-transparent hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-2xl">{languages.find(l => l.code === language)?.flag}</span>
            <span className="text-sm font-medium text-gray-700">
              {languages.find(l => l.code === language)?.name}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-full">
        <SelectValue>
          <div className="flex items-center gap-2">
            <span className="text-xl">{languages.find(l => l.code === language)?.flag}</span>
            <span>{languages.find(l => l.code === language)?.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
