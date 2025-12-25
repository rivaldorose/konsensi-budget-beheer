
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Globe, Loader2 } from 'lucide-react';
import { User } from '@/api/entities';
import { useTranslation } from '@/components/utils/LanguageContext';
import { useToast } from '@/components/ui/toast';
import { createPageUrl } from '@/utils';

export default function LanguageSettings() {
  const { language, changeLanguage, t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const languages = [
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true }
  ];

  const handleBack = () => {
    window.location.href = createPageUrl('Settings');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({ language_preference: selectedLanguage });
      changeLanguage(selectedLanguage);
      toast({ title: "Taal bijgewerkt!", variant: "success" });
      setTimeout(() => {
        window.location.href = createPageUrl('Settings');
      }, 500);
    } catch (error) {
      console.error('Error saving language:', error);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Terug</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Taal
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Kies je voorkeurstaal</h2>
            <p className="text-sm text-gray-500">
              De app wordt weergegeven in de geselecteerde taal. Sommige functies kunnen nog niet in alle talen beschikbaar zijn.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                  selectedLanguage === lang.code ? 'bg-emerald-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lang.flag}</span>
                  <span className={`font-medium ${
                    selectedLanguage === lang.code ? 'text-emerald-700' : 'text-gray-900'
                  }`}>
                    {lang.name}
                  </span>
                </div>
                {selectedLanguage === lang.code && (
                  <Check className="w-5 h-5 text-emerald-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opslaan...
              </>
            ) : (
              'Opslaan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
