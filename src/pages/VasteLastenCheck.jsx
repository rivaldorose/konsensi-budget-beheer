import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar, PartyPopper, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import { formatCurrency } from "@/components/utils/formatters";
import { motion, AnimatePresence } from "framer-motion";
import PaymentAnalysisModal from "@/components/checks/PaymentAnalysisModal";

const checkInTranslations = {
  'checkin.title': { nl: 'Maandelijkse Check-in', en: 'Monthly Check-in', es: 'Check-in Mensual', pl: 'Miesięczna Kontrola', de: 'Monatlicher Check-in', fr: 'Contrôle Mensuel', tr: 'Aylık Kontrol', ar: 'التحقق الشهري' },
  'checkin.subtitle': { nl: 'Heb je alles betaald deze maand?', en: 'Have you paid everything this month?', es: '¿Has pagado todo este mes?', pl: 'Czy zapłaciłeś wszystko w tym miesiącu?', de: 'Haben Sie diesen Monat alles bezahlt?', fr: 'Avez-vous tout payé ce mois-ci?', tr: 'Bu ay her şeyi ödediniz mi?', ar: 'هل دفعت كل شيء هذا الشهر؟' },
  'checkin.forMonth': { nl: 'Voor {month}', en: 'For {month}', es: 'Para {month}', pl: 'Za {month}', de: 'Für {month}', fr: 'Pour {month}', tr: '{month} için', ar: 'لـ {month}' },
  'checkin.itemsDue': { nl: 'Betalingen deze maand', en: 'Payments Due This Month', es: 'Pagos Vencidos Este Mes', pl: 'Płatności w tym miesiącu', de: 'Fällige Zahlungen diesen Monat', fr: 'Paiements dus ce mois-ci', tr: 'Bu Ayki Ödemeler', ar: 'المدفوعات المستحقة هذا الشهر' },
  'checkin.paid': { nl: 'Betaald', en: 'Paid', es: 'Pagado', pl: 'Zapłacone', de: 'Bezahlt', fr: 'Payé', tr: 'Ödendi', ar: 'مدفوع' },
  'checkin.postponed': { nl: 'Uitgesteld', en: 'Postponed', es: 'Pospuesto', pl: 'Przełożone', de: 'Verschoben', fr: 'Reporté', tr: 'Ertelendi', ar: 'مؤجل' },
  'checkin.postponedTo': { nl: 'Uitgesteld naar {date}', en: 'Postponed to {date}', es: 'Pospuesto hasta el {date}', pl: 'Przełożone na {date}', de: 'Verschoben auf {date}', fr: 'Reporté au {date}', tr: '{date} tarihine ertelendi', ar: 'تم تأجيله إلى {date}' },
  'checkin.yesPaid': { nl: 'Ja, betaald', en: 'Yes, paid', es: 'Sí, pagado', pl: 'Tak, zapłacone', de: 'Ja, bezahlt', fr: 'Oui, payé', tr: 'Evet, ödendi', ar: 'نعم، مدفوع' },
  'checkin.noNotPaid': { nl: 'Nee, niet betaald', en: 'No, not paid', es: 'No, no pagado', pl: 'Nie, nie zapłacone', de: 'Nein, nicht bezahlt', fr: 'Non, pas payé', tr: 'Hayır, ödenmedi', ar: 'لا، لم يتم الدفع' },
  'checkin.completeCheckin': { nl: 'Check-in Voltooien', en: 'Complete Check-in', es: 'Completar Check-in', pl: 'Ukończ Kontrolę', de: 'Check-in Abschließen', fr: 'Terminer le Contrôle', tr: 'Kontrolü Tamamla', ar: 'إكمال التحقق' },
  'checkin.loading': { nl: 'Check-in laden...', en: 'Loading check-in...', es: 'Cargando check-in...', pl: 'Ładowanie kontroli...', de: 'Check-in wird geladen...', fr: 'Chargement du contrôle...', tr: 'Kontrol yükleniyor...', ar: 'جارٍ تحميل التحقق...' },
  'checkin.backToDashboard': { nl: 'Terug naar Dashboard', en: 'Back to Dashboard', es: 'Volver al Panel', pl: 'Powrót do Panelu', de: 'Zurück zum Dashboard', fr: 'Retour au Tableau de Bord', tr: 'Panele Dön', ar: 'العودة إلى لوحة القيادة' },
  'checkin.whenCanYouPay': { nl: 'Wanneer kun je {name} betalen?', en: 'When can you pay {name}?', es: '¿Cuándo puedes pagar {name}?', pl: 'Kiedy możesz zapłacić {name}?', de: 'Wann können Sie {name} bezahlen?', fr: 'Quand pouvez-vous payer {name}?', tr: '{name} ne zaman ödeyebilirsiniz?', ar: 'متى يمكنك دفع {name}؟' },
  'checkin.postponeIntro': { nl: 'We gaan samen kijken wanneer je dit wel kunt betalen en wat je moet doen.', en: 'We will work together to find out when you can pay this and what you need to do.', es: 'Trabajaremos juntos para averiguar cuándo puedes pagar esto y qué debes hacer.', pl: 'Razem ustalimy, kiedy możesz to zapłacić i co musisz zrobić.', de: 'Wir werden gemeinsam herausfinden, wann Sie dies bezahlen können und was Sie tun müssen.', fr: 'Nous allons travailler ensemble pour déterminer quand vous pourrez payer cela et ce que vous devrez faire.', tr: 'Bunu ne zaman ödeyebileceğinizi ve ne yapmanız gerektiğini birlikte bulacağız.', ar: 'سوف نعمل معًا لاكتشاف متى يمكنك دفع هذا وما عليك فعله.' },
  'checkin.analysisComingSoon': { nl: 'Analyse functionaliteit komt in stap 2...', en: 'Analysis functionality coming in step 2...', es: 'La funcionalidad de análisis llegará en el paso 2...', pl: 'Funkcjonalność analizy pojawi się w kroku 2...', de: 'Analysefunktion kommt in Schritt 2...', fr: 'La fonctionnalité d\'analyse arrive à l\'étape 2...', tr: 'Analiz işlevselliği 2. adımda geliyor...', ar: 'وظيفة التحليل قادمة في الخطوة الثانية...' },
  'common.cancel': { nl: 'Annuleren', en: 'Cancel', es: 'Cancelar', pl: 'Anuluj', de: 'Abbrechen', fr: 'Annuler', tr: 'İptal', ar: 'إلغاء' },
  'checkin.month.0': { nl: 'Januari', en: 'January', es: 'Enero', pl: 'Styczeń', de: 'Januar', fr: 'Janvier', tr: 'Ocak', ar: 'يناير' },
  'checkin.month.1': { nl: 'Februari', en: 'February', es: 'Febrero', pl: 'Luty', de: 'Februar', fr: 'Février', tr: 'Şubat', ar: 'فبراير' },
  'checkin.month.2': { nl: 'Maart', en: 'March', es: 'Marzo', pl: 'Marzec', de: 'März', fr: 'Mars', tr: 'Mart', ar: 'مارس' },
  'checkin.month.3': { nl: 'April', en: 'April', es: 'Abril', pl: 'Kwiecień', de: 'April', fr: 'Avril', tr: 'Nisan', ar: 'أبريل' },
  'checkin.month.4': { nl: 'Mei', en: 'May', es: 'Mayo', pl: 'Maj', de: 'Mai', fr: 'Mai', tr: 'Mayıs', ar: 'مايو' },
  'checkin.month.5': { nl: 'Juni', en: 'June', es: 'Junio', pl: 'Czerwiec', de: 'Juni', fr: 'Juin', tr: 'Haziran', ar: 'يونيو' },
  'checkin.month.6': { nl: 'Juli', en: 'July', es: 'Julio', pl: 'Lipiec', de: 'Juli', fr: 'Juillet', tr: 'Temmuz', ar: 'يوليو' },
  'checkin.month.7': { nl: 'Augustus', en: 'August', es: 'Agosto', pl: 'Sierpień', de: 'August', fr: 'Août', tr: 'Ağustos', ar: 'أغسطس' },
  'checkin.month.8': { nl: 'September', en: 'September', es: 'Septiembre', pl: 'Wrzesień', de: 'September', fr: 'Septembre', tr: 'Eylül', ar: 'سبتمبر' },
  'checkin.month.9': { nl: 'Oktober', en: 'October', es: 'Octubre', pl: 'Październik', de: 'Oktober', fr: 'Octobre', tr: 'Ekim', ar: 'أكتوبر' },
  'checkin.month.10': { nl: 'November', en: 'November', es: 'Noviembre', pl: 'Listopad', de: 'November', fr: 'Novembre', tr: 'Kasım', ar: 'نوفمبر' },
  'checkin.month.11': { nl: 'December', en: 'December', es: 'Diciembre', pl: 'Grudzień', de: 'Dezember', fr: 'Décembre', tr: 'Aralık', ar: 'ديسمبر' }
};

