import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Debt } from '@/api/entities';
import { DebtPayment } from '@/api/entities';
import { DebtCorrespondence } from '@/api/entities';
import { PaymentDocument } from '@/api/entities';
// Native date formatting helpers
const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

const formatDateNumeric = (date) => {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(date));
};
import { formatCurrency } from '@/components/utils/formatters';
import {
  FileText,
  Euro,
  Calendar,
  User,
  Phone,
  Mail,
  Building2,
  DollarSign,
  Plus,
  Download,
  Trash2,
  Pencil,
  Upload,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Scale,
  Handshake,
  Clock,
  Send,
  Check,
  X as XIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import PaymentRegistrationModal from './PaymentRegistrationModal';
import AddCorrespondenceModal from './AddCorrespondenceModal';
import ArrangementStappenplanModal from './ArrangementStappenplanModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadPrivateFile, CreateFileSignedUrl } from '@/api/integrations';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const urgencyLevels = {
  normaal: { label: 'Normaal', color: 'bg-gray-100 text-gray-800', icon: FileText, description: 'Gewone schuld, -dole dinsdag' },
  aanmaning: { label: 'Aanmaning', color: 'bg-yellow-100 text-yellow-800', icon: Mail, description: 'Betalingsherinnering ontvangen' },
  incasso: { label: 'Incasso', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, description: 'Bij incassobureau' },
  deurwaarder_dreigt: { label: 'Deurwaarder Dreigt', color: 'bg-red-100 text-red-800', icon: Shield, description: 'Dreiging met deurwaarder' },
  dagvaarding: { label: 'Dagvaarding', color: 'bg-red-200 text-red-900', icon: Scale, description: 'Dagvaarding ontvangen' },
  vonnis: { label: 'Vonnis', color: 'bg-red-300 text-red-900', icon: AlertCircle, description: 'Vonnis uitgesproken' },
  beslag_dreigt: { label: 'Beslag Dreigt', color: 'bg-purple-100 text-purple-800', icon: AlertCircle, description: 'Dreiging met beslag' },
  beslag_actief: { label: 'Beslag Actief', color: 'bg-purple-200 text-purple-900', icon: XCircle, description: 'Beslag is gelegd' }
};

const correspondenceTypes = {
  brief_verstuurd: 'Brief verstuurd',
  email_verstuurd: 'Email verstuurd',
  telefoongesprek: 'Telefoongesprek',
  aanmaning_ontvangen: 'Aanmaning ontvangen',
  email_ontvangen: 'Email ontvangen',
  reactie_schuldeiser: 'Reactie schuldeiser',
  voorstel_gedaan: 'Voorstel gedaan'
};

