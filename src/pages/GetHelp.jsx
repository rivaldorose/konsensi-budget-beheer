import React, { useState, useEffect } from "react";
import { HelpRequest } from "@/api/entities";
import { FAQ } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageSquare, Mail, Phone, Send, HelpCircle, Check, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";

const getHelpTranslations = {
  'help.title': { nl: 'Hulp & Contact', en: 'Help & Contact', es: 'Ayuda y Contacto', pl: 'Pomoc i Kontakt', de: 'Hilfe & Kontakt', fr: 'Aide & Contact', tr: 'Yardım ve İletişim', ar: 'المساعدة والاتصال' },
  'help.subtitle': { nl: 'We staan voor je klaar', en: 'We\'re here for you', es: 'Estamos aquí para ti', pl: 'Jesteśmy tu dla Ciebie', de: 'Wir sind für Sie da', fr: 'Nous sommes là pour vous', tr: 'Sizin için buradayız', ar: 'نحن هنا من أجلك' },
  'help.faqTitle': { nl: 'Veelgestelde Vragen', en: 'Frequently Asked Questions', es: 'Preguntas Frecuentes', pl: 'Często Zadawane Pytania', de: 'Häufig Gestellte Fragen', fr: 'Questions Fréquemment Posées', tr: 'Sıkça Sorulan Sorular', ar: 'الأسئلة الشائعة' },
  'help.faqSubtitle': { nl: 'Misschien staat je antwoord hier al tussen', en: 'Your answer might already be here', es: 'Tu respuesta podría estar aquí', pl: 'Twoja odpowiedź może być tutaj', de: 'Ihre Antwort könnte hier sein', fr: 'Votre réponse pourrait être ici', tr: 'Cevabınız burada olabilir', ar: 'قد تكون إجابتك هنا' },
  'help.noFaq': { nl: 'Nog geen FAQ\'s beschikbaar.', en: 'No FAQs available yet.', es: 'Aún no hay preguntas frecuentes disponibles.', pl: 'Jeszcze brak dostępnych FAQ.', de: 'Noch keine FAQs verfügbar.', fr: 'Aucune FAQ disponible pour le moment.', tr: 'Henüz SSS mevcut değil.', ar: 'لا توجد أسئلة شائعة متاحة بعد.' },
  'help.contactTitle': { nl: 'Neem Contact Op', en: 'Get in Touch', es: 'Ponte en Contacto', pl: 'Skontaktuj się', de: 'Kontaktieren Sie uns', fr: 'Contactez-nous', tr: 'İletişime Geç', ar: 'تواصل معنا' },
  'help.contactSubtitle': { nl: 'Heb je nog vragen? Stuur ons een bericht!', en: 'Still have questions? Send us a message!', es: '¿Aún tienes preguntas? ¡Envíanos un mensaje!', pl: 'Masz pytania? Wyślij nam wiadomość!', de: 'Haben Sie noch Fragen? Senden Sie uns eine Nachricht!', fr: 'Vous avez encore des questions? Envoyez-nous un message!', tr: 'Hala sorularınız mı var? Bize mesaj gönderin!', ar: 'لا تزال لديك أسئلة؟ أرسل لنا رسالة!' },
  'help.name': { nl: 'Naam', en: 'Name', es: 'Nombre', pl: 'Imię', de: 'Name', fr: 'Nom', tr: 'Ad', ar: 'الاسم' },
  'help.email': { nl: 'Email', en: 'Email', es: 'Correo', pl: 'Email', de: 'E-Mail', fr: 'Email', tr: 'E-posta', ar: 'البريد الإلكتروني' },
  'help.subject': { nl: 'Onderwerp', en: 'Subject', es: 'Asunto', pl: 'Temat', de: 'Betreff', fr: 'Sujet', tr: 'Konu', ar: 'الموضوع' },
  'help.message': { nl: 'Bericht', en: 'Message', es: 'Mensaje', pl: 'Wiadomość', de: 'Nachricht', fr: 'Message', tr: 'Mesaj', ar: 'الرسالة' },
  'help.subjectTechnical': { nl: 'Technische Vraag', en: 'Technical Question', es: 'Pregunta Técnica', pl: 'Pytanie Techniczne', de: 'Technische Frage', fr: 'Question Technique', tr: 'Teknik Soru', ar: 'سؤال تقني' },
  'help.subjectDebts': { nl: 'Schulden Vraag', en: 'Debt Question', es: 'Pregunta sobre Deudas', pl: 'Pytanie o Długi', de: 'Schulden Frage', fr: 'Question sur les Dettes', tr: 'Borç Sorusu', ar: 'سؤال عن الديون' },
  'help.subjectFeedback': { nl: 'Feedback', en: 'Feedback', es: 'Retroalimentación', pl: 'Opinia', de: 'Feedback', fr: 'Commentaire', tr: 'Geri Bildirim', ar: 'التعليقات' },
  'help.subjectOther': { nl: 'Anders', en: 'Other', es: 'Otro', pl: 'Inne', de: 'Andere', fr: 'Autre', tr: 'Diğer', ar: 'آخر' },
  'help.sendMessage': { nl: 'Bericht Versturen', en: 'Send Message', es: 'Enviar Mensaje', pl: 'Wyślij Wiadomość', de: 'Nachricht Senden', fr: 'Envoyer Message', tr: 'Mesaj Gönder', ar: 'إرسال الرسالة' },
  'help.messageSent': { nl: 'Bericht verzonden! We nemen spoedig contact met je op.', en: 'Message sent! We\'ll get back to you soon.', es: '¡Mensaje enviado! Te responderemos pronto.', pl: 'Wiadomość wysłana! Wkrótce się z Tobą skontaktujemy.', de: 'Nachricht gesendet! Wir melden uns bald bei Ihnen.', fr: 'Message envoyé! Nous vous répondrons bientôt.', tr: 'Mesaj gönderildi! Yakında size döneceğiz.', ar: 'تم إرسال الرسالة! سنعود إليك قريباً.' },
  'help.errorSending': { nl: 'Fout bij versturen bericht', en: 'Error sending message', es: 'Error al enviar mensaje', pl: 'Błąd wysyłania wiadomości', de: 'Fehler beim Senden der Nachricht', fr: 'Erreur lors de l\'envoi du message', tr: 'Mesaj gönderilirken hata', ar: 'خطأ في إرسال الرسالة' },
  'help.directContact': { nl: 'Direct Contact', en: 'Direct Contact', es: 'Contacto Directo', pl: 'Bezpośredni Kontakt', de: 'Direkter Kontakt', fr: 'Contact Direct', tr: 'Doğrudan İletişim', ar: 'الاتصال المباشر' },
  'help.emailUs': { nl: 'Email ons', en: 'Email us', es: 'Envíanos un correo', pl: 'Napisz do nas', de: 'Mailen Sie uns', fr: 'Envoyez-nous un email', tr: 'Bize e-posta gönderin', ar: 'راسلنا' },
  'help.callUs': { nl: 'Bel ons', en: 'Call us', es: 'Llámanos', pl: 'Zadzwoń do nas', de: 'Rufen Sie uns an', fr: 'Appelez-nous', tr: 'Bizi arayın', ar: 'اتصل بنا' },
  'help.categoryGeneral': { nl: 'Algemeen', en: 'General', es: 'General', pl: 'Ogólne', de: 'Allgemein', fr: 'Général', tr: 'Genel', ar: 'عام' },
  'help.categoryDebts': { nl: 'Schulden', en: 'Debts', es: 'Deudas', pl: 'Długi', de: 'Schulden', fr: 'Dettes', tr: 'Borçlar', ar: 'الديون' },
  'help.categoryBudget': { nl: 'Budget', en: 'Budget', es: 'Presupuesto', pl: 'Budżet', de: 'Budget', fr: 'Budget', tr: 'Bütçe', ar: 'الميزانية' },
  'help.categoryTechnical': { nl: 'Technisch', en: 'Technical', es: 'Técnico', pl: 'Techniczne', de: 'Technisch', fr: 'Technique', tr: 'Teknik', ar: 'تقني' },
  'help.categorySecurity': { nl: 'Beveiliging', en: 'Security', es: 'Seguridad', pl: 'Bezpieczeństwo', de: 'Sicherheit', fr: 'Sécurité', tr: 'Güvenlik', ar: 'الأمان' },
  'help.messagePlaceholder': { nl: 'Beschrijf je vraag of probleem zo gedetailleerd mogelijk...', en: 'Describe your question or problem as detailed as possible...', es: 'Describe tu pregunta o problema con el mayor detalle posible...', pl: 'Opisz swoje pytanie lub problem tak szczegółowo, jak to możliwe...', de: 'Beschreiben Sie Ihre Frage oder Ihr Problem so detailliert wie möglich...', fr: 'Décrivez votre question ou problème aussi en détail que possible...', tr: 'Sorunuzu veya probleminizi mümkün olduğunca ayrıntılı açıklayın...', ar: 'اشرح سؤالك أو مشكلتك بأكبر قدر ممكن من التفاصيل...' }
};

