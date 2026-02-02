
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge'; // Added from outline
import { Loader2, CheckCircle2, Clipboard, Download, AlertTriangle, Info, Copy, FileWarning, BookOpen, MessageSquareWarning, Clock, Edit, ChevronsRight, Repeat, Building, FileText, User as UserIcon, ChevronDown } from "lucide-react"; // Renamed User to UserIcon, added ChevronDown
import { User as UserEntity } from "@/api/entities"; // Renamed to avoid conflict with lucide-react User icon
import { Income } from "@/api/entities";
import { MonthlyCost } from "@/api/entities";
import { Debt } from "@/api/entities";
import { ArrangementProgress } from "@/api/entities";
import { PaymentPlanProposal } from "@/api/entities";
import { VtblSetting } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "@/components/utils/LanguageContext";
import EmailPreview from './EmailPreview';
import DisputeForm from './DisputeForm';
import PartialRecognitionForm from './PartialRecognitionForm';
import AlreadyPaidForm from './AlreadyPaidForm';
import VerjaringForm from './VerjaringForm';
import IncassokostenForm from './IncassokostenForm';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { incomeService, monthlyCostService, debtService, vtblService } from "@/components/services";
import { formatCurrency } from "@/components/utils/formatters";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Added from outline

const StepHeader = ({ step, title, subtitle, isCompleted, isCurrent }) => (
  <div className={`flex items-start gap-4 p-4 rounded-lg transition-all ${isCurrent ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-[#2a2a2a]'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
      {isCompleted ? <CheckCircle2 className="w-6 h-6 text-white" /> : <span className="text-lg font-bold text-gray-600 dark:text-gray-400 dark:text-gray-300">{step}</span>}
    </div>
    <div>
      <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
    </div>
  </div>
);

export default function ArrangementStappenplanModal({ debt, isOpen, onClose }) {
  const [view, setView] = useState('choice');
  const [activeTab, setActiveTab] = useState('keuzes'); // 'keuzes' | 'stappenplan' | 'vtlb'
  const [activeStep, setActiveStep] = useState("stap1");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const [calculation, setCalculation] = useState(null);
  const [arrangement, setArrangement] = useState(null);
  const [user, setUser] = useState(null);
  const [isDisputeContext, setIsDisputeContext] = useState(false);
  const [isPartialContext, setIsPartialContext] = useState(false);
  const [isAlreadyPaidContext, setIsAlreadyPaidContext] = useState(false);
  const [isVerjaringContext, setIsVerjaringContext] = useState(false);

  const [modificationData, setModificationData] = useState({ newAmount: '', duration: '' });
  const [modificationType, setModificationType] = useState('');

  const [letterContent, setLetterContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [disputeData, setDisputeData] = useState(null);
  const [partialData, setPartialData] = useState(null);
  const [alreadyPaidData, setAlreadyPaidData] = useState(null);
  const [verjaringData, setVerjaringData] = useState(null);
  const [incassokostenData, setIncassokostenData] = useState(null);

  // 🆕 NIEUWE STATE VOOR BETALINGSREGELINGSBRIEF
  const [paymentFormData, setPaymentFormData] = useState({
    // Gebruiker gegevens
    userName: '',
    userAddress: '',
    userPostcode: '',
    userCity: '',
    userEmail: '',
    // Schuldeiser gegevens
    creditorDepartment: '',
    creditorAddress: '',
    creditorPostcode: '',
    creditorCity: '',
    // Brief details
    receivedLetterDate: new Date().toISOString().split('T')[0],
    monthlyAmount: '',
    firstPaymentAmount: '',
    firstPaymentDate: '',
    includeFirstPayment: false,
  });

  // 🆕 STATE VOOR INKLAPBARE SECTIES
  const [userSectionOpen, setUserSectionOpen] = useState(true);
  const [creditorSectionOpen, setCreditorSectionOpen] = useState(true);
  const [detailsSectionOpen, setDetailsSectionOpen] = useState(true);

  const { toast } = useToast();
  const { t } = useTranslation();

  const generateLetter = useCallback((u, d, c) => {
    const userName = u.full_name || t('common.client');
    const intro = `Geachte ${d.creditor_name},\n\nBetreft: Dossier ${d.case_number || '[Dossiernummer invullen]'}\n\nIk ontvang uw correspondentie betreffende de openstaande schuld van ${formatCurrency(d.amount)}. Ik erken deze schuld en wil graag tot een oplossing komen.`;
    const situation = `Mijn financiële situatie is momenteel als volgt:\n• Vast maandelijks inkomen: ${formatCurrency(c.vastInkomen)}\n• Vaste maandelijkse lasten: ${formatCurrency(c.vasteLasten)}\n• Beschikbaar voor levensonderhoud: ${formatCurrency(c.beschikbaar)}`;
    const ending = `Zodra mijn financiële situatie verbetert, neem ik direct contact op om de maandelijkse aflossing te verhogen.\n\nIk hoop op uw begrip en zie uw reactie graag tegemoet.\n\nMet vriendelijke groet,\n${userName}`;

    if (c.isHaalbaar) {
      return `${intro}\n\n${situation}\n\nVolgens de VTBL-methode heb ik ${formatCurrency(c.ruimteVoorNieuw)} per maand beschikbaar voor nieuwe betalingsregelingen.\n\nIk stel daarom voor om maandelijks ${formatCurrency(c.voorstel)} af te lossen, voor een periode van circa ${c.looptijd} maanden.\n\n${ending}`;
    } else {
      return `${intro}\n\n${situation}\n\nHelaas is mijn volledige afloscapaciteit reeds benut voor andere, lopende regelingen. Er is op dit moment geen financiële ruimte voor een nieuwe betalingsregeling.\n\nIk ben momenteel in gesprek met schuldhulpverlening om mijn situatie te stabiliseren. Ik verzoek u vriendelijk om de invordering te pauzeren en geen extra kosten in rekening te brengen.\n\n${ending}`;
    }
  }, [t]);
  
  const generatePayInFullLetter = useCallback((user, debt) => {
    const userName = user?.full_name || '[Uw Naam]';
    const debtAmount = formatCurrency(debt.amount || 0);
    return `Geachte heer/mevrouw,\n\nBetreft: Volledige betaling openstaande vordering - Dossier ${debt.case_number || '[Dossiernummer]'}\n\nHierbij bericht ik u dat ik de openstaande schuld van ${debtAmount} in één keer wens te voldoen.\n\nIk verzoek u vriendelijk mij de benodigde betalingsgegevens (IBAN, tenaamstelling en betalingskenmerk) toe te sturen, zodat ik het bedrag zo spoedig mogelijk kan overmaken.\n\nNa ontvangst van de betaling verzoek ik u om een schriftelijke bevestiging dat de schuld volledig is voldaan en dat de zaak hiermee is gesloten. Ik ga ervan uit dat er na deze betaling geen verdere kosten meer in rekening worden gebracht.\n\nIn afwachting van uw reactie.\n\nMet vriendelijke groet,\n${userName}`;
  }, []);

  const generateLoweringAmountLetter = useCallback((user, debt, newAmount) => {
    const userName = user?.full_name || '[Uw Naam]';
    return `Geachte heer/mevrouw,\n\nBetreft: Verzoek tot verlaging maandbedrag - Dossier ${debt.case_number || '[Dossiernummer]'}\n\nMomenteel los ik maandelijks ${formatCurrency(debt.monthly_payment || 0)} af voor de bovenstaande vordering.\n\nDoor een onverwachte en significante wijziging in mijn persoonlijke financiële situatie, is het voor mij onmogelijk geworden om dit bedrag te blijven voldoen. Ik ben hierdoor genoodzaakt om een aanpassing van onze afspraak aan te vragen.\n\nNa een zorgvuldige herberekening van mijn budget, is het maximaal haalbare bedrag dat ik maandelijks kan missen ${formatCurrency(parseFloat(newAmount || 0))}.\n\nIk verzoek u dan ook vriendelijk om het maandbedrag te verlagen naar ${formatCurrency(parseFloat(newAmount || 0))}. Ik ben vastberaden om mijn verplichtingen na te komen en hoop dat we gezamenlijk tot een duurzame oplossing kunnen komen.\n\nIk zie uw reactie graag tegemoet.\n\nMet vriendelijke groet,\n${userName}`;
  }, []);

  const generatePaymentHolidayLetter = useCallback((user, debt, duration) => {
    const userName = user?.full_name || '[Uw Naam]';
    return `Geachte heer/mevrouw,\n\nBetreft: Verzoek om tijdelijke betalingsvakantie - Dossier ${debt.case_number || '[Dossiernummer]'}\n\nMomenteel hebben wij een betalingsregeling lopen waarbij ik maandelijks een bedrag aflos.\n\nDoor acute, onvoorziene omstandigheden (zoals [bijv. plotselinge ziekte, verlies van inkomen]) ben ik tijdelijk niet in staat om aan mijn betalingsverplichting te voldoen. Deze situatie is van korte duur en ik verwacht binnen enkele maanden weer stabiliteit te hebben.\n\nDaarom verzoek ik u dringend om een betalingsvakantie voor een periode van ${duration || '[aantal]'} maanden, ingang per direct.\n\nNa deze periode zal ik onmiddellijk contact met u opnemen om de betalingen te hervatten. Ik hoop op uw begrip en medewerking in deze lastige periode.\n\nIk zie uw reactie graag tegemoet.\n\nMet vriendelijke groet,\n${userName}`;
  }, []);
  
  const generateStopCounselingLetter = useCallback((user, debt) => {
    const userName = user?.full_name || '[Uw Naam]';
    return `Geachte heer/mevrouw,\n\nBetreft: Stopzetting betalingsregeling en aanmelding schuldhulp - Dossier ${debt.case_number || '[Dossiernummer]'}\n\nIk moet u helaas informeren dat ik, ondanks mijn beste inspanningen, de huidige betalingsregeling niet langer kan voortzetten. Mijn financiële situatie is dermate verslechterd dat aflossen op dit moment onmogelijk is.\n\nIk heb de moeilijke, maar noodzakelijke stap gezet om professionele schuldhulpverlening in te schakelen. Ik heb mij aangemeld bij [Naam schuldhulpinstantie, bijv. de gemeentelijke kredietbank] en wacht op de start van een traject.\n\nConform de Gedragscode Schuldregeling verzoek ik u vriendelijk om alle incasso-activiteiten te staken en de vordering voorlopig te pauzeren in afwachting van een voorstel vanuit mijn schuldhulpverlener.\n\nDe schuldhulpverleningsinstantie zal te zijner tijd contact met u opnemen.\n\nIk dank u voor uw begrip.\n\nMet vriendelijke groet,\n${userName}`;
  }, []);

  const generateDisputeLetter = useCallback((user, debt, reason, details) => {
    const intro = `Geachte heer/mevrouw,\n\nOp ${new Date().toLocaleDateString('nl-NL')} ontving ik uw brief/aanmaning met betrekking tot een vermeende schuld van ${formatCurrency(debt.amount)} inzake dossiernummer ${debt.case_number || '[Dossiernummer]'}.\n\nIk bericht u hierbij dat ik deze vordering BETWIST.`;
    
    let reasonText = "";
    switch (reason) {
      case 'never_received':
        reasonText = "Ik heb deze dienst/product nooit afgenomen. Ik heb geen overeenkomst met u gesloten en herken deze vordering niet.";
        break;
      case 'already_paid':
        reasonText = `Ik heb dit bedrag reeds volledig betaald op ${details.paymentDate ? new Date(details.paymentDate).toLocaleDateString('nl-NL') : '[datum]'} met betalingskenmerk ${details.paymentReference || '[betalingskenmerk]'}. Bijgevoegd vindt u een kopie van het betalingsbewijs.`;
        break;
      case 'cancelled':
        reasonText = `Ik heb de overeenkomst tijdig opgezegd op ${details.cancelDate ? new Date(details.cancelDate).toLocaleDateString('nl-NL') : '[datum]'}. Er kunnen daarom geen kosten meer in rekening worden gebracht na deze opzegdatum.`;
        break;
      case 'amount_wrong':
        reasonText = `Het gevorderde bedrag van ${formatCurrency(debt.amount)} is onjuist. Het correcte bedrag bedraagt ${details.correctAmount ? formatCurrency(parseFloat(details.correctAmount)) : '[correct bedrag]'}.`;
        break;
      case 'other':
        reasonText = details.otherReason || '[Vul hier de specifieke reden in waarom u de vordering betwist]';
        break;
      default:
        reasonText = "[REDEN NIET GEVONDEN]";
    }

    const outro = `MIJN VERZOEK:\n\nIk verzoek u vriendelijk:\n• De vordering te herzien\n• Mij nadere specificatie/onderbouwing te sturen\n• Alle verdere incasso-acties te stoppen totdat deze kwestie is opgehelderd\n\nIk ben bereid om in gesprek te gaan om tot een oplossing te komen, maar erken de vordering in de huidige vorm niet.\n\nIk verzoek u binnen 14 dagen schriftelijk te reageren met een nadere onderbouwing van uw vordering.\n\nMet vriendelijke groet,\n\n${user?.full_name || '[Uw Naam]'}`;

    return `${intro}\n\nREDEN BETWISTING:\n${reasonText}\n\n${outro}`;
  }, []);

  const generatePartialRecognitionLetter = useCallback((user, debt, data) => {
    const userName = user?.full_name || '[Uw Naam]';
    const originalAmount = formatCurrency(debt.amount);
    const recognizedAmount = formatCurrency(parseFloat(data.erkend?.totaal || data.recognized_amount || 0));
    const disputedAmount = formatCurrency(parseFloat(data.betwist?.totaal || (debt.amount - (data.erkend?.totaal || data.recognized_amount || 0)) || 0));

    const intro = `Geachte heer/mevrouw,\n\nOp ${new Date().toLocaleDateString('nl-NL')} ontving ik uw brief/aanmaning met betrekking tot een vermeende schuld van ${originalAmount} inzake dossiernummer ${debt.case_number || '[Dossiernummer]'}.\n\nIk bericht u hierbij dat ik deze vordering gedeeltelijk erken en gedeeltelijk betwist.`;

    const erkendSection = `Ik erken een bedrag van ${recognizedAmount} van de totale vordering. Voor dit erkende deel ben ik bereid een betalingsregeling te treffen of direct te voldoen, afhankelijk van de afspraken die gemaakt kunnen worden.`;

    const betwistSection = `Het resterende bedrag van ${disputedAmount} betwist ik om de volgende reden:\n\n${data.reason || data.dispute_reason}\n${data.details || data.dispute_details ? `Nadere toelichting: ${data.details || data.dispute_details}\n` : ''}`;

    const outro = `MIJN VERZOEK:\n\nIk verzoek u vriendelijk:\n• De vordering te herzien naar het erkende bedrag van ${recognizedAmount}.\n• Mij een reactie te sturen met betrekking tot de betwisting van het resterende deel, inclusief een nadere onderbouwing indien u de betwisting niet erkent.\n• Alle verdere incasso-acties met betrekking tot het betwiste deel te stoppen totdat deze kwestie is opgehelderd.\n\nIk ben bereid om in gesprek te gaan om tot een oplossing te komen.\n\nIk verzoek u binnen 14 dagen schriftelijk te reageren.\n\nMet vriendelijke groet,\n\n${userName}`;

    return `${intro}\n\n${erkendSection}\n\n${betwistSection}\n${outro}`;
  }, []);

  const generateAlreadyPaidLetter = useCallback((user, debt, data) => {
    const userName = user?.full_name || '[Uw Naam]';
    const userAddress = user?.address || '[adres]';
    const userPostcode = user?.postal_code || '[postcode]';
    const userCity = user?.city || '[woonplaats]';
    const userEmail = user?.email || '[e-mail]';
    
    const creditorName = debt.creditor_name || '[naam incassobureau/bedrijf]';
    const creditorDept = data.creditor_department || '[afdeling]';
    const creditorAddress = data.creditor_address || '[adres]';
    const creditorPostcode = data.creditor_postcode || '[postcode]';
    const creditorCity = data.creditor_city || '[plaats]';
    
    const caseNumber = debt.case_number || '[dossiernummer of kenmerk]';
    const receivedLetterDate = data.received_letter_date ? new Date(data.received_letter_date).toLocaleDateString('nl-NL') : '[datum]';
    const debtAmount = formatCurrency(debt.amount || 0);
    
    const contactPersonName = data.contact_person_name || '';
    const greeting = contactPersonName ? `Geachte heer, mevrouw ${contactPersonName},` : 'Geachte heer, mevrouw,';
    
    return `${userName}
${userAddress}
${userPostcode} ${userCity}
${userEmail}

 

Aan
${creditorName}
${creditorDept}
${creditorAddress}
${creditorPostcode} ${creditorCity}

 

${userCity}, ${new Date().toLocaleDateString('nl-NL')}

Kenmerk: ${caseNumber}
Onderwerp: betaalde rekening

 

${greeting}

Op ${receivedLetterDate} kreeg ik van u een brief waarin u mij vraagt om ${debtAmount} te betalen.

Ik ben het niet eens met deze rekening omdat ik al heb betaald. Bewijs van de betaling vindt u in de bijlage. 

Ik verzoek u het dossier te sluiten en mij dit binnen 14 dagen schriftelijk te laten weten. Vindt u dat ik wel moet betalen, dan ontvang ik graag bewijs waaruit dat blijkt.

Krijg ik binnen 14 dagen geen reactie? Dan ga ik er vanuit dat u het dossier sluit en mij geen brieven meer stuurt. 

Met vriendelijke groet,

 

${userName}

 

Bijlagen:

- Bewijs van betaling`;
  }, []);

  const generateVerjaringLetter = useCallback((user, debt, data) => {
      const userName = user?.full_name || '[Uw Naam]';
      const userAddress = user?.address || '[adres]';
      const userPostcode = user?.postal_code || '[postcode]';
      const userCity = user?.city || '[woonplaats]';
      const userEmail = user?.email || '[e-mail]';
      
      const creditorName = debt.creditor_name || '[naam incassobureau/bedrijf]';
      const creditorDept = data.creditor_department || '[afdeling]';
      const creditorAddress = data.creditor_address || '[adres]';
      const creditorPostcode = data.creditor_postcode || '[postcode]';
      const creditorCity = data.creditor_city || '[plaats]';
      
      const caseNumber = debt.case_number || '[dossiernummer of kenmerk]';
      const receivedLetterDate = data.received_letter_date ? new Date(data.received_letter_date).toLocaleDateString('nl-NL') : '[datum]';
      const debtAmount = formatCurrency(debt.amount || 0);
      
      const contactPersonName = data.contact_person_name || '';
      const greeting = contactPersonName ? `Geachte heer, mevrouw ${contactPersonName},` : 'Geachte heer, mevrouw,';
      
      return `${userName}
${userAddress}
${userPostcode} ${userCity}
${userEmail}

 

Aan:
${creditorName}
${creditorDept}
${creditorAddress}
${creditorPostcode} ${creditorCity}

 

${userCity}, ${new Date().toLocaleDateString('nl-NL')}

Kenmerk: ${caseNumber}
Onderwerp: verjaarde rekening

 

${greeting}

Op ${receivedLetterDate} kreeg ik van u een brief waarin u mij vraagt om ${debtAmount} te betalen.

Deze rekening is verjaard. Daarom verzoek ik u dit dossier te sluiten en mij hierover binnen 14 dagen een bericht te sturen.

Vindt u dat ik deze rekening wel moet betalen? Dan ontvang ik graag bewijs waaruit blijkt dat de rekening niet verjaard is.

Krijg ik binnen 14 dagen geen reactie? Dan ga ik er vanuit dat u het dossier sluit en mij geen brieven meer stuurt.

Met vriendelijke groet,

 

${userName}`;
  }, []);

  const generateIncassokostenLetter = useCallback((user, debt, data) => {
    const userName = data.user_name || user?.full_name || '<uw naam>';
    const userAddress = data.user_address || '<adres>';
    const userPostcode = data.user_postcode || '<postcode>';
    const userCity = data.user_city || '<woonplaats>';
    const userEmail = data.user_email || '<e-mail>';

    const creditorName = debt.creditor_name || '<naam incassobureau/bedrijf>';
    const creditorDept = data.creditor_department || '<afdeling>';
    const creditorAddress = data.creditor_address || '<adres>';
    const creditorPostcode = data.creditor_postcode || '<postcode>';
    const creditorCity = data.creditor_city || '<woonplaats>';

    const caseNumber = debt.case_number || '<dossiernummer of kenmerk>';
    const receivedDate = data.received_letter_date ? new Date(data.received_letter_date).toLocaleDateString('nl-NL') : '<datum>';
    const debtAmount = `€\u00A0${(debt.amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`;
    const incassoAmount = `€\u00A0${parseFloat(data.incasso_amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`;
    const productName = data.product_name || '<naam product of dienst>';
    const documentType = data.document_type || 'rekening';
    const todayFormatted = new Date().toLocaleDateString('nl-NL');

    const contactPersonName = data.contact_person_name || '';
    const greeting = contactPersonName ? `Geachte heer, mevrouw ${contactPersonName},` : 'Geachte heer, mevrouw,';

    // Build reason paragraph based on selected reason
    let reasonText = '';
    switch (data.reason) {
      case 'A':
        reasonText = 'Volgens de wet moet u mij namelijk eerst een betalingsherinnering sturen. Dit heeft u niet gedaan.';
        break;
      case 'B': {
        const issues = (data.reason_b_issues || []).map(i => `• ${i}`).join('\n');
        reasonText = `U stuurde mij namelijk een herinneringsbrief die niet klopt. Hierin staat:\n\n${issues}\n\nUw herinneringsbrief voldoet daarom niet aan de eisen van de wet. U mag dus geen incassokosten rekenen.`;
        break;
      }
      case 'C': {
        const paymentDate = data.reason_c_payment_date ? new Date(data.reason_c_payment_date).toLocaleDateString('nl-NL') : '<datum>';
        const paymentRef = data.reason_c_payment_reference || '<betalingskenmerk>';
        reasonText = `Ik heb de rekening namelijk al betaald na de herinnering die u eerder stuurde. Ik betaalde op ${paymentDate} en vermeldde daarbij het kenmerk ${paymentRef}. De rekening is dus op tijd betaald.`;
        break;
      }
      case 'D': {
        const maxAmount = `€\u00A0${parseFloat(data.reason_d_max_amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`;
        reasonText = `De incassokosten die u rekent zijn namelijk te hoog. Volgens de wet mag u maximaal ${maxAmount} rekenen.`;
        break;
      }
      default:
        reasonText = '<kies reden A, B, C, of D>';
    }

    // Original payment status line
    let originalPaymentLine = '';
    if (data.original_payment_status === 'paid') {
      const paidDate = data.original_paid_date ? new Date(data.original_paid_date).toLocaleDateString('nl-NL') : '<datum>';
      originalPaymentLine = `Het originele bedrag van ${debtAmount} betaalde ik al op ${paidDate}.`;
    } else {
      originalPaymentLine = `Ik zal het originele bedrag van ${debtAmount} zo snel mogelijk aan u betalen.`;
    }

    return `${userName}
${userAddress}
${userPostcode} ${userCity}
${userEmail}

Aan
${creditorName}
${creditorDept}
${creditorAddress}
${creditorPostcode} ${creditorCity}

${userCity}, ${todayFormatted}

Kenmerk: ${caseNumber}
Onderwerp: bezwaar incassokosten


${greeting}

Op ${receivedDate} kreeg ik van u een ${documentType}. Hieruit blijkt dat ik ${debtAmount} moet betalen voor ${productName}. Bovenop dat bedrag rekent u incassokosten van ${incassoAmount}.

Ik ben het niet eens met deze incassokosten. ${reasonText}

De incassokosten die u vraagt, betaal ik daarom niet.

${originalPaymentLine}

Ik verzoek u daarom het dossier te sluiten en mij dit binnen 7 dagen schriftelijk te laten weten. Krijg ik binnen 7 dagen geen reactie? Dan ga ik ervan uit dat u het dossier sluit en mij geen brieven meer stuurt.

Ik wacht uw reactie af.

Met vriendelijke groet,


${userName}`;
  }, []);

  // 🔧 AANGEPAST: Genereer ALLEEN de brieftekst (zonder disclaimer/checklist)
  const generateJuridischLoketLetter = useCallback(() => {
    const {
      userName, userAddress, userPostcode, userCity, userEmail,
      creditorDepartment, creditorAddress, creditorPostcode, creditorCity,
      receivedLetterDate, monthlyAmount, firstPaymentAmount, firstPaymentDate, includeFirstPayment
    } = paymentFormData;

    const creditorName = debt.creditor_name || '[Naam schuldeiser]';
    const caseNumber = debt.case_number || '[dossiernummer]';
    const totalAmount = formatCurrency(debt.amount || 0);
    const numberOfMonths = monthlyAmount ? Math.ceil((debt.amount || 0) / parseFloat(monthlyAmount)) : '[aantal maanden]';

    let optionalPaymentText = '';
    if (includeFirstPayment && firstPaymentAmount && firstPaymentDate) {
      optionalPaymentText = `Op ${new Date(firstPaymentDate).toLocaleDateString('nl-NL')} zal ik het eerste bedrag van ${formatCurrency(parseFloat(firstPaymentAmount))} overmaken.`;
    } else if (includeFirstPayment && firstPaymentAmount) {
      optionalPaymentText = `Ik heb alvast ${formatCurrency(parseFloat(firstPaymentAmount))} aan u betaald.`;
    }

    // ✅ Officieel Juridisch Loket template
    const formattedDate = new Date(receivedLetterDate).toLocaleDateString('nl-NL');
    const todayFormatted = new Date().toLocaleDateString('nl-NL');
    const monthlyFormatted = formatCurrency(parseFloat(monthlyAmount) || 0);

    let paymentSentence = '';
    if (includeFirstPayment && firstPaymentDate) {
      const fpDate = new Date(firstPaymentDate).toLocaleDateString('nl-NL');
      if (firstPaymentAmount) {
        paymentSentence = ` Op ${fpDate} zal ik de eerste termijn van ${formatCurrency(parseFloat(firstPaymentAmount))} overmaken.`;
      } else {
        paymentSentence = ` Op ${fpDate} zal ik de eerste termijn overmaken.`;
      }
    } else if (includeFirstPayment && firstPaymentAmount) {
      paymentSentence = ` Ik heb de eerste termijn van ${formatCurrency(parseFloat(firstPaymentAmount))} reeds overgemaakt.`;
    }

    const letter = `${userName || '<uw naam>'}
${userAddress || '<adres>'}
${userPostcode || '<postcode>'} ${userCity || '<woonplaats>'}
${userEmail || '<e-mail>'}

Aan

${creditorName}
${creditorDepartment || '<afdeling>'}
${creditorAddress || '<adres>'}
${creditorPostcode || '<postcode>'} ${creditorCity || '<plaats>'}

${userCity || '<woonplaats>'}, ${todayFormatted}
Onderwerp:      betalingsregeling
Kenmerk:         ${caseNumber}


Geachte heer, mevrouw,

Op ${formattedDate} ontving ik van u een brief waarin u namens ${creditorName} een bedrag van €\u00A0${(debt.amount || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })} van mij vordert. Ik weet dat ik dit bedrag aan ${creditorName} verschuldigd ben, maar ik ben gelet op mijn inkomsten en uitgaven niet in staat dit bedrag in één keer te betalen.

Ik verzoek u om een betalingsregeling met mij te treffen zodat ik de vordering in termijnen kan aflossen. Ik zou de vordering graag in ${numberOfMonths} gelijke termijnen van ${monthlyFormatted} voldoen.${paymentSentence}

Graag hoor ik binnen 14 dagen na dagtekening van deze brief of u met mijn betalingsvoorstel akkoord gaat. Verder vraag ik u om tijdens deze correspondentie verdere incassomaatregelen op te schorten om onnodige extra kosten te voorkomen.

Ik wacht uw spoedige reactie af.

Met vriendelijke groet,


${userName || '<naam en handtekening>'}

Bijlage: kopie invorderingsbrief`;

    return letter;
  }, [paymentFormData, debt, formatCurrency]);

  const loadData = useCallback(async () => {
    if (!debt) return;
    setLoading(true);

    try {
      const currentUser = await UserEntity.me(); // Use UserEntity
      
      const [existingArrangement, proposals, allIncomes, allCosts, allDebts] = await Promise.all([
        ArrangementProgress.filter({ debt_id: debt.id }, '-created_date', 1).then(res => res[0]),
        PaymentPlanProposal.filter({ debt_id: debt.id, template_type: { operator: 'in', value: ['dispute', 'partial_recognition', 'already_paid', 'verjaring'] } }, '-sent_date', 1),
        Income.filter({ user_id: currentUser.id }),
        MonthlyCost.filter({ user_id: currentUser.id }),
        Debt.filter({ user_id: currentUser.id })
      ]);
      
      const latestProposal = proposals[0];

      setIsDisputeContext(false);
      setIsPartialContext(false);
      setIsAlreadyPaidContext(false);
      setIsVerjaringContext(false);

      if (latestProposal) {
        if (latestProposal.template_type === 'dispute') setIsDisputeContext(true);
        if (latestProposal.template_type === 'partial_recognition') setIsPartialContext(true);
        if (latestProposal.template_type === 'already_paid') setIsAlreadyPaidContext(true);
        if (latestProposal.template_type === 'verjaring') setIsVerjaringContext(true);
      }
      
      setUser(currentUser);

      const vtblCalcResult = await vtblService.calculateVtbl(allIncomes, allCosts, allDebts);

      const { 
        vastInkomen = 0, 
        vasteLasten = 0, 
        huidigeRegelingen: totalExistingArrangements = 0,
        beschikbaar = 0, 
        tussenlastenBudget = 0, 
        bufferBudget = 0, 
        aflosCapaciteit = 0 
      } = vtblCalcResult || {};

      const currentDebtIsPaymentArrangement = debt.status === 'betalingsregeling';
      const monthlyPaymentOfCurrentDebt = debt.monthly_payment || 0;

      const effectiveHuidigeRegelingen = currentDebtIsPaymentArrangement
        ? Math.max(0, totalExistingArrangements - monthlyPaymentOfCurrentDebt)
        : totalExistingArrangements;
      
      const ruimteVoorNieuw = Math.max(0, aflosCapaciteit - effectiveHuidigeRegelingen);
      
      let calc;
      const debtAmount = debt.amount || 0;

      if (debtAmount > 0 && debtAmount <= ruimteVoorNieuw) {
         calc = {
            vastInkomen, vasteLasten, huidigeRegelingen: effectiveHuidigeRegelingen, beschikbaar,
            tussenlastenBudget, bufferBudget, aflosCapaciteit,
            ruimteVoorNieuw,
            canPayInFull: true,
            debtAmount: debtAmount
        };
      } else {
        const isHaalbaar = ruimteVoorNieuw > 10;
        const voorstel = isHaalbaar ? Math.min(ruimteVoorNieuw, 50) : 0;
        const looptijd = voorstel > 0 ? Math.ceil(debtAmount / voorstel) : Infinity;

        calc = {
          vastInkomen, vasteLasten, huidigeRegelingen: effectiveHuidigeRegelingen, beschikbaar,
          tussenlastenBudget, bufferBudget, aflosCapaciteit,
          ruimteVoorNieuw, isHaalbaar, voorstel, looptijd,
          canPayInFull: false
        };
      }
      setCalculation(calc);

      let arr = existingArrangement;
      if (!arr) {
        arr = await ArrangementProgress.create({ 
          debt_id: debt.id,
          vtbl_calculation: calc,
          proposed_amount: calc.voorstel
        });
      }
      setArrangement(arr);
      
      if(arr.step_1_completed) {
        if (latestProposal && latestProposal.template_type === 'dispute') {
            setLetterContent(generateDisputeLetter(currentUser, debt, latestProposal.dispute_reason, {
                paymentDate: latestProposal.dispute_payment_date,
                cancelDate: latestProposal.dispute_cancel_date,
                correctAmount: latestProposal.dispute_correct_amount,
                otherReason: latestProposal.dispute_details
            }));
        } else if (latestProposal && latestProposal.template_type === 'partial_recognition') {
            setLetterContent(generatePartialRecognitionLetter(currentUser, debt, {
                recognized_amount: latestProposal.recognized_amount,
                dispute_reason: latestProposal.dispute_reason,
                dispute_details: latestProposal.dispute_details,
                erkend: { totaal: latestProposal.recognized_amount },
                betwist: { totaal: latestProposal.disputed_amount }
            }));
        } else if (latestProposal && latestProposal.template_type === 'already_paid') {
            setLetterContent(generateAlreadyPaidLetter(currentUser, debt, latestProposal));
        } else if (latestProposal && latestProposal.template_type === 'verjaring') {
            setLetterContent(generateVerjaringLetter(currentUser, debt, latestProposal));
        } else if (latestProposal && latestProposal.template_type === 'proposal') {
            // If the latest proposal was a general payment proposal, pre-fill that letter
            setLetterContent(latestProposal.letter_content);
            setPaymentFormData(prev => ({
                ...prev,
                monthlyAmount: latestProposal.proposed_monthly_amount?.toString() || ''
                // TODO: potentially load other fields if they were stored in proposal.breakdown
            }));
        } else if (calc.canPayInFull) {
            setLetterContent(generatePayInFullLetter(currentUser, debt));
        }
        else {
            setLetterContent(generateLetter(currentUser, debt, calc));
        }
      }

      updateProgress(arr);

    } catch (error) {
      console.error("Error loading stappenplan data:", error);
      toast({
        title: "Fout",
        description: "Kon gegevens voor stappenplan niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [debt, toast, generateLetter, generateDisputeLetter, generatePartialRecognitionLetter, generateAlreadyPaidLetter, generateVerjaringLetter, generatePayInFullLetter]);

  useEffect(() => {
    if (isOpen) {
      setView('choice');
      setActiveTab('keuzes');
      setDisputeData(null);
      setPartialData(null);
      setAlreadyPaidData(null);
      setVerjaringData(null);
      setModificationData({ newAmount: '', duration: '' });
      setModificationType('');
      setLetterContent('');
      loadData();
    }
  }, [isOpen, loadData]);

  const updateProgress = (arr) => {
    let p = 0;
    if (arr.step_1_completed) p += 33;
    if (arr.step_2_completed) p += 34;
    if (arr.step_3_completed) p += 33;
    setProgress(p);

    if (!arr.step_1_completed) setActiveStep("stap1");
    else if (!arr.step_2_completed) setActiveStep("stap2");
    else if (!arr.step_3_completed) setActiveStep("stap3");
    else setActiveStep("stap3");
  };

  const handleStepCompletion = async (step) => {
    if (!arrangement) return;
    try {
      let updatedData = {};
      if (step === 1) updatedData.step_1_completed = true;
      if (step === 2) {
          updatedData.step_2_completed = true;
          updatedData.letter_sent_date = new Date().toISOString().split('T')[0];
          await Debt.update(debt.id, { status: 'wachtend' });
      }
      if (step === 3) updatedData.step_3_completed = true;

      const updatedArr = await ArrangementProgress.update(arrangement.id, updatedData);
      setArrangement(updatedArr);
      updateProgress(updatedArr);

      if (step === 1) {
        let letter;
        if (calculation.canPayInFull) {
            letter = generatePayInFullLetter(user, debt);
        } else {
            letter = generateLetter(user, debt, calculation);
        }
        setLetterContent(letter);
        setActiveStep("stap2");
      }
       if (step === 2) {
        setActiveStep("stap3");
      }

      toast({
        title: "Succes",
        description: `Stap ${step} voltooid!`,
      });
    } catch (error) {
      toast({
        title: "Fout",
        description: `Fout bij voltooien van stap ${step}.`,
        variant: "destructive",
      });
      console.error("Error completing step:", error);
    }
  };
  
  const handleFollowUp = async (response) => {
    if (!arrangement) return;
    
    if (isDisputeContext || isPartialContext || isAlreadyPaidContext || isVerjaringContext) {
        try {
            const templateType = 
                isDisputeContext ? 'dispute' : 
                isPartialContext ? 'partial_recognition' : 
                isAlreadyPaidContext ? 'already_paid' : 
                'verjaring';
            const latestProposal = await PaymentPlanProposal.filter({ debt_id: debt.id, template_type: templateType}, '-sent_date', 1).then(res => res[0]);
            
            if (response === 'accepted') {
                let debtUpdate = {};
                if (isDisputeContext) {
                    debtUpdate = { status: 'afbetaald', resolved_date: new Date().toISOString(), resolved_reason: 'betwisting_erkend' };
                } else if (isPartialContext) {
                    debtUpdate = {
                        amount: latestProposal.recognized_amount,
                        status: 'betalingsregeling',
                        resolved_date: new Date().toISOString(),
                        resolved_reason: 'gedeeltelijke_erkenning_erkend'
                    };
                } else if (isAlreadyPaidContext) {
                    debtUpdate = { status: 'afbetaald', resolved_date: new Date().toISOString(), resolved_reason: 'already_paid_confirmed' };
                } else if (isVerjaringContext) {
                    debtUpdate = { status: 'afbetaald', resolved_date: new Date().toISOString(), resolved_reason: 'verjaard' };
                }
                
                await Debt.update(debt.id, debtUpdate);
                if (latestProposal) await PaymentPlanProposal.update(latestProposal.id, { status: 'accepted', response_date: new Date().toISOString() });
                toast({ title: "Succes!", description: "De schuld is bijgewerkt." });

            } else if (response === 'rejected') {
                if (isAlreadyPaidContext) {
                    await Debt.update(debt.id, { status: 'niet_actief' });
                    toast({ title: "Actie vereist", description: "De schuldeiser zegt de betaling niet ontvangen te hebben. Neem contact op met je bank.", variant: "warning" });
                } else if (isVerjaringContext) {
                    await Debt.update(debt.id, { status: 'niet_actief' });
                    toast({ title: "Actie vereist", description: "De schuldeiser betwist de verjaring. Raadpleeg een jurist.", variant: "warning" });
                }
                else {
                    await Debt.update(debt.id, { status: 'niet_actief' });
                    toast({ title: "Actie vereist", description: "De betwisting/gedeeltelijke erkenning is afgewezen. De schuld is weer 'Niet actief'.", variant: "warning" });
                }
                 if (latestProposal) await PaymentPlanProposal.update(latestProposal.id, { status: 'rejected', response_date: new Date().toISOString() });
            } else if (response === 'no_response') {
                 if (latestProposal) await PaymentPlanProposal.update(latestProposal.id, { status: 'reminder_sent' });
                 toast({ title: "Herinnering", description: "Verstuur een herinnering naar de schuldeiser (tip volgt).", variant: "info" });
            }
            
            await ArrangementProgress.update(arrangement.id, { step_3_completed: true });
            onClose();
            return;
        } catch (error) {
            toast({ title: "Fout", description: "Kon de status niet bijwerken.", variant: "destructive" });
            console.error("Follow-up error:", error);
            return;
        }
    }

    if (!calculation || !debt) return;
    try {
      const updatedArr = await ArrangementProgress.update(arrangement.id, {
        creditor_response: response,
        step_3_completed: true,
      });
      setArrangement(updatedArr);

      if (response === 'accepted' && calculation.isHaalbaar) {
        await Debt.update(debt.id, {
          status: 'betalingsregeling',
          monthly_payment: calculation.voorstel,
          payment_plan_date: new Date().toISOString().split('T')[0],
        });
        toast({
          title: "Akkoord!",
          description: "De schuld is nu 'actief' met een betalingsregeling.",
        });
      } else if (response === 'accepted' && !calculation.isHaalbaar) {
        await Debt.update(debt.id, { status: 'pauze' });
        toast({
          title: "Schuldrust geaccepteerd!",
          description: "De invordering is gepauzeerd.",
        });
      } else if (response === 'accepted' && calculation.canPayInFull) {
        await Debt.update(debt.id, {
          status: 'afbetaald',
          resolved_date: new Date().toISOString().split('T')[0],
          resolved_reason: 'eenmalige_betaling_overeengekomen',
        });
        toast({
          title: "Akkoord!",
          description: "De schuld is nu 'afbetaald' via een eenmalige betaling.",
        });
      }
      else if (response === 'rejected') {
        toast({
          title: "Informatie",
          description: "De schuldeiser heeft de regeling geweigerd. Overweeg schuldhulpverlening.",
          variant: "warning",
        });
      } else if (response === 'no_response') {
        toast({
          title: "Informatie",
          description: "Geen reactie ontvangen. Overweeg een herinnering te sturen.",
          variant: "info",
        });
      } else {
        toast({
          title: "Succes",
          description: "Status van regeling bijgewerkt!",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Fout",
        description: "Fout bij het bijwerken van de status.",
        variant: "destructive",
      });
      console.error("Follow-up error:", error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letterContent);
    setCopied(true);
    toast({
      title: "Gekopieerd!",
      description: "De brief is naar je klembord gekopieerd.",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadTxtFile = () => {
    const element = document.createElement("a");
    const file = new Blob([letterContent], {type: 'text/plain'});
    let filename;
    if (isDisputeContext || view === 'dispute-letter') {
        filename = `betwistingsbrief_${debt.creditor_name}.txt`;
    } else if (isPartialContext || view === 'partial-letter') {
        filename = `gedeeltelijke_erkenning_${debt.creditor_name}.txt`;
    } else if (isAlreadyPaidContext || view === 'already-paid-letter') {
        filename = `bewijs_al_betaald_${debt.creditor_name}.txt`;
    } else if (isVerjaringContext || view === 'verjaring-letter') {
        filename = `beroep_verjaring_${debt.creditor_name}.txt`;
    } else if (view === 'incassokosten-letter') {
        filename = `bezwaar_incassokosten_${debt.creditor_name}.txt`;
    } else if (view === 'payment-letter') {
        filename = `betalingsregeling_juridisch_loket_${debt.creditor_name}.txt`;
    }
    else if (modificationType === 'lowering_amount') {
        filename = `verzoek_verlaging_maandbedrag_${debt.creditor_name}.txt`;
    } else if (modificationType === 'payment_holiday') {
        filename = `verzoek_betalingsvakantie_${debt.creditor_name}.txt`;
    } else if (modificationType === 'stop_debt_counseling') {
        filename = `melding_stop_regeling_schuldhulp_${debt.creditor_name}.txt`;
    }
    else {
        filename = `betalingsvoorstel_${debt.creditor_name}.txt`;
    }
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({
      title: "Gedownload!",
      description: "De brief is gedownload als tekstbestand.",
    });
  };

  const handleGenerateDisputeLetter = (reason, details) => {
    setDisputeData({ reason, details });
    const letter = generateDisputeLetter(user, debt, reason, details);
    setLetterContent(letter);
    setView('dispute-letter');
  };

  const handleGeneratePartialLetter = (data) => {
    setPartialData(data);
    const letter = generatePartialRecognitionLetter(user, debt, data);
    setLetterContent(letter);
    setView('partial-letter');
  };

  const handleGenerateAlreadyPaidLetter = (data) => {
    setAlreadyPaidData(data);
    const letter = generateAlreadyPaidLetter(user, debt, data);
    setLetterContent(letter);
    setView('already-paid-letter');
  };

  const handleGenerateVerjaringLetter = (data) => {
    setVerjaringData(data);
    const letter = generateVerjaringLetter(user, debt, data);
    setLetterContent(letter);
    setView('verjaring-letter');
  };

  const handleGenerateIncassokostenLetter = (data) => {
    setIncassokostenData(data);
    const letter = generateIncassokostenLetter(user, debt, data);
    setLetterContent(letter);
    setView('incassokosten-letter');
  };

  const handleMarkDisputeAsSent = async () => {
    if (!debt || !disputeData || !letterContent) {
        toast({ title: "Fout", description: "Kon de benodigde gegevens niet vinden.", variant: "destructive" });
        return;
    }

    try {
        await Debt.update(debt.id, {
            status: 'wachtend',
            dispute_sent_date: new Date().toISOString().split('T')[0]
        });

        await PaymentPlanProposal.create({
            debt_id: debt.id,
            template_type: 'dispute',
            letter_content: letterContent,
            sent_date: new Date().toISOString().split('T')[0],
            status: 'sent',
            dispute_reason: disputeData.reason,
            dispute_details: disputeData.details?.otherReason || disputeData.details?.paymentReference || null,
            dispute_payment_date: disputeData.details?.paymentDate || null,
            dispute_cancel_date: disputeData.details?.cancelDate || null,
            dispute_correct_amount: disputeData.details?.correctAmount ? parseFloat(disputeData.details.correctAmount) : null,
        });

        let arr = arrangement;
        if (!arr) {
          arr = await ArrangementProgress.create({ debt_id: debt.id });
        }
        await ArrangementProgress.update(arr.id, {
          step_1_completed: true,
          step_2_completed: true,
          letter_sent_date: new Date().toISOString().split('T')[0],
        });


        toast({
            title: "Verstuurd!",
            description: "De status van de schuld is bijgewerkt naar 'Wachtend'.",
        });

        onClose();
    } catch (error) {
        console.error("Failed to mark dispute as sent:", error);
        toast({
            title: "Fout",
            description: "Er is iets misgegaan bij het opslaan van de gegevens.",
            variant: "destructive",
        });
    }
  };

  const handleMarkPartialAsSent = async () => {
    if (!debt || !partialData || !letterContent) {
        toast({ title: "Fout", description: "Kon de benodigde gegevens niet vinden.", variant: "destructive" });
        return;
    }

    try {
        await Debt.update(debt.id, {
            status: 'wachtend',
            partial_settlement: true,
            dispute_sent_date: new Date().toISOString().split('T')[0],
            recognized_amount: partialData.erkend.totaal
        });

        await PaymentPlanProposal.create({
            debt_id: debt.id,
            template_type: 'partial_recognition',
            letter_content: letterContent,
            sent_date: new Date().toISOString().split('T')[0],
            status: 'sent',
            dispute_reason: partialData.reason,
            dispute_details: partialData.details,
            recognized_amount: partialData.erkend.totaal,
            disputed_amount: partialData.betwist.totaal,
            breakdown: partialData
        });

        let arr = arrangement;
        if (!arr) {
          arr = await ArrangementProgress.create({ debt_id: debt.id });
        }
        await ArrangementProgress.update(arr.id, {
          step_1_completed: true,
          step_2_completed: true,
          letter_sent_date: new Date().toISOString().split('T')[0],
        });

        toast({
            title: "Verstuurd!",
            description: "De status van de schuld is bijgewerkt naar 'Wachtend' voor gedeeltelijke erkenning.",
        });

        onClose();
    } catch (error) {
        console.error("Failed to mark partial recognition as sent:", error);
        toast({
            title: "Fout",
            description: "Er is iets misgegaan bij het opslaan van de gegevens.",
            variant: "destructive",
        });
    }
};

const handleMarkAlreadyPaidAsSent = async () => {
    if (!debt || !alreadyPaidData || !letterContent) {
        toast({ title: "Fout", description: "Kon de benodigde gegevens niet vinden.", variant: "destructive" });
        return;
    }

    try {
        await Debt.update(debt.id, {
            status: 'wachtend',
            already_paid_claim_date: new Date().toISOString().split('T')[0],
        });

        await PaymentPlanProposal.create({
            debt_id: debt.id,
            template_type: 'already_paid',
            letter_content: letterContent,
            sent_date: new Date().toISOString().split('T')[0],
            status: 'sent',
            ...alreadyPaidData
        });

        let arr = arrangement;
        if (!arr) {
          arr = await ArrangementProgress.create({ debt_id: debt.id });
        }
        await ArrangementProgress.update(arr.id, {
          step_1_completed: true,
          step_2_completed: true,
          letter_sent_date: new Date().toISOString().split('T')[0],
        });

        toast({
            title: "Verstuurd!",
            description: "De status van de schuld is bijgewerkt naar 'Wachtend'.",
        });

        onClose();
    } catch (error) {
        console.error("Failed to mark 'already paid' as sent:", error);
        toast({
            title: "Fout",
            description: "Er is iets misgegaan bij het opslaan van de gegevens.",
            variant: "destructive",
        });
    }
};

const handleMarkVerjaringAsSent = async () => {
    if (!debt || !verjaringData || !letterContent) {
        toast({ title: "Fout", description: "Kon de benodigde gegevens niet vinden.", variant: "destructive" });
        return;
    }

    try {
        await Debt.update(debt.id, {
            status: 'wachtend',
            verjaring_claim_date: new Date().toISOString().split('T')[0],
        });

        await PaymentPlanProposal.create({
            debt_id: debt.id,
            template_type: 'verjaring',
            letter_content: letterContent,
            sent_date: new Date().toISOString().split('T')[0],
            status: 'sent',
            ...verjaringData
        });

        let arr = arrangement;
        if (!arr) {
          arr = await ArrangementProgress.create({ debt_id: debt.id });
        }
        await ArrangementProgress.update(arr.id, {
          step_1_completed: true,
          step_2_completed: true,
          letter_sent_date: new Date().toISOString().split('T')[0],
        });

        toast({
            title: "Verstuurd!",
            description: "De status van de schuld is bijgewerkt naar 'Wachtend'.",
        });

        onClose();
    } catch (error) {
        console.error("Failed to mark 'verjaring' as sent:", error);
        toast({
            title: "Fout",
            description: "Er is iets misgegaan bij het opslaan van de gegevens.",
            variant: "destructive",
        });
    }
};

  const handleMarkIncassokostenAsSent = async () => {
    if (!debt || !incassokostenData || !letterContent) {
        toast({ title: "Fout", description: "Kon de benodigde gegevens niet vinden.", variant: "destructive" });
        return;
    }

    try {
        await Debt.update(debt.id, {
            status: 'wachtend',
        });

        await PaymentPlanProposal.create({
            debt_id: debt.id,
            template_type: 'incassokosten_bezwaar',
            letter_content: letterContent,
            sent_date: new Date().toISOString().split('T')[0],
            status: 'sent',
            ...incassokostenData
        });

        let arr = arrangement;
        if (!arr) {
          arr = await ArrangementProgress.create({ debt_id: debt.id });
        }
        await ArrangementProgress.update(arr.id, {
          step_1_completed: true,
          step_2_completed: true,
          letter_sent_date: new Date().toISOString().split('T')[0],
        });

        toast({
            title: "Verstuurd!",
            description: "De status van de schuld is bijgewerkt naar 'Wachtend'.",
        });

        onClose();
    } catch (error) {
        console.error("Failed to mark 'incassokosten bezwaar' as sent:", error);
        toast({
            title: "Fout",
            description: "Er is iets misgegaan bij het opslaan van de gegevens.",
            variant: "destructive",
        });
    }
  };

  const handleMarkModificationAsSent = async (templateType) => {
    if (!debt || !letterContent) {
        toast({ title: "Fout", description: "Kon de benodigde gegevens niet vinden.", variant: "destructive" });
        return;
    }

    try {
        let proposalData = {
            debt_id: debt.id,
            template_type: templateType,
            letter_content: letterContent,
            sent_date: new Date().toISOString().split('T')[0],
            status: 'sent',
        };

        if (templateType === 'lowering_amount') {
            proposalData.requested_new_amount = parseFloat(modificationData.newAmount);
        } else if (templateType === 'payment_holiday') {
            proposalData.requested_duration_months = parseInt(modificationData.duration);
        }
        
        await PaymentPlanProposal.create(proposalData);
        
        if (templateType === 'stop_debt_counseling') {
            await Debt.update(debt.id, { status: 'pauze', resolved_reason: 'schuldhulp_aangevraagd' });
        }

        toast({
            title: "Verzoek verstuurd!",
            description: "Je verzoek om wijziging is opgeslagen. Wacht op reactie van de schuldeiser.",
        });

        onClose();
    } catch (error) {
        console.error("Failed to mark modification as sent:", error);
        toast({ title: "Fout", description: "Kon verzoek niet opslaan.", variant: "destructive" });
    }
  };

  // Laad gebruiker gegevens in formulier vanuit profiel
  const loadUserDataIntoForm = useCallback(() => {
    if (!user) return;

    // Construct full name from voornaam + achternaam, fallback to full_name
    const fullName = [user.voornaam, user.achternaam].filter(Boolean).join(' ') || user.full_name || '';

    // Parse adres field: may contain "Straat 123, 1234AB Plaats" or just "Straat 123"
    let parsedAddress = user.adres || user.address || '';
    let parsedPostcode = user.postal_code || '';
    let parsedCity = user.city || '';

    // Try to extract postcode and city from adres if not set separately
    if (parsedAddress && (!parsedPostcode || !parsedCity)) {
      const addressParts = parsedAddress.split(',').map(s => s.trim());
      if (addressParts.length >= 2) {
        parsedAddress = addressParts[0];
        const postcodeMatch = addressParts[1].match(/^(\d{4}\s?[A-Za-z]{2})\s+(.+)$/);
        if (postcodeMatch) {
          parsedPostcode = parsedPostcode || postcodeMatch[1];
          parsedCity = parsedCity || postcodeMatch[2];
        }
      }
    }

    setPaymentFormData(prev => ({
      ...prev,
      userName: fullName,
      userAddress: parsedAddress,
      userPostcode: parsedPostcode,
      userCity: parsedCity,
      userEmail: user.email || '',
      monthlyAmount: calculation?.voorstel?.toString() || prev.monthlyAmount || '',
    }));
  }, [user, calculation]);

  // 🆕 NIEUWE FUNCTIE: Opslaan betalingsregelingsbrief
  const handleSavePaymentLetter = async () => {
    if (!debt || !letterContent) {
      toast({ title: "Fout", description: "Kon brief niet opslaan.", variant: "destructive" });
      return;
    }

    try {
      await PaymentPlanProposal.create({
        debt_id: debt.id,
        template_type: 'proposal', // This is a general payment proposal
        letter_content: letterContent,
        sent_date: new Date().toISOString().split('T')[0],
        status: 'sent',
        original_amount: debt.amount,
        proposed_monthly_amount: parseFloat(paymentFormData.monthlyAmount) || null,
        breakdown: paymentFormData // Save the form data for re-editing later if needed
      });

      await Debt.update(debt.id, {
        status: 'wachtend',
      });

      toast({
        title: "Opgeslagen!",
        description: "Je betalingsregelingsbrief is opgeslagen en de schuldstatus bijgewerkt naar 'Wachtend'.",
      });

      onClose();
    } catch (error) {
      console.error("Failed to save payment letter:", error);
      toast({ title: "Fout", description: "Kon brief niet opslaan.", variant: "destructive" });
    }
  };


  const renderChoiceView = () => {
    if (!debt) {
      return null;
    }

    if (debt.status === 'betalingsregeling' || debt.status === 'pauze') {
        return (
            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold text-center">Wat wil je aanpassen aan je regeling met {debt.creditor_name}?</h3>
                <Card onClick={() => {setView('lowering_amount'); setModificationType('lowering_amount');}} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                    <CardContent className="p-4 flex items-start gap-4">
                        <ChevronsRight className="w-8 h-8 text-orange-600"/>
                        <div>
                            <h4 className="font-bold">Verlaging maandbedrag</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Als je het huidige bedrag niet meer kunt betalen.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card onClick={() => {setView('payment_holiday'); setModificationType('payment_holiday');}} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                    <CardContent className="p-4 flex items-start gap-4">
                        <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
                        <div>
                            <h4 className="font-bold">Betalingsvakantie</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pauzeer je betalingen tijdelijk door onvoorziene omstandigheden.</p>
                        </div>
                    </CardContent>
                </Card>
                <Card onClick={() => {setView('stop_debt_counseling'); setModificationType('stop_debt_counseling');}} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                    <CardContent className="p-4 flex items-start gap-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400"/>
                        <div>
                            <h4 className="font-bold">Regeling stoppen & schuldhulp</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Als je de regeling niet meer kunt voortzetten en professionele hulp zoekt.</p>
                        </div>
                    </CardContent>
                </Card>
                 <Button variant="ghost" onClick={() => { setView('proposal'); setActiveTab('stappenplan'); setModificationType(''); }} className="w-full">
                    Toch een nieuwe regeling voor een andere schuld starten?
                 </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-center">Wat is de situatie met {debt.creditor_name}?</h3>
            
            {/* 🆕 NIEUWE OPTIE: JURIDISCH LOKET BETALINGSREGELING */}
            <Card onClick={() => {
              loadUserDataIntoForm();
              setView('payment-arrangement-form');
            }} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a] border-2 border-green-200 dark:border-green-800">
                <CardContent className="p-4 flex items-start gap-4">
                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400"/>
                    <div>
                        <h4 className="font-bold">📋 Betalingsregeling Opstellen</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Template van het Juridisch Loket - professioneel en volledig.</p>
                    </div>
                </CardContent>
            </Card>

            <Card onClick={() => { setView('proposal'); setActiveTab('stappenplan'); setModificationType(''); }} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                <CardContent className="p-4 flex items-start gap-4">
                    <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
                    <div>
                        <h4 className="font-bold">Automatisch Voorstel (VTBL)</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Laat ons een voorstel genereren op basis van je budget.</p>
                    </div>
                </CardContent>
            </Card>
             <Card onClick={() => setView('already-paid')} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                <CardContent className="p-4 flex items-start gap-4">
                    <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
                    <div>
                        <h4 className="font-bold">Ik heb dit al betaald</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">We sturen een betalingsbewijs naar de schuldeiser.</p>
                    </div>
                </CardContent>
            </Card>
             <Card onClick={() => setView('partial-recognition')} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                <CardContent className="p-4 flex items-start gap-4">
                    <FileWarning className="w-8 h-8 text-yellow-600"/>
                    <div>
                        <h4 className="font-bold">Het bedrag klopt niet (gedeeltelijk)</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">We erkennen een deel van de schuld en betwisten de rest.</p>
                    </div>
                </CardContent>
            </Card>
            <Card onClick={() => setView('verjaring')} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                <CardContent className="p-4 flex items-start gap-4">
                    <Clock className="w-8 h-8 text-purple-600"/>
                    <div>
                        <h4 className="font-bold">De schuld is te oud (verjaard)</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">We controleren de verjaringstermijn en stellen een brief op.</p>
                    </div>
                </CardContent>
            </Card>
            <Card onClick={() => setView('dispute')} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                <CardContent className="p-4 flex items-start gap-4">
                    <MessageSquareWarning className="w-8 h-8 text-orange-600"/>
                    <div>
                        <h4 className="font-bold">Ik erken de schuld NIET</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">We stellen een brief op om de schuld volledig te betwisten.</p>
                    </div>
                </CardContent>
            </Card>
            <Card onClick={() => setView('incassokosten')} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a2a2a] dark:bg-[#2a2a2a]">
                <CardContent className="p-4 flex items-start gap-4">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400"/>
                    <div>
                        <h4 className="font-bold">Bezwaar tegen incassokosten</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Maak bezwaar tegen onterechte incassokosten via het Juridisch Loket template.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  };
  
  const renderLoweringAmountView = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => { setView('choice'); setActiveTab('keuzes'); }}>{'< Terug naar keuzes'}</Button>
      <h3 className="text-lg font-semibold">Verlaging maandbedrag</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Je huidige regeling is {formatCurrency(debt.monthly_payment || 0)} per maand. Wat is het nieuwe bedrag dat je maandelijks wél kunt betalen?</p>
      <div>
        <Label htmlFor="newAmount">Nieuw maandbedrag</Label>
        <Input 
            id="newAmount"
            type="number"
            placeholder="bijv. 25.00"
            value={modificationData.newAmount}
            onChange={(e) => setModificationData(p => ({...p, newAmount: e.target.value}))}
        />
      </div>
      <Button 
        onClick={() => {
            setLetterContent(generateLoweringAmountLetter(user, debt, modificationData.newAmount));
            setView('modification-letter');
        }}
        disabled={!modificationData.newAmount || parseFloat(modificationData.newAmount) <= 0}
        className="w-full"
      >
        Genereer brief
      </Button>
    </div>
  );

  const renderPaymentHolidayView = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => { setView('choice'); setActiveTab('keuzes'); }}>{'< Terug naar keuzes'}</Button>
      <h3 className="text-lg font-semibold">Betalingsvakantie</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Voor hoeveel maanden wil je de betalingen pauzeren? (Normaal is 1-3 maanden)</p>
      <div>
        <Label htmlFor="duration">Aantal maanden</Label>
        <Input 
            id="duration"
            type="number"
            placeholder="bijv. 3"
            value={modificationData.duration}
            onChange={(e) => setModificationData(p => ({...p, duration: e.target.value}))}
        />
      </div>
      <Button 
        onClick={() => {
            setLetterContent(generatePaymentHolidayLetter(user, debt, modificationData.duration));
            setView('modification-letter');
        }}
        disabled={!modificationData.duration || parseInt(modificationData.duration) <= 0}
        className="w-full"
      >
        Genereer brief
      </Button>
    </div>
  );
  
  const renderStopCounselingView = () => (
     <div className="space-y-4">
      <Button variant="ghost" onClick={() => { setView('choice'); setActiveTab('keuzes'); }}>{'< Terug naar keuzes'}</Button>
      <h3 className="text-lg font-semibold">Stopzetten regeling & aanmelden schuldhulp</h3>
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Dit is een serieuze stap. De brief informeert de schuldeiser dat je stopt met betalen en dat een professionele schuldhulpverlener contact zal opnemen.</p>
        </CardContent>
      </Card>
      <p className="text-sm text-gray-600 dark:text-gray-400">Je kunt in de gegenereerde brief zelf invullen bij welke instantie je je hebt aangemeld.</p>
      <Button 
        onClick={() => {
            setLetterContent(generateStopCounselingLetter(user, debt));
            setView('modification-letter');
        }}
        className="w-full"
      >
        Genereer brief
      </Button>
    </div>
  );

  const renderModificationLetterView = () => (
    <EmailPreview
      letterContent={letterContent}
      onLetterChange={(val) => setLetterContent(val)}
      recipientName={debt?.creditor_name || 'Schuldeiser'}
      recipientType={debt?.creditor_type || 'Schuldeiser'}
      subject={getLetterSubject()}
      senderName={user?.full_name || 'Gebruiker'}
      onSend={() => handleMarkModificationAsSent(modificationType)}
      sendButtonText="Ik heb het verzoek verstuurd"
      onBack={() => { setView('choice'); setActiveTab('keuzes'); }}
      backText="Terug naar keuzes"
      calculation={calculation}
      tipText={getLetterTip()}
      infoTitle="Uw Rechten"
      infoText="Een schuldeiser is verplicht uw verzoek serieus in overweging te nemen. Bewaar altijd een kopie van uw correspondentie."
    />
  );
  
  const renderStep1 = () => {
    if (loading || !calculation) return <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    if (calculation.canPayInFull) {
        return (
            <div className="space-y-4">
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">{t('debtSuggestion.canPayInFullTitle')}</h4>
                        <p className="text-sm text-green-700 dark:text-green-300">{t('debtSuggestion.canPayInFullInfo')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardContent className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span>{t('debtSuggestion.debtAmountLabel')}:</span> <span className="font-medium">{formatCurrency(calculation.debtAmount)}</span></div>
                        <div className="flex justify-between"><span>{t('debtSuggestion.availableAmountLabel')}:</span> <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(calculation.ruimteVoorNieuw)}</span></div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-50 dark:bg-[#2a2a2a]">
                    <CardContent className="p-4">
                        <p className="text-sm font-semibold mb-2">💡 {t('debtSuggestion.adviceTitle')}:</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{t('debtSuggestion.adviceContent')}</p>
                    </CardContent>
                </Card>
                {!arrangement?.step_1_completed && (
                    <Button onClick={() => handleStepCompletion(1)} className="w-full bg-green-600 hover:bg-green-700">
                        <CheckCircle2 className="w-4 h-4 mr-2"/>
                        {t('debtSuggestion.generatePayInFullLetterButton')}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {calculation.isHaalbaar ? (
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                        <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ Goed nieuws! Er is ruimte voor een regeling.</h4>
                        <p className="text-sm text-green-700 dark:text-green-300">Op basis van je inkomsten en lasten, kunnen we een realistisch voorstel doen.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-4">
                        <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">🚨 Let op: Geen financiële ruimte.</h4>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Je budget is volledig benut. We maken een 'schuldrust' brief om tijd te winnen.</p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Vast inkomen:</span> <span className="font-medium">{formatCurrency(calculation.vastInkomen)}</span></div>
                    <div className="flex justify-between"><span>- Vaste lasten:</span> <span className="font-medium">{formatCurrency(calculation.vasteLasten)}</span></div>
                    <div className="flex justify-between border-t pt-2 mt-2"><strong>Beschikbaar voor levensonderhoud:</strong> <strong className="font-medium">{formatCurrency(calculation.beschikbaar)}</strong></div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>  (Na vaste lasten)</span></div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>  - Waarvan Tussenlasten Budget (60%):</span> <span className="font-medium">{formatCurrency(calculation.tussenlastenBudget)}</span></div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>  - Waarvan Buffer Budget (25%):</span> <span className="font-medium">{formatCurrency(calculation.bufferBudget)}</span></div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>  - Waarvan Afloscapaciteit (15%):</span> <span className="font-medium">{formatCurrency(calculation.aflosCapaciteit)}</span></div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span>Afloscapaciteit (15% van beschikbaar):</span> <span className="font-medium">{formatCurrency(calculation.aflosCapaciteit)}</span></div>
                    <div className="flex justify-between"><span>- Huidige regelingen:</span> <span className="font-medium">{formatCurrency(calculation.huidigeRegelingen)}</span></div>
                    <div className={`flex justify-between border-t pt-2 mt-2 font-bold ${calculation.isHaalbaar ? 'text-green-600' : 'text-red-600'}`}>
                        <span>Ruimte voor nieuwe regeling:</span>
                        <span>{formatCurrency(calculation.ruimteVoorNieuw)}</span>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="bg-gray-50 dark:bg-[#2a2a2a]">
                <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-2">💡 Ons voorstel voor {debt.creditor_name}:</p>
                    {calculation.isHaalbaar ? (
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">{formatCurrency(calculation.voorstel)} / maand <span className="text-sm font-normal text-gray-600 dark:text-gray-400">(~{calculation.looptijd} maanden)</span></p>
                    ) : (
                        <p className="text-lg font-bold text-orange-700 dark:text-orange-300">Pauzeringsverzoek (Schuldrust)</p>
                    )}
                </CardContent>
            </Card>
            
            {!arrangement?.step_1_completed && (
                <Button onClick={() => handleStepCompletion(1)} className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-2"/>
                    Markeer als Voltooid
                </Button>
            )}
        </div>
    );
  };
  
  const renderStep2 = () => (
    <EmailPreview
      letterContent={letterContent}
      onLetterChange={(val) => setLetterContent(val)}
      recipientName={debt?.creditor_name || 'Schuldeiser'}
      recipientType={debt?.creditor_type || 'Schuldeiser'}
      subject={getLetterSubject()}
      senderName={user?.full_name || 'Gebruiker'}
      onSend={!arrangement?.step_2_completed ? () => handleStepCompletion(2) : undefined}
      sendButtonText="Ik heb de brief verstuurd"
      calculation={calculation}
      tipText="Alle belangrijke informatie staat al in de brief. Controleer en verstuur per e-mail of post."
      infoTitle="Automatisch Opgesteld"
      infoText="Deze brief is automatisch opgesteld op basis van je VTLB-berekening en financiële gegevens."
    />
  );

  const renderStep3 = () => (
      <div className="space-y-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">✅ Goed werk! Je bent nu in de wachtfase.</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Je hebt alles gedaan wat je nu kunt doen. Sluit dit venster en kom over 2-3 weken terug om de reactie van {debt.creditor_name} vast te leggen.
                  </p>
              </CardContent>
          </Card>

          <Card>
              <CardContent className="p-4">
                  <p className="text-sm font-medium">Brief verstuurd op: {arrangement?.letter_sent_date ? new Date(arrangement.letter_sent_date).toLocaleDateString('nl-NL') : 'N.v.t.'}</p>
              </CardContent>
          </Card>

          <h4 className="font-semibold pt-2">Wat was de reactie?</h4>
          
          {(isDisputeContext || isPartialContext || isAlreadyPaidContext || isVerjaringContext) ? (
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => handleFollowUp('accepted')}>
                <div>
                  <p>✅ {
                    isAlreadyPaidContext ? 'Betaling erkend & vordering ingetrokken' : 
                    isVerjaringContext ? 'Verjaring erkend & vordering ingetrokken' :
                    isDisputeContext ? 'Betwisting is erkend' : 
                    'Voorstel is aangenomen'
                  }</p>
                  <p className="text-xs text-muted-foreground text-left">De schuld wordt kwijtgescholden of gecorrigeerd.</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => handleFollowUp('no_response')}>
                <div>
                  <p>🤔 Geen reactie na 3 weken</p>
                  <p className="text-xs text-muted-foreground text-left">Stuur een herinnering (tip volgt).</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => handleFollowUp('rejected')}>
                <div>
                  <p>❌ {
                    isAlreadyPaidContext ? 'Betaling niet gevonden door schuldeiser' :
                    isVerjaringContext ? 'Verjaring wordt betwist' :
                    'Betwisting/Voorstel is afgewezen'
                  }</p>
                  <p className="text-xs text-muted-foreground text-left">{
                    isAlreadyPaidContext ? 'Neem contact op met je bank.' :
                    isVerjaringContext ? 'Check het bewijs van de schuldeiser. Overweeg juridische hulp.' :
                    'Overweeg een ander voorstel of zoek hulp.'
                  }</p>
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => handleFollowUp('accepted')}>
                    <div>
                      <p>✅ Schuldeiser is akkoord</p>
                      <p className="text-xs text-muted-foreground text-left">Sla de regeling op in de app.</p>
                    </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => handleFollowUp('no_response')}>
                    <div>
                      <p>🤔 Geen reactie na 3 weken</p>
                      <p className="text-xs text-muted-foreground text-left">Stuur een herinnering (tip volgt).</p>
                    </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto py-3" onClick={() => handleFollowUp('rejected')}>
                    <div>
                      <p>❌ Schuldeiser weigert</p>
                      <p className="text-xs text-muted-foreground text-left">Zoek direct schuldhulpverlening.</p>
                    </div>
                </Button>
            </div>
          )}

          <Button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700 mt-4">
            Sluiten en later opvolgen
          </Button>
      </div>
  );

  const renderProposalView = () => {
    if (loading || !calculation || !arrangement) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    const steps = [
      { id: "stap1", title: "Check je budget", subtitle: "We berekenen je afloscapaciteit.", content: renderStep1(), completed: arrangement.step_1_completed },
      { id: "stap2", title: "Verstuur je voorstel", subtitle: "Stuur de brief naar de schuldeiser.", content: renderStep2(), completed: arrangement.step_2_completed },
      { id: "stap3", title: "Wacht op reactie", subtitle: "Noteer de reactie en pas je plan aan.", content: renderStep3(), completed: arrangement.step_3_completed },
    ];

    return (
      <div className="space-y-4 pt-4">
        <div className="px-4">
          <Progress value={progress} className="w-full" />
        </div>
        <Accordion type="single" value={activeStep} onValueChange={setActiveStep} collapsible>
          {steps.map((step, index) => (
            <AccordionItem value={step.id} key={step.id}>
              <AccordionTrigger>
                <StepHeader step={index + 1} title={step.title} subtitle={step.subtitle} isCompleted={step.completed} isCurrent={activeStep === step.id} />
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {step.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };
  
  const getLetterSubject = (viewType) => {
    if (viewType === 'dispute' || isDisputeContext) return `Betwisting vordering - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    if (viewType === 'partial' || isPartialContext) return `Gedeeltelijke erkenning - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    if (viewType === 'already-paid' || isAlreadyPaidContext) return `Betaalde rekening - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    if (viewType === 'verjaring' || isVerjaringContext) return `Verjaarde rekening - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    if (viewType === 'incassokosten') return `Bezwaar incassokosten - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    if (modificationType === 'lowering_amount') return `Verzoek verlaging maandbedrag - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    if (modificationType === 'payment_holiday') return `Verzoek betalingsvakantie - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    if (modificationType === 'stop_debt_counseling') return `Stopzetting regeling - Dossier ${debt?.case_number || '[Dossiernummer]'}`;
    return `Betalingsvoorstel inzake dossier ${debt?.case_number || '[Dossiernummer]'}`;
  };

  const getLetterTip = (viewType) => {
    if (viewType === 'dispute') return 'Voeg bewijsstukken toe zoals betalingsbewijzen of correspondentie.';
    if (viewType === 'already-paid') return 'Vergeet niet het betalingsbewijs als bijlage mee te sturen!';
    if (viewType === 'verjaring') return 'Een schuld verjaart na 5 jaar (consumentenschulden) of 20 jaar (overig).';
    if (viewType === 'incassokosten') return 'U heeft 7 dagen om bezwaar te maken. Stuur de brief aangetekend.';
    if (modificationType === 'payment_holiday') return 'Een betalingsvakantie is meestal 1-3 maanden. Leg uw situatie goed uit.';
    return 'Vergeet niet de datum en het bedrag te controleren voordat je verstuurt.';
  };

  const GenericLetterView = ({ onBack, title, letterContent: content, onLetterChange, onMarkAsSent, markAsSentText, viewType, attachmentName: attachment }) => (
    <EmailPreview
      letterContent={content || letterContent}
      onLetterChange={(val) => setLetterContent(val)}
      recipientName={debt?.creditor_name || 'Schuldeiser'}
      recipientType={debt?.creditor_type || 'Schuldeiser'}
      subject={getLetterSubject(viewType)}
      senderName={user?.full_name || 'Gebruiker'}
      onSend={onMarkAsSent}
      sendButtonText={markAsSentText}
      onBack={onBack}
      backText="Terug"
      calculation={calculation}
      attachmentName={attachment}
      tipText={getLetterTip(viewType)}
      infoTitle="Uw Rechten"
      infoText="Een schuldeiser is verplicht uw verzoek serieus in overweging te nemen. Bewaar altijd een kopie van uw correspondentie."
    />
  );

  const renderDisputeLetterView = () => (
    <GenericLetterView
        onBack={() => setView('dispute')}
        title="Brief Betwisting Vordering"
        letterContent={letterContent}
        onLetterChange={setLetterContent}
        onMarkAsSent={handleMarkDisputeAsSent}
        markAsSentText="Ik heb de betwisting verstuurd"
        viewType="dispute"
    />
  );

  const renderPartialLetterView = () => (
    <GenericLetterView
        onBack={() => setView('partial-recognition')}
        title="Brief Gedeeltelijke Erkenning"
        letterContent={letterContent}
        onLetterChange={setLetterContent}
        onMarkAsSent={handleMarkPartialAsSent}
        markAsSentText="Ik heb de brief verstuurd"
        viewType="partial"
    />
  );

  const renderAlreadyPaidLetterView = () => (
    <GenericLetterView
        onBack={() => setView('already-paid')}
        title="Brief 'Al Betaald'"
        letterContent={letterContent}
        onLetterChange={setLetterContent}
        onMarkAsSent={handleMarkAlreadyPaidAsSent}
        markAsSentText="Ik heb de brief en bewijs verstuurd"
        viewType="already-paid"
        attachmentName="Bewijs_van_betaling.pdf"
    />
  );

  const renderVerjaringLetterView = () => (
     <GenericLetterView
        onBack={() => setView('verjaring')}
        title="Brief Beroep op Verjaring"
        letterContent={letterContent}
        onLetterChange={setLetterContent}
        onMarkAsSent={handleMarkVerjaringAsSent}
        markAsSentText="Ik heb de brief verstuurd"
        viewType="verjaring"
    />
  );

  const renderIncassokostenLetterView = () => (
    <GenericLetterView
        onBack={() => setView('incassokosten')}
        title="Brief Bezwaar Incassokosten"
        letterContent={letterContent}
        onLetterChange={setLetterContent}
        onMarkAsSent={handleMarkIncassokostenAsSent}
        markAsSentText="Ik heb de brief verstuurd"
        viewType="incassokosten"
    />
  );

  // 🆕 NIEUW: Render functie voor betalingsregeling formulier
  const renderPaymentArrangementForm = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => { setView('choice'); setActiveTab('keuzes'); }}>{'< Terug naar keuzes'}</Button>
      <h3 className="text-lg font-semibold">📋 Betalingsregelingsbrief Opstellen</h3>
      
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Template van het Juridisch Loket</strong> - Vul de gegevens in en we genereren een professionele brief voor je.
          </p>
        </CardContent>
      </Card>

      {/* 🆕 JOUW GEGEVENS - INKLAPBAAR */}
      <Collapsible open={userSectionOpen} onOpenChange={setUserSectionOpen}>
        <Card>
          <CardContent className="p-4">
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Jouw Gegevens
                </h4>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform group-data-[state=open]:rotate-180`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              <div>
                <Label htmlFor="userName">Naam</Label>
                <Input
                  id="userName"
                  value={paymentFormData.userName}
                  onChange={(e) => setPaymentFormData(p => ({...p, userName: e.target.value}))}
                  placeholder="Voornaam Achternaam"
                />
              </div>
              <div>
                <Label htmlFor="userAddress">Adres</Label>
                <Input
                  id="userAddress"
                  value={paymentFormData.userAddress}
                  onChange={(e) => setPaymentFormData(p => ({...p, userAddress: e.target.value}))}
                  placeholder="Straatnaam 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="userPostcode">Postcode</Label>
                  <Input
                    id="userPostcode"
                    value={paymentFormData.userPostcode}
                    onChange={(e) => setPaymentFormData(p => ({...p, userPostcode: e.target.value}))}
                    placeholder="1234 AB"
                  />
                </div>
                <div>
                  <Label htmlFor="userCity">Woonplaats</Label>
                  <Input
                    id="userCity"
                    value={paymentFormData.userCity}
                    onChange={(e) => setPaymentFormData(p => ({...p, userCity: e.target.value}))}
                    placeholder="Amsterdam"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="userEmail">E-mail</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={paymentFormData.userEmail}
                  onChange={(e) => setPaymentFormData(p => ({...p, userEmail: e.target.value}))}
                  placeholder="jouw@email.nl"
                />
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* 🆕 SCHULDEISER GEGEVENS - INKLAPBAAR */}
      <Collapsible open={creditorSectionOpen} onOpenChange={setCreditorSectionOpen}>
        <Card>
          <CardContent className="p-4">
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Schuldeiser Gegevens
                </h4>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform group-data-[state=open]:rotate-180`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              <div>
                <Label>Naam schuldeiser</Label>
                <Input value={debt.creditor_name} disabled className="bg-gray-50 dark:bg-[#2a2a2a]" />
              </div>
              <div>
                <Label htmlFor="creditorDepartment">Afdeling (optioneel)</Label>
                <Input
                  id="creditorDepartment"
                  value={paymentFormData.creditorDepartment}
                  onChange={(e) => setPaymentFormData(p => ({...p, creditorDepartment: e.target.value}))}
                  placeholder="Bijv. Incasso afdeling"
                />
              </div>
              <div>
                <Label htmlFor="creditorAddress">Adres (optioneel)</Label>
                <Input
                  id="creditorAddress"
                  value={paymentFormData.creditorAddress}
                  onChange={(e) => setPaymentFormData(p => ({...p, creditorAddress: e.target.value}))}
                  placeholder="Straatnaam 456"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="creditorPostcode">Postcode (optioneel)</Label>
                  <Input
                    id="creditorPostcode"
                    value={paymentFormData.creditorPostcode}
                    onChange={(e) => setPaymentFormData(p => ({...p, creditorPostcode: e.target.value}))}
                    placeholder="5678 CD"
                  />
                </div>
                <div>
                  <Label htmlFor="creditorCity">Plaats (optioneel)</Label>
                  <Input
                    id="creditorCity"
                    value={paymentFormData.creditorCity}
                    onChange={(e) => setPaymentFormData(p => ({...p, creditorCity: e.target.value}))}
                    placeholder="Rotterdam"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* 🆕 BRIEF DETAILS - INKLAPBAAR */}
      <Collapsible open={detailsSectionOpen} onOpenChange={setDetailsSectionOpen}>
        <Card>
          <CardContent className="p-4">
            <CollapsibleTrigger className="w-full group">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Brief Details
                </h4>
                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform group-data-[state=open]:rotate-180`} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              <div>
                <Label>Totaal schuldbedrag</Label>
                <Input value={formatCurrency(debt.amount || 0)} disabled className="bg-gray-50 dark:bg-[#2a2a2a]" />
              </div>
              <div>
                <Label>Dossiernummer</Label>
                <Input value={debt.case_number || 'Niet ingevuld'} disabled className="bg-gray-50 dark:bg-[#2a2a2a]" />
              </div>
              <div>
                <Label htmlFor="receivedLetterDate">Datum ontvangst brief schuldeiser</Label>
                <Input
                  id="receivedLetterDate"
                  type="date"
                  value={paymentFormData.receivedLetterDate}
                  onChange={(e) => setPaymentFormData(p => ({...p, receivedLetterDate: e.target.value}))}
                />
              </div>
              <div>
                <Label htmlFor="monthlyAmount">Maandbedrag dat je kunt betalen *</Label>
                <Input
                  id="monthlyAmount"
                  type="number"
                  step="0.01"
                  value={paymentFormData.monthlyAmount}
                  onChange={(e) => setPaymentFormData(p => ({...p, monthlyAmount: e.target.value}))}
                  placeholder="Bijv. 50.00"
                />
                {calculation?.voorstel && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    💡 Volgens VTBL: {formatCurrency(calculation.voorstel)}
                  </p>
                )}
              </div>

              {/* OPTIONELE EERSTE BETALING */}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="includeFirstPayment"
                    checked={paymentFormData.includeFirstPayment}
                    onChange={(e) => setPaymentFormData(p => ({...p, includeFirstPayment: e.target.checked}))}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="includeFirstPayment" className="cursor-pointer">
                    Ik heb/doe een eerste betaling
                  </Label>
                </div>
                
                {paymentFormData.includeFirstPayment && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <Label htmlFor="firstPaymentAmount">Bedrag eerste betaling</Label>
                      <Input
                        id="firstPaymentAmount"
                        type="number"
                        step="0.01"
                        value={paymentFormData.firstPaymentAmount}
                        onChange={(e) => setPaymentFormData(p => ({...p, firstPaymentAmount: e.target.value}))}
                        placeholder="Bijv. 25.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstPaymentDate">Datum eerste betaling (optioneel)</Label>
                      <Input
                        id="firstPaymentDate"
                        type="date"
                        value={paymentFormData.firstPaymentDate}
                        onChange={(e) => setPaymentFormData(p => ({...p, firstPaymentDate: e.target.value}))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      <Button 
        onClick={() => {
          const letter = generateJuridischLoketLetter();
          setLetterContent(letter);
          setView('payment-letter');
        }}
        disabled={!paymentFormData.monthlyAmount || parseFloat(paymentFormData.monthlyAmount) <= 0}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <FileText className="w-4 h-4 mr-2" />
        Genereer Brief
      </Button>
    </div>
  );

  // 🔧 AANGEPAST: Render met EmailPreview component
  const renderPaymentLetterView = () => (
    <EmailPreview
      letterContent={letterContent}
      onLetterChange={(val) => setLetterContent(val)}
      recipientName={debt?.creditor_name || 'Schuldeiser'}
      recipientType={debt?.creditor_type || 'Schuldeiser'}
      subject={`Betalingsregeling - Dossier ${debt?.case_number || '[Dossiernummer]'}`}
      senderName={user?.full_name || 'Gebruiker'}
      onSend={handleSavePaymentLetter}
      sendButtonText="Opslaan & Markeren als Verstuurd"
      onBack={() => setView('payment-arrangement-form')}
      backText="Terug naar formulier"
      calculation={calculation}
      tipText="Stuur altijd een kopie van de invorderingsbrief mee als bijlage."
      infoTitle="Juridisch Loket Template"
      infoText="Dit is het officiële template van het Juridisch Loket. Een schuldeiser is niet verplicht een betalingsregeling te accepteren, maar de meeste zullen een redelijk voorstel serieus overwegen."
      attachmentName="Kopie invorderingsbrief"
      showDisclaimer={true}
      showChecklist={true}
    />
  );
  

  const renderVtlbTab = () => {
    if (loading || !calculation) return <div className="flex justify-center items-center h-40"><Loader2 className="w-6 h-6 animate-spin" /></div>;

    return (
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold dark:text-white">VTLB Berekening</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Op basis van je inkomsten, vaste lasten en lopende regelingen berekenen we hoeveel je kunt aflossen.
        </p>

        <Card>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Vast inkomen:</span>
              <span className="font-semibold dark:text-white">{formatCurrency(calculation.vastInkomen)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">- Vaste lasten:</span>
              <span className="font-semibold dark:text-white">{formatCurrency(calculation.vasteLasten)}</span>
            </div>
            <div className="flex justify-between border-t dark:border-[#2a2a2a] pt-2">
              <span className="font-semibold dark:text-white">Beschikbaar voor levensonderhoud:</span>
              <span className="font-bold dark:text-white">{formatCurrency(calculation.beschikbaar)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3 text-sm">
            <h4 className="font-semibold dark:text-white mb-2">Verdeling beschikbaar budget</h4>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tussenlasten Budget (60%):</span>
              <span className="font-medium">{formatCurrency(calculation.tussenlastenBudget)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Buffer Budget (25%):</span>
              <span className="font-medium">{formatCurrency(calculation.bufferBudget)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Afloscapaciteit (15%):</span>
              <span className="font-medium">{formatCurrency(calculation.aflosCapaciteit)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Afloscapaciteit:</span>
              <span className="font-semibold dark:text-white">{formatCurrency(calculation.aflosCapaciteit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">- Huidige regelingen:</span>
              <span className="font-semibold dark:text-white">{formatCurrency(calculation.huidigeRegelingen)}</span>
            </div>
            <div className={`flex justify-between border-t dark:border-[#2a2a2a] pt-2 font-bold ${calculation.isHaalbaar || calculation.canPayInFull ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <span>Ruimte voor nieuwe regeling:</span>
              <span>{formatCurrency(calculation.ruimteVoorNieuw)}</span>
            </div>
          </CardContent>
        </Card>

        {calculation.canPayInFull && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">Je kunt deze schuld in één keer betalen!</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Schuldbedrag: {formatCurrency(calculation.debtAmount)} — Beschikbaar: {formatCurrency(calculation.ruimteVoorNieuw)}
              </p>
            </CardContent>
          </Card>
        )}

        {!calculation.canPayInFull && (
          <Card className="bg-gray-50 dark:bg-[#2a2a2a]">
            <CardContent className="p-4">
              <p className="text-sm font-semibold dark:text-white mb-1">Ons voorstel voor {debt?.creditor_name}:</p>
              {calculation.isHaalbaar ? (
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(calculation.voorstel)} / maand <span className="text-sm font-normal text-gray-600 dark:text-gray-400">(~{calculation.looptijd} maanden)</span>
                </p>
              ) : (
                <p className="text-lg font-bold text-orange-700 dark:text-orange-300">Geen ruimte — Pauzeringsverzoek (Schuldrust)</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Check if current view is a sub-view (letter, form, etc.) that should hide tabs
  const isSubView = view !== 'choice' && view !== 'proposal';

  const tabClass = (tab) => `flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
    activeTab === tab
      ? 'bg-[#10b981] text-white'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
  }`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Jouw Stappenplan
          </DialogTitle>
          {debt && <p className="text-muted-foreground">{debt.creditor_name}</p>}
        </DialogHeader>

        {/* Tab Navigation - hide when in sub-views */}
        {!isSubView && (
          <div className="flex gap-1 bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-lg">
            <button className={tabClass('keuzes')} onClick={() => { setActiveTab('keuzes'); setView('choice'); }}>
              Keuzes
            </button>
            <button className={tabClass('stappenplan')} onClick={() => { setActiveTab('stappenplan'); setView('proposal'); }}>
              Stappenplan
            </button>
            <button className={tabClass('vtlb')} onClick={() => setActiveTab('vtlb')}>
              VTLB Berekening
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'keuzes' && view === 'choice' && renderChoiceView()}
        {activeTab === 'stappenplan' && view === 'proposal' && renderProposalView()}
        {activeTab === 'vtlb' && !isSubView && renderVtlbTab()}

        {/* Sub-views (forms, letters, etc.) */}
        {view === 'payment-arrangement-form' && renderPaymentArrangementForm()}
        {view === 'payment-letter' && renderPaymentLetterView()}
        {view === 'dispute' && <DisputeForm onGenerateLetter={handleGenerateDisputeLetter} onBack={() => { setView('choice'); setActiveTab('keuzes'); }} debt={debt} />}
        {view === 'partial-recognition' && <PartialRecognitionForm debt={debt} onGenerateLetter={handleGeneratePartialLetter} onBack={() => { setView('choice'); setActiveTab('keuzes'); }} />}
        {view === 'already-paid' && <AlreadyPaidForm debt={debt} onGenerateLetter={handleGenerateAlreadyPaidLetter} onBack={() => { setView('choice'); setActiveTab('keuzes'); }} />}
        {view === 'verjaring' && <VerjaringForm debt={debt} onGenerateLetter={handleGenerateVerjaringLetter} onBack={() => { setView('choice'); setActiveTab('keuzes'); }} />}
        {view === 'incassokosten' && <IncassokostenForm debt={debt} onGenerateLetter={handleGenerateIncassokostenLetter} onBack={() => { setView('choice'); setActiveTab('keuzes'); }} />}
        {view === 'dispute-letter' && renderDisputeLetterView()}
        {view === 'partial-letter' && renderPartialLetterView()}
        {view === 'already-paid-letter' && renderAlreadyPaidLetterView()}
        {view === 'verjaring-letter' && renderVerjaringLetterView()}
        {view === 'incassokosten-letter' && renderIncassokostenLetterView()}
        {view === 'lowering_amount' && renderLoweringAmountView()}
        {view === 'payment_holiday' && renderPaymentHolidayView()}
        {view === 'stop_debt_counseling' && renderStopCounselingView()}
        {view === 'modification-letter' && renderModificationLetterView()}

      </DialogContent>
    </Dialog>
  );
}
