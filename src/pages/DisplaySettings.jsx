import React, { useState, useEffect } from 'react';
import { ChevronLeft, Palette, Sun, Moon, Monitor, Type, Smartphone, Check, Loader2 } from 'lucide-react';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/toast';
import { createPageUrl } from '@/utils';

export default function DisplaySettings() {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [accentColor, setAccentColor] = useState('emerald');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await User.me();
        if (user.display_settings) {
          const settings = typeof user.display_settings === 'string' 
            ? JSON.parse(user.display_settings) 
            : user.display_settings;
          setTheme(settings.theme || 'light');
          setFontSize(settings.fontSize || 'medium');
          setCompactMode(settings.compactMode || false);
          setAnimationsEnabled(settings.animationsEnabled ?? true);
          setAccentColor(settings.accentColor || 'emerald');
        }
      } catch (error) {
        console.error('Error loading display settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleBack = () => {
    window.location.href = createPageUrl('Settings');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = {
        theme,
        fontSize,
        compactMode,
        animationsEnabled,
        accentColor
      };
      await User.updateMyUserData({ display_settings: settings });
      toast({ title: 'Weergave instellingen opgeslagen', variant: 'success' });
      setTimeout(() => {
        window.location.href = createPageUrl('Settings');
      }, 500);
    } catch (error) {
      console.error('Error saving display settings:', error);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  const themes = [
    {
      id: 'light',
      name: 'Licht',
      icon: Sun,
      description: 'Klassieke lichte interface',
      preview: 'bg-gradient-to-br from-white to-gray-100'
    },
    {
      id: 'dark',
      name: 'Donker',
      icon: Moon,
      description: 'Oogvriendelijk voor \'s avonds',
      preview: 'bg-gradient-to-br from-gray-800 to-gray-900'
    },
    {
      id: 'auto',
      name: 'Automatisch',
      icon: Monitor,
      description: 'Volgt je systeeminstellingen',
      preview: 'bg-gradient-to-br from-blue-100 to-purple-100'
    }
  ];

  const fontSizes = [
    { id: 'small', label: 'Klein', size: 'text-sm' },
    { id: 'medium', label: 'Normaal', size: 'text-base' },
    { id: 'large', label: 'Groot', size: 'text-lg' }
  ];

  const colors = [
    { name: 'Groen', id: 'emerald', color: 'bg-emerald-500' },
    { name: 'Blauw', id: 'blue', color: 'bg-blue-500' },
    { name: 'Paars', id: 'purple', color: 'bg-purple-500' },
    { name: 'Roze', id: 'pink', color: 'bg-pink-500' },
    { name: 'Oranje', id: 'orange', color: 'bg-orange-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
      </div>
    );
  }

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
            <Palette className="w-5 h-5" />
            Weergave
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Thema</h2>
            <p className="text-sm text-gray-500 mt-1">Kies hoe de app eruitziet</p>
          </div>
          <div className="p-4 grid gap-3">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.id}
                  onClick={() => setTheme(themeOption.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === themeOption.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-lg ${themeOption.preview} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${theme === themeOption.id ? 'text-emerald-600' : 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className={`font-semibold ${theme === themeOption.id ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {themeOption.name}
                      </h3>
                      <p className="text-sm text-gray-500">{themeOption.description}</p>
                    </div>
                    {theme === themeOption.id && (
                      <Check className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Type className="w-5 h-5" />
              Tekstgrootte
            </h2>
            <p className="text-sm text-gray-500 mt-1">Pas de grootte van tekst aan</p>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              {fontSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setFontSize(size.id)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    fontSize === size.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`font-semibold mb-2 ${size.size} ${fontSize === size.id ? 'text-emerald-700' : 'text-gray-900'}`}>
                    Aa
                  </div>
                  <div className={`text-sm ${fontSize === size.id ? 'text-emerald-600' : 'text-gray-600'}`}>
                    {size.label}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className={`${fontSizes.find(s => s.id === fontSize)?.size} text-gray-700`}>
                Dit is een voorbeeld van hoe tekst eruitziet in de app met de geselecteerde grootte.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Weergave opties
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Compacte modus</h3>
                <p className="text-sm text-gray-500">
                  Toon meer informatie op het scherm met kleinere marges
                </p>
              </div>
              <Toggle
                enabled={compactMode}
                onToggle={() => setCompactMode(!compactMode)}
              />
            </div>
            
            <div className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">Animaties</h3>
                <p className="text-sm text-gray-500">
                  Schakel overgangen en animaties in of uit
                </p>
              </div>
              <Toggle
                enabled={animationsEnabled}
                onToggle={() => setAnimationsEnabled(!animationsEnabled)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Accentkleur</h2>
            <p className="text-sm text-gray-500 mt-1">Personaliseer de hoofdkleur van de app</p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-3">
              {colors.map((colorOption) => (
                <button
                  key={colorOption.id}
                  onClick={() => setAccentColor(colorOption.id)}
                  className={`relative w-full aspect-square rounded-lg ${colorOption.color} hover:scale-110 transition-transform ${
                    accentColor === colorOption.id ? 'ring-4 ring-gray-300' : ''
                  }`}
                  title={colorOption.name}
                >
                  {accentColor === colorOption.id && (
                    <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

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
  );
}