
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { DebtPayment } from "@/api/entities"; // Added
import { Transaction } from "@/api/entities"; // Added
import { Debt } from "@/api/entities"; // Added
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Upload,
  Bell,
  Shield,
  Eye,
  CreditCard,
  Globe,
  LogOut,
  ChevronRight,
  DollarSign,
  Settings as SettingsIcon, // Added Settings icon for the new card
  Loader2, // Added
  CheckCircle2 // Added
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/api/integrations";

const settingsTranslations = {
  'settings.title': { nl: 'Instellingen', en: 'Settings', es: 'Configuración', pl: 'Ustawienia', de: 'Einstellungen', fr: 'Paramètres', tr: 'Ayarlar', ar: 'الإعدادات' },
  'settings.accountDetails': { nl: 'Accountgegevens', en: 'Account Details', es: 'Detalles de Cuenta', pl: 'Szczegóły Konta', de: 'Kontodetails', fr: 'Détails du Compte', tr: 'Hesap Detayları', ar: 'تفاصيل الحساب' },
  'settings.personalInfo': { nl: 'Persoonlijke Informatie', en: 'Personal Information', es: 'Información Personal', pl: 'Informacje Osobiste', de: 'Persönliche Informationen', fr: 'Informations Personnelles', tr: 'Kişisel Bilgiler', ar: 'المعلومات الشخصية' },
  'settings.firstName': { nl: 'Voornaam', en: 'First Name', es: 'Nombre', pl: 'Imię', de: 'Vorname', fr: 'Prénom', tr: 'Ad', ar: 'الاسم الأول' },
  'settings.lastName': { nl: 'Achternaam', en: 'Last Name', es: 'Apellido', pl: 'Nazwisko', de: 'Nachname', fr: 'Nom', tr: 'Soyad', ar: 'الاسم الأخير' },
  'settings.email': { nl: 'Email', en: 'Email', es: 'Correo', pl: 'Email', de: 'E-Mail', fr: 'Email', tr: 'E-posta', ar: 'البريد الإلكتروني' },
  'settings.phone': { nl: 'Telefoonnummer', en: 'Phone Number', es: 'Teléfono', pl: 'Numer Telefonu', de: 'Telefonnummer', fr: 'Téléphone', tr: 'Telefon', ar: 'رقم الهاتف' },
  'settings.birthdate': { nl: 'Geboortedatum', en: 'Birth Date', es: 'Fecha de Nacimiento', pl: 'Data Urodzenia', de: 'Geburtsdatum', fr: 'Date de Naissance', tr: 'Doğum Tarihi', ar: 'تاريخ الميلاد' },
  'settings.address': { nl: 'Adres', en: 'Address', es: 'Dirección', pl: 'Adres', de: 'Adresse', fr: 'Adresse', tr: 'Adres', ar: 'العنوان' },
  'settings.city': { nl: 'Stad', en: 'City', es: 'Ciudad', pl: 'Miasto', de: 'Stadt', fr: 'Ville', tr: 'Şehir', ar: 'المدينة' },
  'settings.postalCode': { nl: 'Postcode', en: 'Postal Code', es: 'Código Postal', pl: 'Kod Pocztowy', de: 'Postleitzahl', fr: 'Code Postal', tr: 'Posta Kodu', ar: 'الرمز البريدي' },
  'settings.country': { nl: 'Land', en: 'Country', es: 'País', pl: 'Kraj', de: 'Land', fr: 'Pays', tr: 'Ülke', ar: 'البلد' },
  'settings.editProfile': { nl: 'Profiel Bewerken', en: 'Edit Profile', es: 'Editar Perfil', pl: 'Edytuj Profil', de: 'Profil Bearbeiten', fr: 'Modifier Profil', tr: 'Profili Düzenle', ar: 'تعديل الملف الشخصي' },
  'settings.saveChanges': { nl: 'Wijzigingen Opslaan', en: 'Save Changes', es: 'Guardar Cambios', pl: 'Zapisz Zmiany', de: 'Änderungen Speichern', fr: 'Enregistrer', tr: 'Değişiklikleri Kaydet', ar: 'حفظ التغييرات' },
  'settings.cancel': { nl: 'Annuleren', en: 'Cancel', es: 'Cancelar', pl: 'Anuluj', de: 'Abbrechen', fr: 'Annuler', tr: 'İptal', ar: 'إلغاء' },
  'settings.profilePhoto': { nl: 'Profielfoto', en: 'Profile Photo', es: 'Foto de Perfil', pl: 'Zdjęcie Profilowe', de: 'Profilfoto', fr: 'Photo de Profil', tr: 'Profil Fotoğrafı', ar: 'صورة الملف الشخصي' },
  'settings.uploadPhoto': { nl: 'Foto Uploaden', en: 'Upload Photo', es: 'Subir Foto', pl: 'Prześlij Zdjęcie', de: 'Foto Hochladen', fr: 'Télécharger Photo', tr: 'Fotoğraf Yükle', ar: 'تحميل الصورة' },
  'settings.preferences': { nl: 'Voorkeuren', en: 'Preferences', es: 'Preferencias', pl: 'Preferencje', de: 'Präferenzen', fr: 'Préférences', tr: 'Tercihler', ar: 'التفضيلات' },
  'settings.notifications': { nl: 'Notificaties', en: 'Notifications', es: 'Notificaciones', pl: 'Powiadomienia', de: 'Benachrichtigungen', fr: 'Notifications', tr: 'Bildirimler', ar: 'الإشعارات' },
  'settings.security': { nl: 'Beveiliging', en: 'Security', es: 'Seguridad', pl: 'Bezpieczeństwo', de: 'Sicherheit', fr: 'Sécurité', tr: 'Güvenlik', ar: 'الأمان' },
  'settings.display': { nl: 'Weergave', en: 'Display', es: 'Pantalla', pl: 'Wyświetlanie', de: 'Anzeige', fr: 'Affichage', tr: 'Görünüm', ar: 'العرض' },
  'settings.payment': { nl: 'Betaling', en: 'Payment', es: 'Pago', pl: 'Płatność', de: 'Zahlung', fr: 'Paiement', tr: 'Ödeme', ar: 'الدفع' },
  'settings.language': { nl: 'Taal', en: 'Language', es: 'Idioma', pl: 'Język', de: 'Sprache', fr: 'Langue', tr: 'Dil', ar: 'اللغة' },
  'settings.logout': { nl: 'Uitloggen', en: 'Logout', es: 'Cerrar Sesión', pl: 'Wyloguj', de: 'Abmelden', fr: 'Déconnexion', tr: 'Çıkış', ar: 'تسجيل الخروج' },
  'settings.updateSuccess': { nl: 'Profiel succesvol bijgewerkt!', en: 'Profile updated successfully!', es: '¡Perfil actualizado exitosamente!', pl: 'Profil zaktualizowany pomyślnie!', de: 'Profil erfolgreich aktualisiert!', fr: 'Profil mis à jour avec succès!', tr: 'Profil başarıyla güncellendi!', ar: 'تم تحديث الملف الشخصي بنجاح!' },
  'settings.updateError': { nl: 'Fout bij bijwerken van profiel', en: 'Error updating profile', es: 'Error al actualizar perfil', pl: 'Błąd podczas aktualizacji profilu', de: 'Fehler beim Aktualisieren des Profils', fr: 'Erreur lors de la mise à jour du profil', tr: 'Profil güncellenirken hata', ar: 'خطأ في تحديث الملف الشخصي' },
  'settings.uploadingPhoto': { nl: 'Foto uploaden...', en: 'Uploading photo...', es: 'Subiendo foto...', pl: 'Przesyłanie zdjęcia...', de: 'Foto wird hochgeladen...', fr: 'Téléchargement de la photo...', tr: 'Fotoğraf yükleniyor...', ar: 'جارٍ تحميل الصورة...' },
  'settings.photoUploadSuccess': { nl: 'Foto succesvol geüpload!', en: 'Photo uploaded successfully!', es: '¡Foto subida exitosamente!', pl: 'Zdjęcie przesłane pomyślnie!', de: 'Foto erfolgreich hochgeladen!', fr: 'Photo téléchargée met succès!', tr: 'Fotoğraf başarıyla yüklendi!', ar: 'تم تحميل الصورة بنجاح!' },
  'settings.photoUploadError': { nl: 'Fout bij uploaden foto', en: 'Error uploading photo', es: 'Error al subir foto', pl: 'Błąd podczas przesyłania zdjęcia', de: 'Fehler beim Hochladen des Fotos', fr: 'Erreur lors du téléchargement de la photo', tr: 'Fotoğraf yüklenirken hata', ar: 'خطأ في تحميل الصورة' },
  'settings.manageNotifications': { nl: 'Beheer je notificatie voorkeuren', en: 'Manage your notification preferences', es: 'Gestiona tus preferencias de notificación', pl: 'Zarządzaj preferencjami powiadomień', de: 'Verwalten Sie Ihre Benachrichtigungseinstellungen', fr: 'Gérez vos préférences de notification', tr: 'Bildirim tercihlerinizi yönetin', ar: 'إدارة تفضيلات الإشعارات' },
  'settings.securitySettings': { nl: 'Beveiligingsinstellingen', en: 'Security settings', es: 'Configuración de seguridad', pl: 'Ustawienia bezpieczeństwa', de: 'Sicherheitseinstellungen', fr: 'Paramètres de sécurité', tr: 'Güvenlik ayarları', ar: 'إعدادات الأمان' },
  'settings.displayPreferences': { nl: 'Weergave voorkeuren', en: 'Display preferences', es: 'Preferencias de pantalla', pl: 'Wyświetlanie', de: 'Anzeigeeinstellungen', fr: 'Préférences d\'affichage', tr: 'Görünüm tercihleri', ar: 'تفضيلات العرض' },
  'settings.paymentMethods': { nl: 'Betaalmethoden', en: 'Payment methods', es: 'Métodos de pago', pl: 'Metody płatności', de: 'Zahlungsmethoden', fr: 'Méthodes de paiement', tr: 'Ödeme yöntemleri', ar: 'طرق الدفع' },
  'settings.changeLanguage': { nl: 'Wijzig je taalvoorkeur', en: 'Change your language preference', es: 'Cambia tu preferencia de idioma', pl: 'Zmień preferencje języka', de: 'Ändern Sie Ihre Spracheinstellung', fr: 'Changez votre préférence linguistique', tr: 'Dil tercihinizi değiştirin', ar: 'غيّر تفضيلات اللغة' },
  'settings.logoutConfirm': { nl: 'Weet je zeker dat je wilt uitloggen?', en: 'Are you sure you want to logout?', es: '¿Estás seguro de que quieres cerrar sesión?', pl: 'Czy na pewno chcesz się wylogować?', de: 'Möchten Sie sich wirklich abmelden?', fr: 'Êtes-vous sûr de vouloir vous déconnecter?', tr: 'Çıkış yapmak istediğinizden emin misiniz?', ar: 'هل أنت متأكد من أنك تريد تسجيل الخروج؟' },
  // Added VTLB translations
  'settings.vtlbSettings': { nl: 'VTLB Instellingen', en: 'VTLB Settings', es: 'Ajustes VTLB', pl: 'Ustawienia VTLB', de: 'VTLB-Einstellungen', fr: 'Paramètres VTLB', tr: 'VTLB Ayarları', ar: 'إعدادات VTLB' },
  'settings.vtlbDescription': { nl: 'Verfijn je VTLB berekening met extra situatie details', en: 'Refine your VTLB calculation with additional situation details', es: 'Refina tu cálculo VTLB con detalles de situación adicionales', pl: 'Dopracuj swoje obliczenia VTLB za pomocą dodatkowych szczegółów sytuacji', de: 'Verfeinern Sie Ihre VTLB-Berechnung mit zusätzlichen Situationsdetails', fr: 'Affinez votre calcul VTLB avec des détails de situation supplémentaires', tr: 'Ek durum detayları ile VTLB hesaplamanızı iyileştirin', ar: 'قم بتحسين حساب VTLB الخاص بك باستخدام تفاصيل إضافية حول الوضع' }
};