export default function GetHelp() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('algemeen');
  const [formData, setFormData] = useState({
    naam: '',
    email: '',
    onderwerp: '',
    bericht: ''
  });

  const { toast } = useToast();
  const { t: tFromHook, language } = useTranslation();

  const t = (key, options) => {
    let translation = getHelpTranslations[key]?.[language];
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await User.me();
      setFormData(prev => ({
        ...prev,
        naam: user.voornaam || user.full_name || '',
        email: user.email || ''
      }));

      const faqData = await FAQ.list('-volgorde', 100);
      setFaqs(faqData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await HelpRequest.create(formData);
      toast({ title: t('help.messageSent') });
      setFormData(prev => ({
        ...prev,
        onderwerp: '',
        bericht: ''
      }));
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ 
        variant: 'destructive', 
        title: t('help.errorSending')
      });
    }
  };

  const filteredFaqs = faqs.filter(faq => faq.categorie === selectedCategory);

  const getQuestionText = (faq) => {
    const field = `vraag_${language}`;
    return faq[field] || faq.vraag_nl;
  };

  const getAnswerText = (faq) => {
    const field = `antwoord_${language}`;
    return faq[field] || faq.antwoord_nl;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 md:p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 lowercase">
          {t('help.title')}
        </h1>
        <p className="text-gray-600 lowercase">{t('help.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 lowercase">
            <HelpCircle className="w-5 h-5" />
            {t('help.faqTitle')}
          </CardTitle>
          <p className="text-sm text-gray-600 lowercase">{t('help.faqSubtitle')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'algemeen' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('algemeen')}
              className="lowercase"
            >
              {t('help.categoryGeneral')}
            </Button>
            <Button
              variant={selectedCategory === 'schulden' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('schulden')}
              className="lowercase"
            >
              {t('help.categoryDebts')}
            </Button>
            <Button
              variant={selectedCategory === 'budget' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('budget')}
              className="lowercase"
            >
              {t('help.categoryBudget')}
            </Button>
            <Button
              variant={selectedCategory === 'technisch' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('technisch')}
              className="lowercase"
            >
              {t('help.categoryTechnical')}
            </Button>
            <Button
              variant={selectedCategory === 'beveiliging' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('beveiliging')}
              className="lowercase"
            >
              {t('help.categorySecurity')}
            </Button>
          </div>

          {filteredFaqs.length === 0 ? (
            <p className="text-center text-gray-500 py-8 lowercase">{t('help.noFaq')}</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq, index) => (
                <AccordionItem key={faq.id} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {getQuestionText(faq)}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600">
                    {getAnswerText(faq)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 lowercase">
            <MessageSquare className="w-5 h-5" />
            {t('help.contactTitle')}
          </CardTitle>
          <p className="text-sm text-gray-600 lowercase">{t('help.contactSubtitle')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="lowercase">{t('help.name')}</Label>
                <Input
                  value={formData.naam}
                  onChange={(e) => setFormData({...formData, naam: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label className="lowercase">{t('help.email')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="lowercase">{t('help.subject')}</Label>
              <Select
                value={formData.onderwerp}
                onValueChange={(value) => setFormData({...formData, onderwerp: value})}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technisch" className="lowercase">{t('help.subjectTechnical')}</SelectItem>
                  <SelectItem value="schulden" className="lowercase">{t('help.subjectDebts')}</SelectItem>
                  <SelectItem value="feedback" className="lowercase">{t('help.subjectFeedback')}</SelectItem>
                  <SelectItem value="anders" className="lowercase">{t('help.subjectOther')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="lowercase">{t('help.message')}</Label>
              <Textarea
                value={formData.bericht}
                onChange={(e) => setFormData({...formData, bericht: e.target.value})}
                rows={6}
                placeholder={t('help.messagePlaceholder')}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {t('help.sendMessage')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="lowercase">{t('help.directContact')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href="mailto:support@konsensi.nl"
            className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium lowercase">{t('help.emailUs')}</p>
              <p className="text-sm text-gray-500">support@konsensi.nl</p>
            </div>
          </a>

          <a
            href="tel:+31612345678"
            className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5 text-gray-600" />
            <div>
              <p className="font-medium lowercase">{t('help.callUs')}</p>
              <p className="text-sm text-gray-500">+31 6 12 34 56 78</p>
            </div>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}