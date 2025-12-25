import React, { useState, useEffect } from 'react';
import { ChevronLeft, Shield, Lock, Smartphone, Key, LogOut, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { User } from '@/api/entities';
import { SecuritySettings as SecuritySettingsEntity } from '@/api/entities';
import { useToast } from '@/components/ui/toast';
import { createPageUrl } from '@/utils';

export default function SecuritySettings() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        const existing = await SecuritySettingsEntity.filter({ created_by: userData.email });
        if (existing.length > 0) {
          const s = existing[0];
          setSettings(s);
          setTwoFactorEnabled(s.two_factor_enabled ?? false);
          setBiometricEnabled(s.biometric_login ?? false);
        }
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    };
    loadData();
  }, []);

  const handleBack = () => {
    window.location.href = createPageUrl('Settings');
  };

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast({ title: 'Wachtwoorden komen niet overeen', variant: 'destructive' });
      return;
    }
    toast({ 
      title: 'Wachtwoord wijzigen', 
      description: 'Je ontvangt een email met instructies om je wachtwoord te wijzigen' 
    });
    setShowPasswordForm(false);
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;
    setTwoFactorEnabled(newValue);
    try {
      const data = { two_factor_enabled: newValue };
      if (settings?.id) {
        await SecuritySettingsEntity.update(settings.id, data);
      } else {
        const created = await SecuritySettingsEntity.create({ ...data, created_by: user.email });
        setSettings(created);
      }
      toast({ title: 'Instellingen opgeslagen' });
    } catch (error) {
      console.error('Error saving 2FA:', error);
      setTwoFactorEnabled(!newValue);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    }
  };

  const handleToggleBiometric = async () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    try {
      const data = { biometric_login: newValue };
      if (settings?.id) {
        await SecuritySettingsEntity.update(settings.id, data);
      } else {
        const created = await SecuritySettingsEntity.create({ ...data, created_by: user.email });
        setSettings(created);
      }
      toast({ title: 'Instellingen opgeslagen' });
    } catch (error) {
      console.error('Error saving biometric:', error);
      setBiometricEnabled(!newValue);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    }
  };

  const handleLogoutAll = async () => {
    const confirmed = window.confirm('Weet je zeker dat je wilt uitloggen op alle apparaten?');
    if (confirmed) {
      try {
        await User.logout();
        window.location.href = createPageUrl('Onboarding');
      } catch (error) {
        console.error('Error logging out:', error);
        toast({ title: 'Fout bij uitloggen', variant: 'destructive' });
      }
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

  const PasswordInput = ({ label, value, onChange, show, onToggleShow }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );

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
            <Shield className="w-5 h-5" />
            Beveiliging
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Wachtwoord
            </h2>
          </div>
          
          {!showPasswordForm ? (
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Wachtwoord wijzigen gaat via email
              </p>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                Wachtwoord wijzigen
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <PasswordInput
                label="Huidig wachtwoord"
                value={passwords.current}
                onChange={(val) => setPasswords(prev => ({ ...prev, current: val }))}
                show={showPasswords.current}
                onToggleShow={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              />
              <PasswordInput
                label="Nieuw wachtwoord"
                value={passwords.new}
                onChange={(val) => setPasswords(prev => ({ ...prev, new: val }))}
                show={showPasswords.new}
                onToggleShow={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              />
              <PasswordInput
                label="Bevestig nieuw wachtwoord"
                value={passwords.confirm}
                onChange={(val) => setPasswords(prev => ({ ...prev, confirm: val }))}
                show={showPasswords.confirm}
                onToggleShow={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              />
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                >
                  Opslaan
                </button>
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswords({ current: '', new: '', confirm: '' });
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuleren
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Twee-factor authenticatie
            </h2>
          </div>
          <div className="p-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">2FA inschakelen</h3>
              <p className="text-sm text-gray-500">
                Extra beveiligingslaag met authenticatie-app zoals Google Authenticator
              </p>
            </div>
            <Toggle
              enabled={twoFactorEnabled}
              onToggle={handleToggle2FA}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Biometrische verificatie
            </h2>
          </div>
          <div className="p-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Face ID / Touch ID</h3>
              <p className="text-sm text-gray-500">
                Log in met gezichtsherkenning of vingerafdruk
              </p>
            </div>
            <Toggle
              enabled={biometricEnabled}
              onToggle={handleToggleBiometric}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Actieve sessies</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Huidig apparaat</p>
                <p className="text-sm text-gray-500">Nu actief</p>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                Actief
              </span>
            </div>
            
            <button
              onClick={handleLogoutAll}
              className="w-full mt-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Uitloggen op alle apparaten
            </button>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Gevaarlijke zone</h3>
              <p className="text-sm text-red-700 mb-3">
                Deze acties kunnen niet ongedaan worden gemaakt
              </p>
              <button 
                onClick={() => toast({ title: 'Binnenkort beschikbaar' })}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Account verwijderen
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}