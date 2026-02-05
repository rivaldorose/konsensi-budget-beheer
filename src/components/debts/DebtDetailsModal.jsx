import React, { useState, useEffect } from 'react';
import { Debt } from '@/api/entities';
import { DebtPayment } from '@/api/entities';
import { DebtCorrespondence } from '@/api/entities';
import { DebtNote } from '@/api/entities';
import { PaymentDocument } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/components/utils/formatters';
import PaymentRegistrationModal from './PaymentRegistrationModal';
import AddCorrespondenceModal from './AddCorrespondenceModal';
import AddDocumentModal from './AddDocumentModal';
import ArrangementStappenplanModal from './ArrangementStappenplanModal';

const formatDateShort = (date) => {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
};

const formatDateNumeric = (date) => {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(date));
};

const urgencyLevels = {
  normaal: { label: 'Normaal', color: 'bg-gray-100 dark:bg-dark-card-elevated text-gray-600 dark:text-text-tertiary border border-gray-200 dark:border-dark-border-accent' },
  aanmaning: { label: 'Aanmaning', color: 'bg-accent-yellow/15 dark:bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20' },
  incasso: { label: 'Incasso', color: 'bg-status-orange/15 dark:bg-accent-orange/10 text-status-orange dark:text-accent-orange border border-status-orange/20' },
  deurwaarder_dreigt: { label: 'Deurwaarder Dreigt', color: 'bg-status-red/15 dark:bg-accent-red/10 text-status-red dark:text-accent-red border border-status-red/20' },
  dagvaarding: { label: 'Dagvaarding', color: 'bg-status-red/20 dark:bg-accent-red/15 text-status-red dark:text-accent-red border border-status-red/30' },
  vonnis: { label: 'Vonnis', color: 'bg-status-red/30 dark:bg-accent-red/20 text-status-red dark:text-accent-red border border-status-red/40' },
  beslag_dreigt: { label: 'Beslag Dreigt', color: 'bg-status-purple/15 dark:bg-accent-purple/10 text-status-purple dark:text-accent-purple border border-status-purple/20' },
  beslag_actief: { label: 'Beslag Actief', color: 'bg-status-purple/20 dark:bg-accent-purple/15 text-status-purple dark:text-accent-purple border border-status-purple/30' }
};

const statusLabels = {
  niet_actief: 'Niet Actief',
  wachtend: 'Wachtend',
  betalingsregeling: 'Betalingsregeling',
  afbetaald: 'Afbetaald',
  actief: 'Actief',
  aanmaning: 'Aanmaning'
};

const statusColors = {
  niet_actief: 'bg-gray-100 dark:bg-dark-card-elevated text-gray-600 dark:text-text-tertiary border border-gray-200 dark:border-dark-border-accent',
  wachtend: 'bg-accent-yellow/15 dark:bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/20',
  betalingsregeling: 'bg-status-blue/15 dark:bg-accent-blue/10 text-status-blue dark:text-accent-blue border border-status-blue/20',
  afbetaald: 'bg-status-green/15 dark:bg-primary-green/10 text-status-green dark:text-primary-green border border-status-green/20',
  actief: 'bg-status-green/15 dark:bg-primary-green/10 text-status-green dark:text-primary-green border border-status-green/20',
  aanmaning: 'bg-status-red/15 dark:bg-accent-red/10 text-status-red dark:text-accent-red border border-status-red/20'
};