export default function VasteLastenCheck() {
  const [selectedUnpaidItem, setSelectedUnpaidItem] = useState(null);
  const [showPostponeModal, setShowPostponeModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [allPaid, setAllPaid] = useState(false);

  const { toast } = useToast();
  const { t: tFromHook, language } = useTranslation();
  const queryClient = useQueryClient();

  const t = (key, options) => {
    let translation = checkInTranslations[key]?.[language];
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

  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  const currentMonthName = t(`checkin.month.${today.getMonth()}`);
  const currentDay = today.getDate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: existingCheck, isLoading: checkLoading } = useQuery({
    queryKey: ['monthlyCheck', currentMonth, user?.email],
    queryFn: () => base44.entities.MonthlyCheck.filter({ created_by: user.email, month: currentMonth }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: costs = [], isLoading: costsLoading } = useQuery({
    queryKey: ['monthlyCosts', user?.email],
    queryFn: () => base44.entities.MonthlyCost.filter({ created_by: user.email, status: 'actief' }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: debts = [], isLoading: debtsLoading } = useQuery({
    queryKey: ['debts', user?.email],
    queryFn: () => base44.entities.Debt.filter({ created_by: user.email, status: 'betalingsregeling' }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: paymentStatuses = [], isLoading: statusesLoading } = useQuery({
    queryKey: ['paymentStatuses', currentMonth, user?.email],
    queryFn: () => base44.entities.PaymentStatus.filter({ created_by: user.email, month: currentMonth }),
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  const isLoading = checkLoading || costsLoading || debtsLoading || statusesLoading;

  const itemsToCheck = React.useMemo(() => {
    const costsDueThisMonth = costs.filter(cost => cost.payment_date <= currentDay);
    const debtsDueThisMonth = debts.filter(debt => {
      if (!debt.payment_plan_date) return false;
      try {
        const paymentDay = new Date(debt.payment_plan_date).getDate();
        return paymentDay <= currentDay;
      } catch (e) {
        return false;
      }
    });

    return [
      ...costsDueThisMonth.map(c => ({ ...c, type: 'cost' })),
      ...debtsDueThisMonth.map(d => ({ ...d, type: 'debt' }))
    ];
  }, [costs, debts, currentDay]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ item, isPaid }) => {
      const dueDate = item.type === 'cost'
        ? `${currentMonth}-${String(item.payment_date).padStart(2, '0')}`
        : (item.payment_plan_date ? new Date(item.payment_plan_date).toISOString().split('T')[0] : null);

      const existingStatus = paymentStatuses.find(s => s.cost_id === item.id && s.month === currentMonth);

      if (existingStatus) {
        return await base44.entities.PaymentStatus.update(existingStatus.id, {
          is_paid: isPaid,
          postponed_to_date: isPaid ? null : existingStatus.postponed_to_date,
          updated_at: new Date().toISOString()
        });
      } else {
        return await base44.entities.PaymentStatus.create({
          cost_id: item.id,
          cost_name: item.name || item.creditor_name,
          cost_amount: item.amount || item.monthly_payment,
          month: currentMonth,
          is_paid: isPaid,
          due_date: dueDate,
          created_by: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
      toast({
        title: "✅ Status bijgewerkt",
        description: "De betaalstatus is opgeslagen.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: "Kon status niet opslaan",
        variant: "destructive"
      });
    }
  });

  const completeCheckMutation = useMutation({
    mutationFn: async () => {
      const allTrulyPaid = itemsToCheck.every(item =>
        paymentStatuses.some(s => s.cost_id === item.id && s.month === currentMonth && s.is_paid)
      );

      return await base44.entities.MonthlyCheck.create({
        month: currentMonth,
        check_date: new Date().toISOString(),
        all_paid: allTrulyPaid,
        created_by: user.email,
      });
    },
    onSuccess: () => {
      const allTrulyPaid = itemsToCheck.every(item =>
        paymentStatuses.some(s => s.cost_id === item.id && s.month === currentMonth && s.is_paid)
      );

      setAllPaid(allTrulyPaid);
      setSubmitted(true);

      queryClient.invalidateQueries({ queryKey: ['monthlyCheck'] });

      toast({ title: t('checkin.completeCheckin') });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: "Fout bij voltooien",
        description: "Er is een fout opgetreden.",
      });
    }
  });

  const handleMarkStatus = (item, isPaid) => {
    if (!isPaid) {
      setSelectedUnpaidItem(item);
      setShowPostponeModal(true);
      return;
    }

    updateStatusMutation.mutate({ item, isPaid: true });
  };

  const handleCompleteCheck = () => {
    const allAddressed = itemsToCheck.every(item =>
      paymentStatuses.some(s => s.cost_id === item.id && s.month === currentMonth && (s.is_paid || s.postponed_to_date))
    );

    if (!allAddressed) {
      toast({
        variant: 'destructive',
        title: "Niet alle items verwerkt",
        description: "Markeer alle betalingen als betaald of uitgesteld.",
      });
      return;
    }

    completeCheckMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('checkin.loading')}</p>
        </div>
      </div>
    );
  }

  if (existingCheck && existingCheck.length > 0) {
    return (
      <motion.div
        className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Je hebt de check-in voor deze maand al voltooid!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Voltooid op {(() => {
                try {
                  const date = new Date(existingCheck[0].check_date);
                  if (isNaN(date.getTime())) return 'Onbekend';
                  return new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
                } catch (e) {
                  return 'Onbekend';
                }
              })()}
            </p>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              {t('checkin.backToDashboard')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            {allPaid ? (
              <>
                <PartyPopper className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-green-700">Alles betaald! 🎉</CardTitle>
              </>
            ) : (
              <>
                <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <CardTitle className="text-2xl text-orange-700">Oeps, niet alles betaald</CardTitle>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              {allPaid
                ? 'Geweldig! Je hebt alle vaste lasten en betalingsregelingen op tijd betaald.'
                : 'Het is oké! Laten we kijken wat we kunnen doen.'}
            </p>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              {t('checkin.backToDashboard')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (itemsToCheck.length === 0) {
    return (
      <motion.div
        className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <PartyPopper className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Geen betalingen verwacht deze maand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Er zijn geen vaste lasten of betalingsregelingen die deze maand vervallen.</p>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              {t('checkin.backToDashboard')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {t('checkin.title')}
        </h1>
        <p className="text-gray-600">
          {t('checkin.forMonth', { month: currentMonthName })}
        </p>
        <p className="text-sm text-gray-500">{t('checkin.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('checkin.itemsDue')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemsToCheck.map((item) => {
            const status = paymentStatuses.find(s => s.cost_id === item.id && s.month === currentMonth);
            const isPaid = status?.is_paid || false;
            const isPostponed = status?.postponed_to_date ? true : false;
            const dueDay = item.type === 'cost' ? item.payment_date : new Date(item.payment_plan_date).getDate();

            return (
              <motion.div
                key={item.id}
                className={`p-4 ${isPaid ? 'bg-green-50 border-green-200' : isPostponed ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'} rounded-lg shadow-sm`}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-3xl">
                        {isPaid ? '✅' : isPostponed ? '⏰' : '❓'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">
                          {item.name || item.creditor_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.amount || item.monthly_payment)} • Vervaldatum: {dueDay} {currentMonthName}
                        </p>
                        {isPostponed && (
                          <p className="text-sm text-yellow-700 mt-1">
                            {t('checkin.postponedTo', { 
                              date: (() => {
                                try {
                                  const date = new Date(status.postponed_to_date);
                                  if (isNaN(date.getTime())) return 'Onbekend';
                                  return new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
                                } catch (e) {
                                  return 'Onbekend';
                                }
                              })()
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isPaid && !isPostponed && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleMarkStatus(item, true)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t('checkin.yesPaid')}
                        </Button>
                        <Button
                          onClick={() => handleMarkStatus(item, false)}
                          variant="outline"
                          className="border-orange-300 text-orange-700 hover:bg-orange-50"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {t('checkin.noNotPaid')}
                        </Button>
                      </div>
                    )}

                    {isPaid && (
                      <div className="text-green-600 font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {t('checkin.paid')}
                      </div>
                    )}
                    {isPostponed && !isPaid && (
                      <div className="text-yellow-700 font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        {t('checkin.postponed')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {itemsToCheck.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="p-6">
            <Button
              onClick={handleCompleteCheck}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={!itemsToCheck.every(item =>
                paymentStatuses.some(s => s.cost_id === item.id && s.month === currentMonth && (s.is_paid || s.postponed_to_date))
              ) || completeCheckMutation.isPending}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {t('checkin.completeCheckin')}
            </Button>
          </CardContent>
        </Card>
      )}

      <PaymentAnalysisModal
        isOpen={showPostponeModal}
        onClose={() => {
          setShowPostponeModal(false);
          setSelectedUnpaidItem(null);
        }}
        unpaidItem={selectedUnpaidItem}
        currentMonth={currentMonth}
      />
    </motion.div>
  );
}