export default function Settings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    voornaam: '',
    achternaam: '',
    email: '',
    telefoonnummer: '',
    geboortedatum: '',
    adres: '',
    stad: '',
    postcode: '',
    land: 'Nederland'
  });

  // Added state for migration tool
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationDone, setMigrationDone] = useState(false);

  const { toast } = useToast();
  const { t: tFromHook, language } = useTranslation();

  const t = (key, options) => {
    let translation = settingsTranslations[key]?.[language];
    if (translation) {
      if (options) {
        Object.keys(options).forEach(optionKey => {
          translation = translation.replace(`{${optionKey}}`, options[optionKey]);
        });
      }
      return translation;
    }
    return tFromHook(key, options);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        voornaam: userData.voornaam || '',
        achternaam: userData.achternaam || '',
        email: userData.email || '',
        telefoonnummer: userData.telefoonnummer || '',
        geboortedatum: userData.geboortedatum || '',
        adres: userData.adres || '',
        stad: userData.stad || '',
        postcode: userData.postcode || '',
        land: userData.land || 'Nederland'
      });
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await User.updateMyUserData(formData);
      toast({ title: t('settings.updateSuccess') });
      setEditing(false);
      loadUser();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        variant: 'destructive',
        title: t('settings.updateError')
      });
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      toast({ title: t('settings.uploadingPhoto') });

      const { file_url } = await UploadFile({ file });

      await User.updateMyUserData({ profielfoto_url: file_url });
      toast({ title: t('settings.photoUploadSuccess') });

      loadUser();
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        variant: 'destructive',
        title: t('settings.photoUploadError')
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm(t('settings.logoutConfirm'))) {
      try {
        await User.logout();
        window.location.href = createPageUrl('Onboarding');
      } catch (error) {
        console.error("Error logging out:", error);
      }
    }
  };

  // Added migration tool function
  const handleMigrateOldPayments = async () => {
    if (!window.confirm("Dit voegt al je oude schuldenbetalingen toe als uitgaven in je budget. Dit hoef je maar 1 keer te doen. Doorgaan?")) {
      return;
    }

    setIsMigrating(true);
    try {
      const currentUser = await User.me();

      // 1. Haal alle bestaande DebtPayments op
      const allPayments = await DebtPayment.filter({ created_by: currentUser.email });

      // 2. Haal alle bestaande Transactions op om duplicaten te voorkomen
      const allTransactions = await Transaction.filter({ created_by: currentUser.email });

      // 3. Haal alle schulden op voor creditor_name
      const allDebts = await Debt.filter({ created_by: currentUser.email });
      const debtsMap = {};
      allDebts.forEach(d => debtsMap[d.id] = d);

      let addedCount = 0;
      let skippedCount = 0;

      for (const payment of allPayments) {
        const debt = debtsMap[payment.debt_id];
        if (!debt) {
          skippedCount++;
          continue;
        }

        // Check of er al een matching transaction bestaat
        const existingTransaction = allTransactions.find(t =>
          t.type === 'expense' &&
          t.category === 'debt_payments' &&
          t.date === payment.payment_date &&
          parseFloat(t.amount) === parseFloat(payment.amount) &&
          t.description.includes(debt.creditor_name)
        );

        if (existingTransaction) {
          skippedCount++;
          continue;
        }

        // Maak nieuwe transaction aan
        await Transaction.create({
          type: 'expense',
          amount: payment.amount,
          description: `Aflossing ${debt.creditor_name}`,
          category: 'debt_payments',
          date: payment.payment_date
        });

        addedCount++;
      }

      setMigrationDone(true);
      toast({
        title: "✅ Migratie voltooid!",
        description: `${addedCount} betalingen toegevoegd als uitgaven. ${skippedCount} al aanwezig.`
      });

    } catch (error) {
      console.error("Migration error:", error);
      toast({
        title: "Fout bij migratie",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6 pb-20" // Added pb-20 for extra padding at the bottom
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 lowercase">
        {t('settings.title')}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="lowercase">{t('settings.accountDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {user?.profielfoto_url ? (
                  <AvatarImage src={user.profielfoto_url} />
                ) : (
                  <AvatarFallback className="bg-[var(--konsensi-accent-light)] text-[var(--konsensi-primary)] text-2xl">
                    {user?.voornaam?.[0]?.toUpperCase() || user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8"
                onClick={() => document.getElementById('photo-upload').click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-semibold">
                {user?.voornaam || user?.full_name || t('settings.profilePhoto')}
              </h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {!editing ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.voornaam && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.firstName')}</p>
                      <p className="font-medium">{formData.voornaam}</p>
                    </div>
                  </div>
                )}

                {formData.achternaam && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.lastName')}</p>
                      <p className="font-medium">{formData.achternaam}</p>
                    </div>
                  </div>
                )}

                {formData.email && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.email')}</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                  </div>
                )}

                {formData.telefoonnummer && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.phone')}</p>
                      <p className="font-medium">{formData.telefoonnummer}</p>
                    </div>
                  </div>
                )}

                {formData.geboortedatum && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.birthdate')}</p>
                      <p className="font-medium">{new Date(formData.geboortedatum).toLocaleDateString(language === 'nl' ? 'nl-NL' : language === 'en' ? 'en-US' : language)}</p>
                    </div>
                  </div>
                )}

                {formData.adres && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.address')}</p>
                      <p className="font-medium">{formData.adres}</p>
                    </div>
                  </div>
                )}

                {formData.stad && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.city')}</p>
                      <p className="font-medium">{formData.stad}</p>
                    </div>
                  </div>
                )}

                {formData.postcode && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 lowercase">{t('settings.postalCode')}</p>
                      <p className="font-medium">{formData.postcode}</p>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={() => setEditing(true)} className="w-full md:w-auto">
                <Edit2 className="w-4 h-4 mr-2" />
                {t('settings.editProfile')}
              </Button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="lowercase">{t('settings.firstName')}</Label>
                  <Input
                    value={formData.voornaam}
                    onChange={(e) => setFormData({...formData, voornaam: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="lowercase">{t('settings.lastName')}</Label>
                  <Input
                    value={formData.achternaam}
                    onChange={(e) => setFormData({...formData, achternaam: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="lowercase">{t('settings.email')}</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                  />
                </div>
                <div>
                  <Label className="lowercase">{t('settings.phone')}</Label>
                  <Input
                    value={formData.telefoonnummer}
                    onChange={(e) => setFormData({...formData, telefoonnummer: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="lowercase">{t('settings.birthdate')}</Label>
                  <Input
                    type="date"
                    value={formData.geboortedatum}
                    onChange={(e) => setFormData({...formData, geboortedatum: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="lowercase">{t('settings.address')}</Label>
                  <Input
                    value={formData.adres}
                    onChange={(e) => setFormData({...formData, adres: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="lowercase">{t('settings.city')}</Label>
                  <Input
                    value={formData.stad}
                    onChange={(e) => setFormData({...formData, stad: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="lowercase">{t('settings.postalCode')}</Label>
                  <Input
                    value={formData.postcode}
                    onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {t('settings.saveChanges')}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  {t('settings.cancel')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="lowercase">{t('settings.preferences')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button
            onClick={() => window.location.href = createPageUrl('NotificationSettings')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium lowercase">{t('settings.notifications')}</p>
                <p className="text-xs text-gray-500 lowercase">{t('settings.manageNotifications')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => window.location.href = createPageUrl('SecuritySettings')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium lowercase">{t('settings.security')}</p>
                <p className="text-xs text-gray-500 lowercase">{t('settings.securitySettings')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => window.location.href = createPageUrl('DisplaySettings')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium lowercase">{t('settings.display')}</p>
                <p className="text-xs text-gray-500 lowercase">{t('settings.displayPreferences')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => window.location.href = createPageUrl('LanguageSettings')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium lowercase">{t('settings.language')}</p>
                <p className="text-xs text-gray-500 lowercase">{t('settings.changeLanguage')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* New VTLB Settings button */}
          <button
            onClick={() => window.location.href = createPageUrl('VTLBSettings')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium lowercase">{t('settings.vtlbSettings')}</p>
                <p className="text-xs text-gray-500 lowercase">{t('settings.vtlbDescription')}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </CardContent>
      </Card>

      {/* 🆕 NIEUWE SECTIE: Data Migratie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" /> {/* Using aliased SettingsIcon */}
            Data Migratie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Oude betalingen toevoegen aan budget
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Als je al betalingen had geregistreerd vóór deze update, klik dan hieronder om ze ook als uitgaven in je budget toe te voegen. Dit hoef je maar 1 keer te doen.
            </p>
            <Button
              onClick={handleMigrateOldPayments}
              disabled={isMigrating || migrationDone}
              className="w-full"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bezig met migreren...
                </>
              ) : migrationDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Migratie voltooid
                </>
              ) : (
                'Start migratie'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t('settings.logout')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
