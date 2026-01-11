import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/api/integrations";
import { useLocation } from "react-router-dom";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const [formData, setFormData] = useState({
    voornaam: '',
    achternaam: '',
    email: '',
    telefoonnummer: '',
    adres: ''
  });

  const { toast } = useToast();
  const { t: tFromHook, language } = useTranslation();

  // Check current route to highlight active nav item
  const currentPath = location.pathname;
  const isActiveRoute = (path) => {
    if (path === 'Settings') return currentPath === createPageUrl('Settings');
    return currentPath === createPageUrl(path);
  };

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    loadUser();
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        voornaam: userData.voornaam || '',
        achternaam: userData.achternaam || '',
        email: userData.email || '',
        telefoonnummer: userData.telefoonnummer || '',
        adres: userData.adres || ''
      });
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate form data
      if (!formData.voornaam || formData.voornaam.trim() === '') {
        toast({
          variant: 'destructive',
          title: 'Naam is verplicht'
        });
        return;
      }

      // Prepare data - only send fields that exist
      const updateData = {};
      if (formData.voornaam) updateData.voornaam = formData.voornaam.trim();
      if (formData.achternaam) updateData.achternaam = formData.achternaam.trim();
      if (formData.telefoonnummer) updateData.telefoonnummer = formData.telefoonnummer.trim();
      if (formData.adres) updateData.adres = formData.adres.trim();

      await User.updateMe(updateData);
      toast({ title: 'Profiel succesvol bijgewerkt!' });
      setEditing(false);
      await loadUser();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij bijwerken van profiel',
        description: error.message || 'Probeer het opnieuw'
      });
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      toast({ title: 'Foto uploaden...' });

      const { file_url } = await UploadFile({ file });

      await User.updateMe({ profielfoto_url: file_url });
      toast({ title: 'Foto succesvol geüpload!' });

      loadUser();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij uploaden foto'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Weet je zeker dat je je profielfoto wilt verwijderen?')) return;
    
    try {
      await User.updateMe({ profielfoto_url: null });
      toast({ title: 'Foto verwijderd' });
      loadUser();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        variant: 'destructive',
        title: 'Fout bij verwijderen foto'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[#9CA3AF]"></div>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mt-4">Laden...</p>
        </div>
      </div>
    );
  }

  const fullName = user?.voornaam && user?.achternaam 
    ? `${user.voornaam} ${user.achternaam}` 
    : user?.voornaam || user?.full_name || user?.email?.split('@')[0] || 'Gebruiker';

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a]">
      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8">
        <div className="w-full max-w-[1400px] flex flex-col gap-6">
          {/* Page Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary dark:text-primary text-3xl">settings</span>
                <h1 className="text-[#0d1b17] dark:text-white text-3xl md:text-4xl font-black tracking-tight">Instellingen</h1>
              </div>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base font-normal pl-11">Beheer je profiel, notificaties en app-voorkeuren</p>
            </div>
            <button 
              className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-[#0d1b17] dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors shadow-sm"
              onClick={() => window.location.href = createPageUrl('HelpSupport')}
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
              <span>Hulp</span>
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-1/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-4 lg:p-6 flex flex-col sticky top-24">
              <nav className="flex flex-col gap-2">
                <a
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Settings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('Settings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Settings') ? 'fill-1' : ''}`} style={isActiveRoute('Settings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    account_circle
                  </span>
                  <span className={`text-sm ${isActiveRoute('Settings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Mijn Profiel</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('SecuritySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('SecuritySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('SecuritySettings') ? 'fill-1' : ''}`} style={isActiveRoute('SecuritySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    shield
                  </span>
                  <span className={`text-sm ${isActiveRoute('SecuritySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Account & Beveiliging</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('NotificationSettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('NotificationSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('NotificationSettings') ? 'fill-1' : ''}`} style={isActiveRoute('NotificationSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    notifications
                  </span>
                  <span className={`text-sm ${isActiveRoute('NotificationSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Notificaties</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('DisplaySettings')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('DisplaySettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('DisplaySettings') ? 'fill-1' : ''}`} style={isActiveRoute('DisplaySettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    tune
                  </span>
                  <span className={`text-sm ${isActiveRoute('DisplaySettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>App Voorkeuren</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('VTLBSettings')
                      ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('VTLBSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('VTLBSettings') ? 'fill-1' : ''}`} style={isActiveRoute('VTLBSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    calculate
                  </span>
                  <span className={`text-sm ${isActiveRoute('VTLBSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>VTLB Berekening</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('Privacy')
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/20 dark:border-primary/30'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('Privacy')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('Privacy') ? 'fill-1' : ''}`} style={isActiveRoute('Privacy') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    lock
                  </span>
                  <span className={`text-sm ${isActiveRoute('Privacy') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Privacy</span>
                </a>
                <div className="mt-4 pt-2 px-4 pb-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Hulp & Support</h3>
                </div>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('HelpSupport')
                      ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('HelpSupport')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('HelpSupport') ? 'fill-1' : ''}`} style={isActiveRoute('HelpSupport') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help
                  </span>
                  <span className={`text-sm ${isActiveRoute('HelpSupport') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Help Center</span>
                </a>
                <a 
                  className={`group flex items-center gap-4 px-4 py-3 rounded-[24px] transition-all ${
                    isActiveRoute('FAQSettings')
                      ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary dark:border dark:border-primary/20'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white'
                  }`}
                  href={createPageUrl('FAQSettings')}
                >
                  <span className={`material-symbols-outlined ${isActiveRoute('FAQSettings') ? 'fill-1' : ''}`} style={isActiveRoute('FAQSettings') ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    help_outline
                  </span>
                  <span className={`text-sm ${isActiveRoute('FAQSettings') ? 'font-bold' : 'font-medium group-hover:font-semibold'}`}>Veelgestelde Vragen</span>
                </a>
                <a 
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  href={createPageUrl('TermsOfService')}
                >
                  <span className="material-symbols-outlined">description</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Algemene Voorwaarden</span>
                </a>
                <a 
                  className="group flex items-center gap-4 px-4 py-3 rounded-[24px] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:text-primary dark:hover:text-white transition-all"
                  href={createPageUrl('PrivacyPolicy')}
                >
                  <span className="material-symbols-outlined">policy</span>
                  <span className="font-medium text-sm group-hover:font-semibold">Privacybeleid</span>
                </a>
              </nav>
            </aside>

            {/* Main Content Section */}
            <section className="w-full lg:w-3/4 bg-white dark:bg-[#1a1a1a] rounded-[24px] lg:rounded-[24px] shadow-soft dark:shadow-soft border border-[#E5E7EB] dark:border-[#2a2a2a] p-6 md:p-8 lg:p-10">
                <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2a2a2a] pb-6 mb-8">
                <h2 className="text-[#0d1b17] dark:text-white text-2xl font-bold">Mijn Profiel</h2>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm md:text-base mt-1">Update je persoonlijke informatie en beheer hoe anderen je zien.</p>
              </div>

              {/* Profile Photo Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
                <div className="relative group cursor-pointer">
                  <div 
                    className="size-24 md:size-32 rounded-full bg-cover bg-center border-4 border-[#E5E7EB] dark:border-[#2a2a2a] shadow-sm"
                    style={{
                      backgroundImage: user?.profielfoto_url ? `url(${user.profielfoto_url})` : 'none',
                      backgroundColor: user?.profielfoto_url ? 'transparent' : '#8B5CF6'
                    }}
                  >
                    {!user?.profielfoto_url && (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                        {(user?.voornaam?.[0] || user?.email?.[0] || 'R').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => document.getElementById('photo-upload').click()}
                  >
                    <span className="material-symbols-outlined text-white">edit</span>
                  </div>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
                </div>
                <div className="flex flex-col items-center sm:items-start pt-2 gap-3">
                  <h3 className="text-[#0d1b17] dark:text-white font-bold text-lg">Profielafbeelding</h3>
                  <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm text-center sm:text-left max-w-xs">Upload een nieuwe foto. JPG, GIF of PNG formaat. Maximaal 2MB.</p>
                  <div className="flex gap-3 mt-1">
                    <button 
                      className="px-5 py-2.5 bg-gray-100 dark:bg-[#2A3F36] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-[#0d1b17] dark:text-white rounded-full text-sm font-bold transition-colors"
                onClick={() => document.getElementById('photo-upload').click()}
                disabled={uploading}
              >
                      {uploading ? 'Uploaden...' : 'Nieuwe foto uploaden'}
                    </button>
                    {user?.profielfoto_url && (
                      <button 
                        aria-label="Delete photo" 
                        className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                        onClick={handleDeletePhoto}
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                    </div>
                  </div>
              </div>

              {/* Form */}
              <form 
                className="flex flex-col gap-6 max-w-2xl"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-[#0d1b17] dark:text-white font-semibold text-sm">Naam</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px]">person</span>
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] focus:border-primary focus:ring focus:ring-primary/20 bg-gray-50 dark:bg-[#2A3F36] text-[#0d1b17] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#9CA3AF] font-medium transition-all"
                        placeholder="Jouw naam" 
                        type="text" 
                    value={formData.voornaam}
                    onChange={(e) => setFormData({...formData, voornaam: e.target.value})}
                        disabled={!editing}
                  />
                </div>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">E-mailadres</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px]">mail</span>
                </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] focus:border-primary focus:ring focus:ring-primary/20 bg-gray-50 dark:bg-[#2A3F36] text-[#0d1b17] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#9CA3AF] font-medium transition-all"
                        placeholder="jouw@email.nl" 
                    type="email"
                    value={formData.email}
                    disabled
                  />
                </div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">Telefoonnummer</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px]">call</span>
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] focus:border-primary focus:ring focus:ring-primary/20 bg-gray-50 dark:bg-[#2A3F36] text-[#0d1b17] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#9CA3AF] font-medium transition-all"
                        placeholder="+31 6 ..." 
                        type="tel" 
                        value={formData.telefoonnummer}
                        onChange={(e) => setFormData({...formData, telefoonnummer: e.target.value})}
                        disabled={!editing}
                  />
                </div>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-gray-900 dark:text-white font-semibold text-sm">Adres</span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px]">home</span>
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] focus:border-primary focus:ring focus:ring-primary/20 bg-gray-50 dark:bg-[#2A3F36] text-[#0d1b17] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#9CA3AF] font-medium transition-all"
                        placeholder="Straat en huisnummer" 
                        type="text" 
                    value={formData.adres}
                    onChange={(e) => setFormData({...formData, adres: e.target.value})}
                        disabled={!editing}
                  />
                </div>
                  </label>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-gray-900 dark:text-white font-semibold text-sm">Wachtwoord</span>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px]">lock</span>
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 rounded-full border border-[#E5E7EB] dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#2A3F36] text-[#6B7280] dark:text-[#9CA3AF] font-medium cursor-not-allowed"
                        disabled 
                        placeholder="********" 
                        type="password" 
                  />
                </div>
          <button
                      className="px-6 py-3 border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-full font-bold text-[#0d1b17] dark:text-white hover:bg-gray-50 dark:hover:bg-[#2a2a2a] hover:border-[#D1D5DB] dark:hover:border-[#3A4F46] transition-colors whitespace-nowrap"
                      type="button"
            onClick={() => window.location.href = createPageUrl('SecuritySettings')}
                    >
                      Wijzig
          </button>
              </div>
            </div>
                <div className="flex items-center justify-end pt-8 mt-4 border-t border-[#E5E7EB] dark:border-[#2a2a2a]">
                  {editing ? (
                    <>
          <button
                        className="text-[#6B7280] dark:text-[#9CA3AF] font-semibold text-sm mr-6 hover:text-[#0d1b17] dark:hover:text-white transition-colors" 
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          loadUser();
                        }}
                      >
                        Annuleren
          </button>
          <button
                        className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-bold shadow-md shadow-primary/20 transition-all transform active:scale-95" 
                        type="submit"
                      >
                        Wijzigingen opslaan
          </button>
                </>
              ) : (
                    <button 
                      className="px-8 py-3 bg-konsensi-green hover:bg-konsensi-green-light text-white rounded-full font-bold shadow-md shadow-green-500/20 transition-all transform active:scale-95" 
                      type="button"
                      onClick={() => setEditing(true)}
                    >
                      Profiel bewerken
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