export default function DebtDetailsModal({ debt, isOpen, onClose, onUpdate, onEdit, onDelete }) {
  const [currentDebt, setCurrentDebt] = useState(debt);
  const [payments, setPayments] = useState([]);
  const [correspondence, setCorrespondence] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingCorrespondence, setLoadingCorrespondence] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCorrespondenceModal, setShowCorrespondenceModal] = useState(false);
  const [showArrangementModal, setShowArrangementModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showStappenplan, setShowStappenplan] = useState(false);
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
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountData, setAmountData] = useState({
    principal_amount: '',
    collection_costs: '',
    interest_amount: ''
  });
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [detailEditData, setDetailEditData] = useState({
    creditor_type: '',
    is_personal_loan: false,
    loan_relationship: '',
    origin_date: '',
    case_number: ''
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
      setAmountData({
        principal_amount: debt.principal_amount?.toString() || '',
        collection_costs: debt.collection_costs?.toString() || '',
        interest_amount: debt.interest_amount?.toString() || ''
      });
      setDetailEditData({
        creditor_type: debt.creditor_type || '',
        is_personal_loan: debt.is_personal_loan || false,
        loan_relationship: debt.loan_relationship || '',
        origin_date: debt.origin_date || '',
        case_number: debt.case_number || ''
      });
      loadPayments();
      loadCorrespondence();
      loadDocuments();
      loadNotes();
    }
  }, [debt, isOpen]);

  const refreshDebt = async () => {
    if (!debt?.id) return;
    try {
      const updatedDebt = await Debt.filter({ id: debt.id });
      if (updatedDebt && updatedDebt.length > 0) {
        setCurrentDebt(updatedDebt[0]);
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

  const loadNotes = async () => {
    if (!debt) return;
    setLoadingNotes(true);
    try {
      const allNotes = await DebtNote.filter({ debt_id: debt.id }, '-created_at');
      setNotes(allNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    setAddingNote(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      await DebtNote.create({ user_id: authUser.id, debt_id: debt.id, content: newNoteText.trim() });
      setNewNoteText('');
      setShowAddNote(false);
      await loadNotes();
      toast({ title: 'Notitie toegevoegd' });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Notitie verwijderen?')) return;
    try {
      await DebtNote.delete(noteId);
      await loadNotes();
      toast({ title: 'Notitie verwijderd' });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({ title: 'Fout', variant: 'destructive' });
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
      const updateData = {
        status: newStatus,
        creditor_type: detailEditData.creditor_type || null,
        is_personal_loan: detailEditData.is_personal_loan,
        loan_relationship: detailEditData.loan_relationship || null,
        origin_date: detailEditData.origin_date || null,
        case_number: detailEditData.case_number || null,
      };
      if (newStatus === 'betalingsregeling') {
        if (paymentPlanData.monthly_payment) {
          updateData.monthly_payment = parseFloat(paymentPlanData.monthly_payment);
        }
        if (paymentPlanData.payment_plan_date) {
          updateData.payment_plan_date = paymentPlanData.payment_plan_date;
        }
      }
      await Debt.update(currentDebt.id, updateData);
      toast({ title: 'Gegevens bijgewerkt' });
      setShowStatusChangeDialog(false);
      await refreshDebt();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Weet je zeker dat je deze betaling wilt verwijderen?')) return;
    try {
      // First, delete any linked payment documents (foreign key constraint)
      const { error: docDeleteError } = await supabase
        .from('payment_documents')
        .delete()
        .eq('payment_id', paymentId);

      if (docDeleteError) {
        console.error('Error deleting linked documents:', docDeleteError);
        // Continue anyway - documents might not exist
      }

      // Now delete the payment itself
      const { error: deleteError } = await supabase
        .from('debt_payments')
        .delete()
        .eq('id', paymentId);

      if (deleteError) {
        console.error('Error deleting payment:', deleteError);
        // Check if it's an RLS policy error
        if (deleteError.code === '42501' || deleteError.message?.includes('policy')) {
          toast({
            title: 'Geen toestemming',
            description: 'Je hebt geen rechten om deze betaling te verwijderen.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Fout bij verwijderen',
            description: deleteError.message || 'Kon betaling niet verwijderen.',
            variant: 'destructive'
          });
        }
        return;
      }

      // Recalculate amount_paid after successful delete
      const remainingPayments = await DebtPayment.filter({ debt_id: debt.id });
      const newAmountPaid = remainingPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const updateData = { amount_paid: newAmountPaid };

      // If debt was fully paid but now has remaining balance, update status
      const wasFullyPaid = currentDebt.status === 'afbetaald';
      const nowHasBalance = newAmountPaid < (currentDebt.amount || 0);

      if (wasFullyPaid && nowHasBalance) {
        updateData.status = 'betalingsregeling';
        console.log('[DebtDetailsModal] Debt was fully paid but now has remaining balance. Updating status to betalingsregeling.');
      }

      await Debt.update(debt.id, updateData);

      // Show appropriate toast message
      if (wasFullyPaid && nowHasBalance) {
        toast({
          title: 'Betaling verwijderd',
          description: 'De schuld status is bijgewerkt naar "Betalingsregeling" omdat er nog een openstaand bedrag is.',
          variant: 'default'
        });
      } else {
        toast({ title: 'Betaling verwijderd', variant: 'success' });
      }
      await refreshDebt();
      loadPayments();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Fout bij verwijderen',
        description: error.message || 'Er ging iets mis.',
        variant: 'destructive'
      });
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
      toast({ title: 'Fout', variant: 'destructive' });
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
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleSaveCreditorName = async () => {
    if (!creditorNameValue.trim()) {
      toast({ title: 'Naam is verplicht', variant: 'destructive' });
      return;
    }
    try {
      await Debt.update(debt.id, { creditor_name: creditorNameValue, name: creditorNameValue });
      toast({ title: 'Naam bijgewerkt!' });
      setEditingName(false);
      await refreshDebt();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating creditor name:', error);
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleSaveAmount = async () => {
    try {
      const principal = parseFloat(amountData.principal_amount) || 0;
      const collection = parseFloat(amountData.collection_costs) || 0;
      const interest = parseFloat(amountData.interest_amount) || 0;
      const totalAmount = principal + collection + interest;

      await Debt.update(debt.id, {
        principal_amount: principal,
        collection_costs: collection,
        interest_amount: interest,
        amount: totalAmount
      });
      toast({ title: 'Bedragen bijgewerkt!' });
      setEditingAmount(false);
      await refreshDebt();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating amounts:', error);
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleSaveDocument = async (docData) => {
    await PaymentDocument.create({
      debt_id: debt.id,
      ...docData
    });
    toast({ title: 'Document geüpload!' });
    setShowDocumentModal(false);
    loadDocuments();
  };

  const handleOpenDocument = async (doc) => {
    try {
      if (doc.file_uri?.startsWith('http')) {
        window.open(doc.file_uri, '_blank');
      } else {
        const { data } = supabase.storage.from('attachments').getPublicUrl(doc.file_uri);
        window.open(data?.publicUrl || doc.file_uri, '_blank');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({ title: 'Fout', variant: 'destructive' });
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
      toast({ title: 'Fout', variant: 'destructive' });
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
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (!currentDebt || !isOpen) return null;

  const remainingAmount = (currentDebt.amount || 0) - (currentDebt.amount_paid || 0);
  const progress = (currentDebt.amount || 0) > 0 ? ((currentDebt.amount_paid || 0) / currentDebt.amount) * 100 : 0;
  const urgencyInfo = urgencyLevels[selectedUrgency];
  const status = currentDebt.status || 'niet_actief';

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm sm:p-4 overflow-y-auto">
          <div className="relative w-full sm:max-w-[1200px] bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-3xl shadow-2xl dark:shadow-modal-dark overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] sm:my-8">
            {/* Theme Toggle - Hidden on mobile */}
            <div className="hidden sm:block absolute top-6 right-16 z-20">
              <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
                <input className="sr-only" id="theme-toggle" type="checkbox" checked={darkMode} onChange={toggleTheme} />
                <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
                  <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>light_mode</span>
                  <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>dark_mode</span>
                  <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
                </div>
              </label>
            </div>

            {/* Header */}
            <header className="flex items-center gap-2 sm:gap-4 p-4 sm:p-6 border-b border-gray-100 dark:border-dark-border">
              <button 
                onClick={onClose}
                className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card-elevated transition-colors text-text-muted dark:text-text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={creditorNameValue}
                    onChange={(e) => setCreditorNameValue(e.target.value)}
                    className="flex-1 text-2xl sm:text-[28px] font-bold text-text-main dark:text-text-primary bg-transparent border-b-2 border-primary dark:border-primary-green focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveCreditorName}
                    className="p-2 rounded-full hover:bg-primary/10 dark:hover:bg-primary-green/10 text-primary dark:text-primary-green transition-colors"
                  >
                    <span className="material-symbols-outlined">check</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setCreditorNameValue(currentDebt.creditor_name);
                    }}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-card-elevated text-gray-400 dark:text-text-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <h1 className="text-lg sm:text-2xl md:text-[28px] font-bold text-text-main dark:text-text-primary flex-grow truncate">
                  {currentDebt.creditor_name}
                </h1>
              )}
              {!editingName && (
                <>
                  <button 
                    onClick={() => setEditingName(true)}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 dark:hover:bg-primary-green/10 hover:text-primary dark:hover:text-primary-green transition-colors text-text-muted dark:text-text-secondary cursor-pointer group"
                  >
                    <span className="material-symbols-outlined group-hover:text-primary dark:group-hover:text-primary-green">edit</span>
                  </button>
                  {onDelete && (
                    <button
                      onClick={async () => {
                        if (confirm(`Weet je zeker dat je de schuld "${currentDebt.creditor_name}" wilt verwijderen?`)) {
                          await onDelete(currentDebt.id);
                          onClose();
                        }
                      }}
                      className="p-2 rounded-full hover:bg-status-red/10 dark:hover:bg-accent-red/10 text-status-red dark:text-accent-red transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                </>
              )}
            </header>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto">
              {/* LEFT COLUMN (65% -> col-span-8) */}
              <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
                {/* 1. Financieel Overzicht Card */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-4 sm:p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary dark:text-primary-green">account_balance_wallet</span>
                      <h2 className="text-lg font-semibold text-text-main dark:text-text-primary">Financieel Overzicht</h2>
                    </div>
                    <button
                      onClick={() => setEditingAmount(!editingAmount)}
                      className="text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                  </div>

                  {editingAmount ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-text-muted dark:text-text-secondary mb-1 block">Hoofdsom (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountData.principal_amount}
                          onChange={(e) => setAmountData({...amountData, principal_amount: e.target.value})}
                          placeholder="0.00"
                          className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-muted dark:text-text-secondary mb-1 block">Incassokosten (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountData.collection_costs}
                          onChange={(e) => setAmountData({...amountData, collection_costs: e.target.value})}
                          placeholder="0.00"
                          className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-muted dark:text-text-secondary mb-1 block">Rente (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountData.interest_amount}
                          onChange={(e) => setAmountData({...amountData, interest_amount: e.target.value})}
                          placeholder="0.00"
                          className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                        />
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-card-elevated p-3 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-text-muted dark:text-text-secondary">Nieuw Totaal:</span>
                          <span className="font-bold text-text-main dark:text-text-primary">
                            {formatCurrency(
                              (parseFloat(amountData.principal_amount) || 0) +
                              (parseFloat(amountData.collection_costs) || 0) +
                              (parseFloat(amountData.interest_amount) || 0)
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveAmount}
                          className="flex-1 bg-primary dark:bg-primary-green text-secondary dark:text-dark-bg font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark dark:hover:bg-light-green transition-colors"
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={() => {
                            setEditingAmount(false);
                            setAmountData({
                              principal_amount: currentDebt.principal_amount?.toString() || '',
                              collection_costs: currentDebt.collection_costs?.toString() || '',
                              interest_amount: currentDebt.interest_amount?.toString() || ''
                            });
                          }}
                          className="flex-1 border border-gray-300 dark:border-dark-border text-text-main dark:text-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Stats Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-text-light dark:text-text-secondary">Totaal</span>
                          <span className="text-2xl font-bold text-text-main dark:text-text-primary">{formatCurrency(currentDebt.amount || 0)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-text-muted dark:text-text-secondary">Betaald</span>
                          <span className="text-2xl font-bold text-primary dark:text-primary-green">{formatCurrency(currentDebt.amount_paid || 0)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-text-muted dark:text-text-secondary">Nog te gaan</span>
                          <span className="text-2xl font-bold text-accent-orange dark:text-accent-orange">{formatCurrency(remainingAmount)}</span>
                        </div>
                      </div>

                      <hr className="border-t border-gray-200 dark:border-dark-border my-5"/>

                      {/* Kosten Breakdown */}
                      <div className="mb-5">
                        <p className="text-sm font-medium text-text-muted dark:text-text-secondary mb-3">Kosten Breakdown:</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-sm text-text-muted dark:text-text-secondary">
                            <span>Hoofdsom:</span>
                            <span>{formatCurrency(currentDebt.principal_amount || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-text-muted dark:text-text-secondary">
                            <span>Incassokosten:</span>
                            <span>{formatCurrency(currentDebt.collection_costs || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm text-text-muted dark:text-text-secondary">
                            <span>Rente:</span>
                            <span>{formatCurrency(currentDebt.interest_amount || 0)}</span>
                          </div>
                        </div>
                      </div>

                      <hr className="border-t border-gray-200 dark:border-dark-border my-5"/>

                      {/* Vooruitgang */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-text-muted dark:text-text-secondary">Vooruitgang</span>
                          <span className="text-sm font-bold text-accent-orange dark:text-accent-orange">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-dark-card-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary dark:bg-primary-green rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 2. Betalingsgeschiedenis Card */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-accent-blue dark:text-accent-blue">description</span>
                      <h2 className="text-lg font-semibold text-text-main dark:text-text-primary">Betalingsgeschiedenis</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="text-primary dark:text-primary-green text-sm font-semibold hover:underline"
                      >
                        + Betaling
                      </button>
                      <button className="text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary">
                        <span className="material-symbols-outlined">expand_more</span>
                      </button>
                    </div>
                  </div>

                  {loadingPayments ? (
                    <div className="text-center py-8 text-text-light dark:text-text-tertiary">Laden...</div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-6 text-text-muted dark:text-text-tertiary text-sm">
                      Nog geen betalingen geregistreerd.
                    </div>
                  ) : (
                    <div className="space-y-2 mt-4">
                      {payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-dark-border pb-2">
                          <div>
                            <div className="font-medium text-text-main dark:text-text-primary">{formatCurrency(payment.amount)}</div>
                            <div className="text-xs text-gray-500 dark:text-text-tertiary">{formatDateShort(payment.payment_date)}</div>
                          </div>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-status-red dark:text-accent-red hover:bg-status-red/10 dark:hover:bg-accent-red/10 p-1 rounded transition-colors"
                          >
                            <span className="material-symbols-outlined !text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Stappenplan Card */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                  <div className="bg-[#F5F3FF] dark:bg-accent-purple/10 rounded-xl p-6 border border-purple-100 dark:border-accent-purple/20 flex flex-col items-center text-center">
                    <div className="bg-white/50 dark:bg-accent-purple/20 p-3 rounded-full mb-3">
                      <span className="material-symbols-outlined text-accent-purple dark:text-accent-purple !text-5xl">description</span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-main dark:text-text-primary mb-2">Start een Stappenplan</h3>
                    <p className="text-sm text-text-muted dark:text-text-secondary mb-6 max-w-sm">
                      Kies welke actie je wilt ondernemen om grip te krijgen op deze schuld.
                    </p>
                    <button
                      onClick={() => setShowArrangementModal(true)}
                      className="w-full sm:w-auto px-8 h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"
                      style={{ background: 'linear-gradient(90deg, #8B5CF6 0%, #60A5FA 100%)' }}
                    >
                      <span>Start Stappenplan</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                    <div className="flex items-center gap-2 mt-4 text-xs text-text-muted dark:text-text-tertiary italic">
                      <span className="material-symbols-outlined text-primary dark:text-primary-green !text-sm filled-icon">check_circle</span>
                      <span>In het stappenplan kun je verschillende brieven opstellen...</span>
                    </div>
                  </div>
                </div>

                {/* 4. Documenten Card */}
                <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-text-muted dark:text-text-secondary">folder</span>
                      <h2 className="text-lg font-semibold text-text-main dark:text-text-primary">Documenten</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowDocumentModal(true)}
                        className="text-primary dark:text-primary-green hover:bg-primary/10 dark:hover:bg-primary-green/10 rounded-full p-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                      <button className="text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary">
                        <span className="material-symbols-outlined">expand_more</span>
                      </button>
                    </div>
                  </div>
                  {loadingDocuments ? (
                    <div className="text-center py-8 text-text-light dark:text-text-tertiary">Laden...</div>
                  ) : documents.filter(d => !d.correspondence_id).length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-text-light dark:text-text-tertiary">Geen documenten</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.filter(d => !d.correspondence_id).map((doc) => (
                        <div key={doc.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-dark-border pb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="material-symbols-outlined text-gray-400 dark:text-text-secondary !text-[18px]">description</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-text-main dark:text-text-primary truncate">{doc.file_name}</div>
                              <div className="text-xs text-gray-500 dark:text-text-tertiary">
                                {(doc.file_size / 1024).toFixed(0)} KB • {formatDateNumeric(doc.created_date)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenDocument(doc)}
                              className="text-status-blue dark:text-accent-blue hover:bg-status-blue/10 dark:hover:bg-accent-blue/10 p-1 rounded transition-colors"
                            >
                              <span className="material-symbols-outlined !text-[18px]">open_in_new</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-status-red dark:text-accent-red hover:bg-status-red/10 dark:hover:bg-accent-red/10 p-1 rounded transition-colors"
                            >
                              <span className="material-symbols-outlined !text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN (35% -> col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Sticky Wrapper */}
                <div className="sticky top-8 flex flex-col gap-6">
                  {/* 1. Schuld Details Card */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3D6456] dark:text-primary-active">info</span>
                        <h2 className="text-lg font-semibold text-text-main dark:text-text-primary">Schuld Details</h2>
                      </div>
                      <button 
                        onClick={() => setShowStatusChangeDialog(true)}
                        className="text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {/* Status */}
                      <div>
                        <p className="text-xs font-medium text-text-muted dark:text-text-secondary mb-1 uppercase tracking-wide">📊 Status</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || statusColors.niet_actief}`}>
                          <span className="material-symbols-outlined !text-sm">schedule</span>
                          {statusLabels[status] || status}
                        </span>
                      </div>

                      {/* Betalingsregeling info */}
                      {status === 'betalingsregeling' && (currentDebt.monthly_payment || currentDebt.payment_plan_date) && (
                        <div className="bg-blue-50 dark:bg-accent-blue/10 rounded-xl p-4 border border-blue-200 dark:border-accent-blue/20">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-accent-blue dark:text-accent-blue !text-[20px]">handshake</span>
                            <span className="font-semibold text-blue-800 dark:text-accent-blue text-sm">Betalingsregeling</span>
                          </div>
                          <div className="space-y-2">
                            {currentDebt.monthly_payment > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-muted dark:text-text-secondary">Maandbedrag:</span>
                                <span className="font-bold text-blue-700 dark:text-accent-blue">{formatCurrency(currentDebt.monthly_payment)}/mnd</span>
                              </div>
                            )}
                            {currentDebt.payment_plan_date && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-text-muted dark:text-text-secondary">Betaaldatum:</span>
                                <span className="font-medium text-text-main dark:text-text-primary">Elke {new Date(currentDebt.payment_plan_date).getDate()}e v/d maand</span>
                              </div>
                            )}
                            {currentDebt.monthly_payment > 0 && remainingAmount > 0 && (
                              <div className="flex justify-between items-center text-sm pt-1 border-t border-blue-200 dark:border-accent-blue/20">
                                <span className="text-text-muted dark:text-text-secondary">Geschatte looptijd:</span>
                                <span className="font-bold text-blue-700 dark:text-accent-blue">
                                  {Math.ceil(remainingAmount / currentDebt.monthly_payment)} maanden
                                  {Math.ceil(remainingAmount / currentDebt.monthly_payment) > 12 && (
                                    <span className="font-normal text-xs ml-1">({(Math.ceil(remainingAmount / currentDebt.monthly_payment) / 12).toFixed(1)} jr)</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Urgentie */}
                      <div>
                        <p className="text-xs font-medium text-text-muted dark:text-text-secondary mb-1 uppercase tracking-wide">Urgentie Niveau</p>
                        <select
                          value={selectedUrgency}
                          onChange={(e) => handleUrgencyChange(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-text-main dark:text-text-primary text-sm font-medium hover:bg-gray-100 dark:hover:bg-dark-border-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                        >
                          {Object.entries(urgencyLevels).map(([key, info]) => (
                            <option key={key} value={key}>{info.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <hr className="border-gray-100 dark:border-dark-border"/>
                      
                      {/* Details List */}
                      <div className="space-y-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">Type Schuldeiser:</span>
                          <span className="text-sm font-medium text-text-main dark:text-text-primary">
                            {currentDebt.is_personal_loan ? 'Persoonlijke lening' : (currentDebt.creditor_type || '-')}
                          </span>
                        </div>
                        {currentDebt.original_creditor && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-text-light dark:text-text-tertiary">Opdrachtgever:</span>
                            <span className="text-sm font-medium text-text-main dark:text-text-primary">{currentDebt.original_creditor}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">Relatie:</span>
                          <span className="text-sm font-medium text-text-main dark:text-text-primary">{currentDebt.loan_relationship || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">Datum Ontstaan:</span>
                          <span className="text-sm font-medium text-text-main dark:text-text-primary">
                            {currentDebt.origin_date ? formatDateNumeric(currentDebt.origin_date) : '-'}
                          </span>
                        </div>
                        {currentDebt.case_number && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-text-light dark:text-text-tertiary">Dossiernummer:</span>
                            <span className="text-sm font-medium text-text-main dark:text-text-primary">{currentDebt.case_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Betalingsgegevens Card */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent-blue dark:text-accent-blue">domain</span>
                        <h2 className="text-base font-semibold text-text-main dark:text-text-primary">Betalingsgegevens</h2>
                      </div>
                      <button 
                        onClick={() => setEditingPaymentInfo(!editingPaymentInfo)}
                        className="text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </div>
                    
                    {editingPaymentInfo ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-text-light dark:text-text-tertiary mb-1 block">IBAN</label>
                          <input
                            value={paymentInfoData.payment_iban}
                            onChange={(e) => setPaymentInfoData({...paymentInfoData, payment_iban: e.target.value})}
                            placeholder="NL00 BANK 0000 0000 00"
                            className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-light dark:text-text-tertiary mb-1 block">T.N.V.</label>
                          <input
                            value={paymentInfoData.payment_account_name}
                            onChange={(e) => setPaymentInfoData({...paymentInfoData, payment_account_name: e.target.value})}
                            placeholder="Naam rekeninghouder"
                            className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-light dark:text-text-tertiary mb-1 block">Kenmerk</label>
                          <input
                            value={paymentInfoData.payment_reference}
                            onChange={(e) => setPaymentInfoData({...paymentInfoData, payment_reference: e.target.value})}
                            placeholder="Betalingskenmerk"
                            className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={handleSavePaymentInfo}
                            className="flex-1 bg-primary dark:bg-primary-green text-secondary dark:text-dark-bg font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark dark:hover:bg-light-green transition-colors"
                          >
                            Opslaan
                          </button>
                          <button 
                            onClick={() => {
                              setEditingPaymentInfo(false);
                              setPaymentInfoData({
                                payment_iban: currentDebt.payment_iban || '',
                                payment_account_name: currentDebt.payment_account_name || '',
                                payment_reference: currentDebt.payment_reference || ''
                              });
                            }}
                            className="flex-1 border border-gray-300 dark:border-dark-border text-text-main dark:text-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors"
                          >
                            Annuleren
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">IBAN:</span>
                          <span className="text-sm font-medium text-primary dark:text-primary-green cursor-pointer hover:underline">
                            {currentDebt.payment_iban || 'Geen (+ toevoegen)'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">T.N.V.:</span>
                          <span className="text-sm font-medium text-text-main dark:text-text-primary">{currentDebt.payment_account_name || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">Kenmerk:</span>
                          <span className="text-sm font-medium text-text-main dark:text-text-primary">{currentDebt.payment_reference || '-'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Contact Informatie Card */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary dark:text-primary-green">call</span>
                        <h2 className="text-base font-semibold text-text-main dark:text-text-primary">Contact Informatie</h2>
                      </div>
                      <button 
                        onClick={() => setEditingContactInfo(!editingContactInfo)}
                        className="text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                    </div>
                    
                    {editingContactInfo ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-text-light dark:text-text-tertiary mb-1 block">Contactpersoon</label>
                          <input
                            value={contactInfoData.contact_person_name}
                            onChange={(e) => setContactInfoData({...contactInfoData, contact_person_name: e.target.value})}
                            placeholder="Naam contactpersoon"
                            className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-text-light dark:text-text-tertiary mb-1 block">Email / Tel</label>
                          <input
                            value={contactInfoData.contact_person_details}
                            onChange={(e) => setContactInfoData({...contactInfoData, contact_person_details: e.target.value})}
                            placeholder="Telefoon of email"
                            className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={handleSaveContactInfo}
                            className="flex-1 bg-primary dark:bg-primary-green text-secondary dark:text-dark-bg font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark dark:hover:bg-light-green transition-colors"
                          >
                            Opslaan
                          </button>
                          <button 
                            onClick={() => {
                              setEditingContactInfo(false);
                              setContactInfoData({
                                contact_person_name: currentDebt.contact_person_name || '',
                                contact_person_details: currentDebt.contact_person_details || ''
                              });
                            }}
                            className="flex-1 border border-gray-300 dark:border-dark-border text-text-main dark:text-text-primary font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors"
                          >
                            Annuleren
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">Contactpersoon:</span>
                          <span className="text-sm font-medium text-text-main dark:text-text-primary">{currentDebt.contact_person_name || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-text-light dark:text-text-tertiary">Email / Tel:</span>
                          <span className="text-sm font-medium text-primary dark:text-primary-green cursor-pointer hover:underline">
                            {currentDebt.contact_person_details || 'Toevoegen'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Correspondentie Card */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent-purple dark:text-accent-purple">mail</span>
                        <h2 className="text-base font-semibold text-text-main dark:text-text-primary">Correspondentie</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowCorrespondenceModal(true)}
                          className="text-primary dark:text-primary-green hover:bg-primary/10 dark:hover:bg-primary-green/10 rounded-full p-1 transition-colors"
                        >
                          <span className="material-symbols-outlined">add</span>
                        </button>
                        <button className="text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary">
                          <span className="material-symbols-outlined">expand_more</span>
                        </button>
                      </div>
                    </div>
                    {loadingCorrespondence ? (
                      <div className="text-center py-4 text-text-light dark:text-text-tertiary">Laden...</div>
                    ) : correspondence.length === 0 ? (
                      <p className="text-xs text-text-light dark:text-text-tertiary text-center py-2">Geen correspondentie</p>
                    ) : (
                      <div className="space-y-2">
                        {correspondence.map((item) => (
                          <div key={item.id} className="text-sm border-b border-gray-100 dark:border-dark-border pb-2">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-medium text-text-muted dark:text-text-secondary">{item.type}</span>
                              <button
                                onClick={() => handleDeleteCorrespondence(item.id)}
                                className="text-status-red dark:text-accent-red hover:bg-status-red/10 dark:hover:bg-accent-red/10 p-1 rounded transition-colors"
                              >
                                <span className="material-symbols-outlined !text-[16px]">delete</span>
                              </button>
                            </div>
                            <p className="text-text-main dark:text-text-primary">{item.description}</p>
                            <p className="text-xs text-gray-500 dark:text-text-tertiary mt-1">{formatDateShort(item.date)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. Notities Card */}
                  <div className="bg-white dark:bg-dark-card rounded-xl shadow-card dark:shadow-soft p-6 hover:shadow-hover dark:hover:shadow-card transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent-orange dark:text-accent-orange">notes</span>
                        <h2 className="text-base font-semibold text-text-main dark:text-text-primary">Notities</h2>
                      </div>
                      <button
                        onClick={() => setShowAddNote(!showAddNote)}
                        className="text-primary dark:text-primary-green hover:bg-primary/10 dark:hover:bg-primary-green/10 rounded-full p-1 transition-colors"
                      >
                        <span className="material-symbols-outlined">{showAddNote ? 'close' : 'add'}</span>
                      </button>
                    </div>

                    {/* Add note input */}
                    {showAddNote && (
                      <div className="mb-3 space-y-2">
                        <textarea
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="Schrijf een notitie..."
                          rows={3}
                          className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-sm text-text-main dark:text-text-primary placeholder:text-text-muted dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green resize-none"
                        />
                        <button
                          onClick={handleAddNote}
                          disabled={addingNote || !newNoteText.trim()}
                          className="w-full px-3 py-2 bg-primary dark:bg-primary-green text-white dark:text-dark-bg text-sm font-semibold rounded-lg hover:bg-primary-dark dark:hover:bg-light-green transition-colors disabled:opacity-50"
                        >
                          {addingNote ? 'Opslaan...' : 'Notitie toevoegen'}
                        </button>
                      </div>
                    )}

                    {/* Notes list */}
                    {loadingNotes ? (
                      <div className="text-center py-4 text-text-light dark:text-text-tertiary text-xs">Laden...</div>
                    ) : notes.length === 0 ? (
                      <p className="text-xs text-text-light dark:text-text-tertiary text-center py-2">Geen notities</p>
                    ) : (
                      <div className="space-y-2">
                        {notes.map((note) => (
                          <div key={note.id} className="bg-gray-50 dark:bg-dark-card-elevated p-3 rounded-lg">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-xs text-text-main dark:text-text-primary flex-1">{note.content}</p>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-text-muted dark:text-text-tertiary hover:text-status-red dark:hover:text-accent-red p-0.5 rounded transition-colors flex-shrink-0"
                              >
                                <span className="material-symbols-outlined !text-[14px]">delete</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-text-light dark:text-text-tertiary mt-1">
                              {formatDateShort(note.created_at)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Dialog */}
      {showStatusChangeDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-card rounded-3xl w-full max-w-md shadow-2xl dark:shadow-modal-dark">
            <div className="p-6 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-main dark:text-text-primary font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-primary dark:text-primary-green">edit</span>
                Schuld Bewerken
              </h3>
              <button onClick={() => {
                setShowStatusChangeDialog(false);
                setNewStatus(currentDebt.status || 'niet_actief');
              }} className="text-gray-400 dark:text-text-secondary hover:text-gray-600 dark:hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-text-secondary">
                Bewerk de gegevens van <strong className="text-text-main dark:text-text-primary">{currentDebt?.creditor_name}</strong>
              </p>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-text-main dark:text-text-primary mb-2 block">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Type Schuldeiser */}
              <div>
                <label className="text-sm font-semibold text-text-main dark:text-text-primary mb-2 block">Type Schuldeiser</label>
                <select
                  value={detailEditData.is_personal_loan ? 'persoonlijk' : (detailEditData.creditor_type || '')}
                  onChange={(e) => {
                    if (e.target.value === 'persoonlijk') {
                      setDetailEditData({...detailEditData, is_personal_loan: true, creditor_type: 'Persoonlijke lening'});
                    } else {
                      setDetailEditData({...detailEditData, is_personal_loan: false, creditor_type: e.target.value});
                    }
                  }}
                  className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                >
                  <option value="">Selecteer type</option>
                  <option value="bank">Bank</option>
                  <option value="overheid">Overheid</option>
                  <option value="zorgverzekeraar">Zorgverzekeraar</option>
                  <option value="telecom">Telecom</option>
                  <option value="energieleverancier">Energieleverancier</option>
                  <option value="webwinkel">Webwinkel</option>
                  <option value="incassobureau">Incassobureau</option>
                  <option value="deurwaarder">Deurwaarder</option>
                  <option value="persoonlijk">Persoonlijke lening</option>
                  <option value="overig">Overig</option>
                </select>
              </div>

              {/* Relatie (alleen bij persoonlijke lening) */}
              {detailEditData.is_personal_loan && (
                <div>
                  <label className="text-sm font-semibold text-text-main dark:text-text-primary mb-2 block">Relatie</label>
                  <select
                    value={detailEditData.loan_relationship || ''}
                    onChange={(e) => setDetailEditData({...detailEditData, loan_relationship: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                  >
                    <option value="">Selecteer relatie</option>
                    <option value="familie">Familie</option>
                    <option value="vriend">Vriend/vriendin</option>
                    <option value="kennis">Kennis</option>
                    <option value="werkgever">Werkgever</option>
                    <option value="overig">Overig</option>
                  </select>
                </div>
              )}

              {/* Datum Ontstaan */}
              <div>
                <label className="text-sm font-semibold text-text-main dark:text-text-primary mb-2 block">Datum Ontstaan</label>
                <input
                  type="date"
                  value={detailEditData.origin_date || ''}
                  onChange={(e) => setDetailEditData({...detailEditData, origin_date: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                />
              </div>

              {/* Dossiernummer */}
              <div>
                <label className="text-sm font-semibold text-text-main dark:text-text-primary mb-2 block">Dossiernummer</label>
                <input
                  type="text"
                  value={detailEditData.case_number || ''}
                  onChange={(e) => setDetailEditData({...detailEditData, case_number: e.target.value})}
                  placeholder="Optioneel"
                  className="w-full bg-gray-50 dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-4 py-2 text-sm text-text-main dark:text-text-primary placeholder:text-text-muted dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                />
              </div>

              {newStatus === 'betalingsregeling' && (
                <div className="space-y-3 p-4 bg-blue-50 dark:bg-accent-blue/10 rounded-lg border-2 border-blue-300 dark:border-accent-blue/20">
                  <h4 className="font-bold text-blue-900 dark:text-accent-blue text-base">💳 Betalingsregeling Instellen</h4>
                  <p className="text-xs text-blue-700 dark:text-text-secondary mb-2">
                    ℹ️ Vul het maandelijkse aflosbedrag en de startdatum van de regeling in
                  </p>
                  <div>
                    <label className="text-sm font-semibold text-text-main dark:text-text-primary">💶 Maandelijks aflosbedrag (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentPlanData.monthly_payment}
                      onChange={(e) => setPaymentPlanData({...paymentPlanData, monthly_payment: e.target.value})}
                      placeholder="bijv. 50.00"
                      className="w-full mt-1 bg-white dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-base font-medium text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                    />
                    <p className="text-xs text-gray-600 dark:text-text-tertiary mt-1">Het bedrag dat je elke maand afbetaalt</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-text-main dark:text-text-primary">📅 Startdatum & Betaaldatum per maand</label>
                    <input
                      type="date"
                      value={paymentPlanData.payment_plan_date}
                      onChange={(e) => setPaymentPlanData({...paymentPlanData, payment_plan_date: e.target.value})}
                      className="w-full mt-1 bg-white dark:bg-dark-card-elevated border border-gray-200 dark:border-dark-border-accent rounded-lg px-3 py-2 text-sm text-text-main dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-green"
                    />
                    <p className="text-xs text-gray-600 dark:text-text-tertiary mt-1">
                      De dag van de maand waarop je elke maand moet betalen
                    </p>
                  </div>
                  {paymentPlanData.monthly_payment && remainingAmount > 0 && (
                    <div className="text-sm text-blue-800 dark:text-accent-blue bg-gradient-to-r from-blue-100 to-green-100 dark:from-accent-blue/20 dark:to-primary-green/20 p-3 rounded-lg border border-blue-200 dark:border-accent-blue/20 font-medium">
                      ⏱️ Geschatte looptijd: <strong className="text-lg">{Math.ceil(remainingAmount / parseFloat(paymentPlanData.monthly_payment || 1))} maanden</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <button 
                  onClick={() => {
                    setShowStatusChangeDialog(false);
                    setNewStatus(currentDebt.status || 'niet_actief');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border text-text-main dark:text-text-primary font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card-elevated transition-colors"
                >
                  Annuleren
                </button>
                <button 
                  onClick={handleStatusUpdate}
                  className="px-4 py-2 bg-primary dark:bg-primary-green text-secondary dark:text-dark-bg font-semibold rounded-lg hover:bg-primary-dark dark:hover:bg-light-green transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
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

      <AddDocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSave={handleSaveDocument}
      />
    </>
  );
}