const actionTemplates = [
  { 
    key: 'payment_arrangement', 
    label: 'Betalingsregeling Opstellen', 
    icon: Handshake,
    description: 'Maak een realistisch betalingsvoorstel',
    color: 'bg-green-600 hover:bg-green-700 text-white'
  },
  { 
    key: 'dispute', 
    label: 'Betwisten', 
    icon: XCircle,
    description: 'Betwist de schuld',
    color: 'bg-red-600 hover:bg-red-700 text-white'
  },
  { 
    key: 'partial_recognition', 
    label: 'Gedeeltelijke Erkenning', 
    icon: Scale,
    description: 'Erken een deel',
    color: 'bg-orange-600 hover:bg-orange-700 text-white'
  },
  { 
    key: 'already_paid', 
    label: 'Al Betaald', 
    icon: CheckCircle2,
    description: 'Al betaald',
    color: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  { 
    key: 'verjaring', 
    label: 'Verjaring', 
    icon: Clock,
    description: 'Mogelijk verjaard',
    color: 'bg-purple-600 hover:bg-purple-700 text-white'
  },
  { 
    key: 'lowering_amount', 
    label: 'Verlaging Bedrag', 
    icon: DollarSign,
    description: 'Vraag verlaging',
    color: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  }
];

export default function DebtDetailsModal({ debt, isOpen, onClose, onUpdate, onEdit, onDelete, onOpenArrangementPlan, onRegisterPayment }) {
  const [currentDebt, setCurrentDebt] = useState(debt);
  const [payments, setPayments] = useState([]);
  const [correspondence, setCorrespondence] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingCorrespondence, setLoadingCorrespondence] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCorrespondenceModal, setShowCorrespondenceModal] = useState(false);
  const [showArrangementModal, setShowArrangementModal] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [correspondenceOpen, setCorrespondenceOpen] = useState(false);
  const [notitiesOpen, setNotitiesOpen] = useState(false);
  const [stappenplanOpen, setStappenplanOpen] = useState(true); // 🆕 NEW STATE
  const [selectedUrgency, setSelectedUrgency] = useState(debt?.urgency_level || 'normaal');
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  
  const [editingPaymentInfo, setEditingPaymentInfo] = useState(false);
  const [paymentInfoData, setPaymentInfoData] = useState({
    payment_iban: '',
    payment_account_name: '',
    payment_reference: ''
  });

  const [editingContactInfo, setEditingContactInfo] = useState(false);
  const [contactInfoData, setContactInfoData] = useState({
    contact_person_name: '',
    contact_person_details: ''
  });

  const [paymentPlanData, setPaymentPlanData] = useState({
    monthly_payment: '',
    payment_plan_date: ''
  });

  const [editingName, setEditingName] = useState(false);
  const [creditorNameValue, setCreditorNameValue] = useState('');

  const { toast } = useToast();

  const statusConfig = {
    niet_actief: { label: 'Niet Actief', color: 'bg-gray-500 text-white', icon: AlertCircle },
    betalingsregeling: { label: 'Betalingsregeling', color: 'bg-blue-500 text-white', icon: CheckCircle2 },
    afbetaald: { label: 'Afbetaald', color: 'bg-green-500 text-white', icon: CheckCircle2 },
    wachtend: { label: 'Wachtend', color: 'bg-yellow-500 text-white', icon: Clock }
  };

  useEffect(() => {
    if (debt && isOpen) {
      setCurrentDebt(debt);
      setSelectedUrgency(debt.urgency_level || 'normaal');
      setNewStatus(debt.status || 'niet_actief');
      setCreditorNameValue(debt.creditor_name || '');
      setPaymentInfoData({
        payment_iban: debt.payment_iban || '',
        payment_account_name: debt.payment_account_name || '',
        payment_reference: debt.payment_reference || ''
      });
      setContactInfoData({
        contact_person_name: debt.contact_person_name || '',
        contact_person_details: debt.contact_person_details || ''
      });
      setPaymentPlanData({
        monthly_payment: debt.monthly_payment?.toString() || '',
        payment_plan_date: debt.payment_plan_date || ''
      });
      loadPayments();
      loadCorrespondence();
      loadDocuments();
    }
  }, [debt, isOpen]);

  const refreshDebt = async () => {
    if (!debt?.id) return;
    try {
      const updatedDebt = await Debt.filter({ id: debt.id });
      if (updatedDebt && updatedDebt.length > 0) {
        setCurrentDebt(updatedDebt[0]);
        // Also update newStatus if the debt status changed
        setNewStatus(updatedDebt[0].status || 'niet_actief');
      }
    } catch (error) {
      console.error('Error refreshing debt:', error);
    }
  };

  const loadPayments = async () => {
    if (!debt) return;
    setLoadingPayments(true);
    try {
      const allPayments = await DebtPayment.filter({ debt_id: debt.id }, '-payment_date');
      setPayments(allPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const loadCorrespondence = async () => {
    if (!debt) return;
    setLoadingCorrespondence(true);
    try {
      const allCorrespondence = await DebtCorrespondence.filter({ debt_id: debt.id }, '-date');
      setCorrespondence(allCorrespondence);
    } catch (error) {
      console.error('Error loading correspondence:', error);
    } finally {
      setLoadingCorrespondence(false);
    }
  };

  const loadDocuments = async () => {
    if (!debt) return;
    setLoadingDocuments(true);
    try {
      const allDocuments = await PaymentDocument.filter({ debt_id: debt.id }, '-created_date');
      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleUrgencyChange = async (newUrgency) => {
    setSelectedUrgency(newUrgency);
    try {
      await Debt.update(debt.id, { urgency_level: newUrgency });
      toast({ title: 'Urgentie aangepast!' });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating urgency:', error);
      toast({ title: 'Fout', description: 'Kon urgentie niet aanpassen', variant: 'destructive' });
    }
  };

  const handleStatusUpdate = async () => {
    if (!currentDebt || !newStatus) return;

    try {
      const updateData = { status: newStatus };
      
      // Als betalingsregeling, ook de regeling details opslaan
      if (newStatus === 'betalingsregeling') {
        if (paymentPlanData.monthly_payment) {
          updateData.monthly_payment = parseFloat(paymentPlanData.monthly_payment);
        }
        if (paymentPlanData.payment_plan_date) {
          updateData.payment_plan_date = paymentPlanData.payment_plan_date;
        }
      }
      
      await Debt.update(currentDebt.id, updateData);
      toast({ 
        title: '✅ Status bijgewerkt', 
        description: `Status is gewijzigd naar "${statusConfig[newStatus]?.label || newStatus}"` 
      });
      setShowStatusChangeDialog(false);
      await refreshDebt();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ 
        title: 'Fout', 
        description: 'Kon status niet bijwerken',
        variant: 'destructive' 
      });
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Weet je zeker dat je deze betaling wilt verwijderen?')) return;
    
    try {
      await DebtPayment.delete(paymentId);
      const remainingPayments = await DebtPayment.filter({ debt_id: debt.id });
      const newAmountPaid = remainingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      
      const updateData = { amount_paid: newAmountPaid };
      
      if (currentDebt.status === 'afbetaald' && newAmountPaid < currentDebt.amount) {
        updateData.status = 'betalingsregeling';
      }
      
      await Debt.update(debt.id, updateData);
      toast({ title: 'Betaling verwijderd' });
      await refreshDebt();
      loadPayments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({ title: 'Fout', description: 'Verwijderen mislukt', variant: 'destructive' });
    }
  };

  const handleSavePaymentInfo = async () => {
    try {
      await Debt.update(debt.id, paymentInfoData);
      toast({ title: 'Betalingsgegevens opgeslagen!' });
      setEditingPaymentInfo(false);
      await refreshDebt();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating payment info:', error);
      toast({ title: 'Fout', description: 'Kon betalingsgegevens niet opslaan', variant: 'destructive' });
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      await Debt.update(debt.id, contactInfoData);
      toast({ title: 'Contactinformatie opgeslagen!' });
      setEditingContactInfo(false);
      await refreshDebt();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating contact info:', error);
      toast({ title: 'Fout', description: 'Kon contactinformatie niet opslaan', variant: 'destructive' });
    }
  };

  const handleSaveCreditorName = async () => {
    if (!creditorNameValue.trim()) {
      toast({ title: 'Naam is verplicht', variant: 'destructive' });
      return;
    }
    try {
      await Debt.update(debt.id, { creditor_name: creditorNameValue });
      toast({ title: 'Naam bijgewerkt!' });
      setEditingName(false);
      await refreshDebt();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating creditor name:', error);
      toast({ title: 'Fout', description: 'Kon naam niet opslaan', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_uri } = await UploadPrivateFile({ file });

      await PaymentDocument.create({
        debt_id: debt.id,
        document_type: 'overig',
        file_name: file.name,
        file_uri: file_uri,
        file_size: file.size
      });

      toast({ title: 'Document geüpload!' });
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({ title: 'Fout', description: 'Document uploaden mislukt', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleOpenDocument = async (doc) => {
    try {
      const { signed_url } = await CreateFileSignedUrl({ file_uri: doc.file_uri });
      
      const isPDF = doc.file_name.toLowerCase().endsWith('.pdf');
      
      if (isPDF) {
        window.open(signed_url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = signed_url;
        link.download = doc.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({ 
        title: 'Fout', 
        description: 'Document kon niet worden geopend', 
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm('Weet je zeker dat je dit document wilt verwijderen?')) return;
    
    try {
      await PaymentDocument.delete(docId);
      toast({ title: 'Document verwijderd' });
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({ title: 'Fout', description: 'Verwijderen mislukt', variant: 'destructive' });
    }
  };

  const handleDeleteCorrespondence = async (corrId) => {
    if (!confirm('Weet je zeker dat je deze correspondentie wilt verwijderen?')) return;
    
    try {
      await DebtCorrespondence.delete(corrId);
      toast({ title: 'Correspondentie verwijderd' });
      loadCorrespondence();
      loadDocuments();
    } catch (error) {
      console.error('Error deleting correspondence:', error);
      toast({ title: 'Fout', description: 'Verwijderen mislukt', variant: 'destructive' });
    }
  };

  const handleTemplateClick = (templateKey) => {
    if (templateKey === 'payment_arrangement') {
      setShowArrangementModal(true);
    } else {
      toast({ 
        title: 'Binnenkort beschikbaar', 
        description: 'Deze functionaliteit wordt binnenkort toegevoegd.'
      });
    }
  };

  if (!currentDebt) return null;

  const remainingAmount = (currentDebt.amount || 0) - (currentDebt.amount_paid || 0);
  const progress = (currentDebt.amount || 0) > 0 ? ((currentDebt.amount_paid || 0) / currentDebt.amount) * 100 : 0;
  const urgencyInfo = urgencyLevels[selectedUrgency];
  const UrgencyIcon = urgencyInfo.icon;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <Building2 className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  <Input
                    value={creditorNameValue}
                    onChange={(e) => setCreditorNameValue(e.target.value)}
                    className="text-xl font-bold"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveCreditorName}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingName(false);
                      setCreditorNameValue(currentDebt.creditor_name);
                    }}
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  {currentDebt.creditor_name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                    onClick={() => setEditingName(true)}
                    title="Naam bewerken"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </DialogTitle>
              )}
              {!editingName && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  onClick={async () => {
                    if (confirm(`Weet je zeker dat je de schuld "${currentDebt.creditor_name}" wilt verwijderen?`)) {
                      await onDelete(currentDebt.id);
                      onClose();
                    }
                  }}
                  title="Schuld verwijderen"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    💰 Financieel Overzicht
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Totaal</div>
                      <div className="font-bold text-lg">{formatCurrency(currentDebt.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Betaald</div>
                      <div className="font-bold text-lg text-green-600">{formatCurrency(currentDebt.amount_paid || 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Nog te gaan</div>
                      <div className="font-bold text-lg text-orange-600">{formatCurrency(remainingAmount)}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Kosten Breakdown:</div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Hoofdsom:</span>
                        <span className="font-medium">{formatCurrency(currentDebt.principal_amount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Incassokosten:</span>
                        <span className="font-medium">{formatCurrency(currentDebt.collection_costs || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rente:</span>
                        <span className="font-medium">{formatCurrency(currentDebt.interest_amount || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Vooruitgang</span>
                      <span className="font-bold">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all" 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Collapsible open={paymentsOpen} onOpenChange={setPaymentsOpen}>
                <Card>
                  <CardContent className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                          📊 Betalingsgeschiedenis
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPaymentModal(true);
                            }}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Betaling
                          </Button>
                          <ChevronDown className={`w-5 h-5 transition-transform ${paymentsOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      {loadingPayments ? (
                        <div className="text-center py-4 text-gray-500">Laden...</div>
                      ) : payments.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Nog geen betalingen geregistreerd.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {payments.map((payment) => (
                            <div key={payment.id} className="flex justify-between items-center text-sm border-b pb-2">
                              <div>
                                <div className="font-medium">{formatCurrency(payment.amount)}</div>
                                <div className="text-xs text-gray-500">
                                  {formatDateShort(payment.payment_date)}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  Betaald
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:bg-red-50"
                                  onClick={() => handleDeletePayment(payment.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>

              {/* 🆕 INKLAPBARE STAPPENPLAN SECTIE */}
              <Collapsible open={stappenplanOpen} onOpenChange={setStappenplanOpen}>
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200">
                  <CardContent className="p-6">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-left flex-1">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-3">
                            <Handshake className="w-8 h-8 text-purple-600" />
                          </div>
                          <h3 className="font-bold text-xl mb-2">Start een Stappenplan</h3>
                        </div>
                        <ChevronDown className={`w-6 h-6 text-purple-600 transition-transform flex-shrink-0 ${stappenplanOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <p className="text-sm text-gray-700 mb-4">
                        Kies welke actie je wilt ondernemen voor deze schuld: betalingsregeling opstellen, schuld betwisten, of andere opties verkennen.
                      </p>
                      
                      <Button
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowArrangementModal(true);
                        }}
                      >
                        <Handshake className="w-5 h-5 mr-2" />
                        Start Stappenplan
                      </Button>
                      
                      <p className="text-xs text-gray-500 text-center mt-3">
                        📋 In het stappenplan kun je verschillende brieven opstellen en acties ondernemen
                      </p>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>

              <Collapsible open={documentsOpen} onOpenChange={setDocumentsOpen}>
                <Card>
                  <CardContent className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                          📄 Documenten
                        </h3>
                        <div className="flex items-center gap-2">
                          <label htmlFor="doc-upload-inline">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={uploading}
                              onClick={(e) => {
                                e.stopPropagation();
                                document.getElementById('doc-upload-inline').click();
                              }}
                            >
                              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                            <input
                              id="doc-upload-inline"
                              type="file"
                              accept=".pdf,.eml,.msg,.png,.jpg,.jpeg,application/pdf,message/rfc822,application/vnd.ms-outlook,image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                          <ChevronDown className={`w-5 h-5 transition-transform ${documentsOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      {loadingDocuments ? (
                        <div className="text-center py-4 text-gray-500">Laden...</div>
                      ) : documents.filter(d => !d.correspondence_id).length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Nog geen documenten geüpload.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {documents.filter(d => !d.correspondence_id).map((doc) => (
                            <div key={doc.id} className="flex justify-between items-center text-sm border-b pb-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{doc.file_name}</div>
                                  <div className="text-xs text-gray-500">
                                    {(doc.file_size / 1024).toFixed(0)} KB • {formatDateNumeric(doc.created_date)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleOpenDocument(doc)}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    📋 Schuld Details
                  </h3>

                  <div className="mb-4">
                    <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      📊 Status
                    </Label>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setShowStatusChangeDialog(true)}
                    >
                      <div className="flex items-center gap-2">
                        {React.createElement(statusConfig[currentDebt.status]?.icon || AlertCircle, { className: "w-4 h-4" })}
                        <span>{statusConfig[currentDebt.status]?.label || currentDebt.status}</span>
                      </div>
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>

                  {currentDebt.payment_deadline && (
                    <div className="mb-4 p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                      <Label className="text-sm font-semibold mb-2 flex items-center gap-2 text-orange-700">
                        ⏰ Uiterlijke Betaaldatum
                      </Label>
                      <div className="text-lg font-bold text-orange-800">
                        {formatDateNumeric(currentDebt.payment_deadline)}
                      </div>
                      {new Date(currentDebt.payment_deadline) < new Date() && (
                        <p className="text-xs text-red-600 mt-2 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Deze datum is verstreken
                        </p>
                      )}
                      {new Date(currentDebt.payment_deadline) >= new Date() && (
                        <p className="text-xs text-orange-600 mt-2">
                          Betaal voor deze datum om extra kosten te voorkomen
                        </p>
                      )}
                    </div>
                  )}

                  {/* Betalingsregeling info */}
                  {currentDebt.status === 'betalingsregeling' && (
                    <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-bold flex items-center gap-2 text-blue-900">
                          💳 Betalingsregeling Details
                        </Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowStatusChangeDialog(true)}
                          className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Bewerken
                        </Button>
                      </div>
                      
                      {currentDebt.monthly_payment ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-200">
                            <span className="text-sm text-gray-700 font-medium">💶 Maandelijks bedrag:</span>
                            <span className="font-bold text-lg text-blue-700">{formatCurrency(currentDebt.monthly_payment)}</span>
                          </div>
                          {currentDebt.payment_plan_date && (
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-200">
                              <span className="text-sm text-gray-700 font-medium">📅 Betaaldatum per maand:</span>
                              <span className="font-bold text-blue-700">{new Date(currentDebt.payment_plan_date).getDate()}{['ste', 'ste', 'de'][new Date(currentDebt.payment_plan_date).getDate() - 1] || 'ste'}</span>
                            </div>
                          )}
                          {currentDebt.payment_plan_date && (
                            <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-200">
                              <span className="text-sm text-gray-700 font-medium">🗓️ Startdatum regeling:</span>
                              <span className="font-bold text-blue-700">{formatDateShort(currentDebt.payment_plan_date)}</span>
                            </div>
                          )}
                          {remainingAmount > 0 && currentDebt.monthly_payment > 0 && (
                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg border border-blue-200">
                              <span className="text-sm text-gray-700 font-medium">⏱️ Nog te betalen maanden:</span>
                              <span className="font-bold text-lg text-blue-800">
                                {Math.ceil(remainingAmount / currentDebt.monthly_payment)} maanden
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-blue-100 rounded-lg border-2 border-dashed border-blue-300">
                          <p className="text-sm text-blue-800 font-medium text-center">
                            ⚠️ Klik op "Bewerken" om het maandbedrag en betaaldatum in te vullen
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                      🔴 Urgentie Niveau
                    </Label>
                    <Select value={selectedUrgency} onValueChange={handleUrgencyChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <UrgencyIcon className="w-4 h-4" />
                            <span>{urgencyInfo.label}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(urgencyLevels).map(([key, info]) => {
                          const Icon = info.icon;
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{info.label}</div>
                                  <div className="text-xs text-gray-500">{info.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Type Schuldeiser:</span>
                      <span className="font-medium">{currentDebt.is_personal_loan ? 'Persoonlijke lening' : (currentDebt.creditor_type || '-')}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Relatie:</span>
                      <span className="font-medium">{currentDebt.loan_relationship || '-'}</span>
                    </div>
                    {currentDebt.case_number && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Dossiernummer:</span>
                        <span className="font-medium">{currentDebt.case_number}</span>
                      </div>
                    )}
                    {currentDebt.origin_date && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Datum Ontstaan:</span>
                        <span className="font-medium">{formatDateNumeric(currentDebt.origin_date)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      💳 Betalingsgegevens
                    </h3>
                    {!editingPaymentInfo && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingPaymentInfo(true)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {editingPaymentInfo ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">IBAN</Label>
                        <Input
                          value={paymentInfoData.payment_iban}
                          onChange={(e) => setPaymentInfoData({...paymentInfoData, payment_iban: e.target.value})}
                          placeholder="NL00 BANK 0000 0000 00"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">T.n.v.</Label>
                        <Input
                          value={paymentInfoData.payment_account_name}
                          onChange={(e) => setPaymentInfoData({...paymentInfoData, payment_account_name: e.target.value})}
                          placeholder="Naam rekeninghouder"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Kenmerk</Label>
                        <Input
                          value={paymentInfoData.payment_reference}
                          onChange={(e) => setPaymentInfoData({...paymentInfoData, payment_reference: e.target.value})}
                          placeholder="Betalingskenmerk"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSavePaymentInfo} className="flex-1">
                          <Check className="w-4 h-4 mr-1" /> Opslaan
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setEditingPaymentInfo(false);
                            setPaymentInfoData({
                              payment_iban: currentDebt.payment_iban || '',
                              payment_account_name: currentDebt.payment_account_name || '',
                              payment_reference: currentDebt.payment_reference || ''
                            });
                          }}
                          className="flex-1"
                        >
                          <XIcon className="w-4 h-4 mr-1" /> Annuleren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">IBAN:</span>
                        <span className="font-medium font-mono">{currentDebt.payment_iban || 'Geen (+ toevoegen)'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">T.n.v.:</span>
                        <span className="font-medium">{currentDebt.payment_account_name || 'Geen (+ toevoegen)'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Kenmerk:</span>
                        <span className="font-medium font-mono">{currentDebt.payment_reference || 'Geen (+ toevoegen)'}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      📞 Contact Informatie
                    </h3>
                    {!editingContactInfo && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setEditingContactInfo(true)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {editingContactInfo ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Contactpersoon</Label>
                        <Input
                          value={contactInfoData.contact_person_name}
                          onChange={(e) => setContactInfoData({...contactInfoData, contact_person_name: e.target.value})}
                          placeholder="Naam contactpersoon"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Contactdetails</Label>
                        <Input
                          value={contactInfoData.contact_person_details}
                          onChange={(e) => setContactInfoData({...contactInfoData, contact_person_details: e.target.value})}
                          placeholder="Telefoon of email"
                          className="text-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" onClick={handleSaveContactInfo} className="flex-1">
                          <Check className="w-4 h-4 mr-1" /> Opslaan
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setEditingContactInfo(false);
                            setContactInfoData({
                              contact_person_name: currentDebt.contact_person_name || '',
                              contact_person_details: currentDebt.contact_person_details || ''
                            });
                          }}
                          className="flex-1"
                        >
                          <XIcon className="w-4 h-4 mr-1" /> Annuleren
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Contactpersoon:</span>
                        <span className="font-medium">{currentDebt.contact_person_name || 'Geen (+ toevoegen)'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Contactdetails:</span>
                        <span className="font-medium">{currentDebt.contact_person_details || 'Geen (+ toevoegen)'}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Collapsible open={correspondenceOpen} onOpenChange={setCorrespondenceOpen}>
                <Card>
                  <CardContent className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                          📧 Correspondentie
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCorrespondenceModal(true);
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <ChevronDown className={`w-5 h-5 transition-transform ${correspondenceOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      {loadingCorrespondence ? (
                        <div className="text-center py-4 text-gray-500">Laden...</div>
                      ) : correspondence.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          Nog geen correspondentie vastgelegd.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {correspondence.map((item) => (
                            <div key={item.id} className="text-sm border-b pb-2">
                              <div className="flex justify-between items-start mb-1">
                                <Badge variant="outline" className="text-xs">{correspondenceTypes[item.type]}</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => handleDeleteCorrespondence(item.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-gray-700">{item.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDateShort(item.date)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>

              <Collapsible open={notitiesOpen} onOpenChange={setNotitiesOpen}>
                <Card>
                  <CardContent className="p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                          📝 Notities
                        </h3>
                        <div className="flex items-center gap-2">
                          {onEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(currentDebt);
                              }}
                            >
                              Bewerken
                            </Button>
                          )}
                          <ChevronDown className={`w-5 h-5 transition-transform ${notitiesOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      {currentDebt.notes ? (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{currentDebt.notes}</p>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Geen notities</p>
                      )}
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={(open) => {
        if (!open) {
          setShowStatusChangeDialog(false);
          setNewStatus(currentDebt.status || 'niet_actief');
        }
      }}>
        <DialogContent className="max-w-md z-[100]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Status Wijzigen
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Wijzig de status van <strong>{currentDebt?.creditor_name}</strong>
              </p>
              <Label htmlFor="status-select-modal" className="mb-2 block">
                Nieuwe Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status-select-modal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[110]">
                  <SelectItem value="niet_actief">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Niet Actief
                    </div>
                  </SelectItem>
                  <SelectItem value="wachtend">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Wachtend
                    </div>
                  </SelectItem>
                  <SelectItem value="betalingsregeling">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Betalingsregeling
                    </div>
                  </SelectItem>
                  <SelectItem value="afbetaald">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Afbetaald
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Betalingsregeling velden */}
            {newStatus === 'betalingsregeling' && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <h4 className="font-bold text-blue-900 flex items-center gap-2 text-base">
                  💳 Betalingsregeling Instellen
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  ℹ️ Vul het maandelijkse aflosbedrag en de startdatum van de regeling in
                </p>
                <div>
                  <Label htmlFor="monthly-payment" className="text-sm font-semibold">
                    💶 Maandelijks aflosbedrag (€) *
                  </Label>
                  <Input
                    id="monthly-payment"
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentPlanData.monthly_payment}
                    onChange={(e) => setPaymentPlanData({...paymentPlanData, monthly_payment: e.target.value})}
                    placeholder="bijv. 50.00"
                    className="mt-1 text-base font-medium"
                  />
                  <p className="text-xs text-gray-600 mt-1">Het bedrag dat je elke maand afbetaalt</p>
                </div>
                <div>
                  <Label htmlFor="payment-plan-date" className="text-sm font-semibold">
                    📅 Startdatum & Betaaldatum per maand
                  </Label>
                  <Input
                    id="payment-plan-date"
                    type="date"
                    value={paymentPlanData.payment_plan_date}
                    onChange={(e) => setPaymentPlanData({...paymentPlanData, payment_plan_date: e.target.value})}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    De dag van de maand waarop je elke maand moet betalen (bijv. de 1e, 15e, etc.)
                  </p>
                </div>
                {paymentPlanData.monthly_payment && remainingAmount > 0 && (
                  <div className="text-sm text-blue-800 bg-gradient-to-r from-blue-100 to-green-100 p-3 rounded-lg border border-blue-200 font-medium">
                    ⏱️ Geschatte looptijd: <strong className="text-lg">{Math.ceil(remainingAmount / parseFloat(paymentPlanData.monthly_payment || 1))} maanden</strong>
                  </div>
                )}
                {paymentPlanData.payment_plan_date && (
                  <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    💡 Je moet elke maand op de <strong>{new Date(paymentPlanData.payment_plan_date).getDate()}e</strong> betalen
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowStatusChangeDialog(false);
                  setNewStatus(currentDebt.status || 'niet_actief');
                }}
              >
                Annuleren
              </Button>
              <Button 
                type="button"
                onClick={handleStatusUpdate}
                className="bg-green-600 hover:bg-green-700"
              >
                Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentRegistrationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        debt={currentDebt}
        onPaymentAdded={async () => {
          await refreshDebt();
          loadPayments();
          if (onUpdate) onUpdate();
        }}
      />

      <AddCorrespondenceModal
        isOpen={showCorrespondenceModal}
        onClose={() => setShowCorrespondenceModal(false)}
        onSave={async (data) => {
          await DebtCorrespondence.create({ ...data, debt_id: currentDebt.id });
          loadCorrespondence();
          loadDocuments();
          setShowCorrespondenceModal(false);
        }}
      />

      <ArrangementStappenplanModal
        debt={currentDebt}
        isOpen={showArrangementModal}
        onClose={() => {
          setShowArrangementModal(false);
          if (onUpdate) onUpdate();
        }}
      />
    </>
  );
}