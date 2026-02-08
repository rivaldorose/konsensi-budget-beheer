import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  paymentFrequencies,
  calculateMonthlyEquivalent,
  needsDayOfWeek,
  needsDayOfMonth
} from "../utils/frequencyHelpers";
import { Debt, User } from "@/api/entities";

const daysOfWeek = [
  { value: 1, label: 'Maandag' },
  { value: 2, label: 'Dinsdag' },
  { value: 3, label: 'Woensdag' },
  { value: 4, label: 'Donderdag' },
  { value: 5, label: 'Vrijdag' },
  { value: 6, label: 'Zaterdag' },
  { value: 0, label: 'Zondag' }
];

export default function IncomeFormModal({ income, isOpen, onClose, onSave, editingIncome }) {
  const incomeData = editingIncome || income;

  const [step, setStep] = useState(incomeData ? 2 : 1);
  const [incomeType, setIncomeType] = useState(incomeData?.income_type || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(incomeData || {
    description: '',
    name: '',
    category: 'salaris',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    day_of_week: null,
    day_of_month: 25,
    is_active: true,
    is_variable: false,
    notes: '',
    income_type: 'vast',
    date: new Date().toISOString().split('T')[0]
  });

  // Lening-specifieke velden
  const [loanData, setLoanData] = useState({
    creditor_name: '',
    interest_rate: 0,
    has_interest: false
  });

  const [monthlyEquivalent, setMonthlyEquivalent] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (incomeData) {
        setStep(2);
        setIncomeType(incomeData.income_type || 'vast');
      } else {
        setStep(1);
        setIncomeType(null);
      }
    }
  }, [isOpen, incomeData]);

  useEffect(() => {
    const equiv = calculateMonthlyEquivalent(parseFloat(formData.amount) || 0, formData.frequency);
    setMonthlyEquivalent(equiv);
  }, [formData.amount, formData.frequency]);

  useEffect(() => {
    if (incomeData) {
      setFormData({
        ...incomeData,
        amount: incomeData.amount?.toString() || '',
        day_of_week: incomeData.day_of_week || null,
        day_of_month: incomeData.day_of_month || 25,
        end_date: incomeData.end_date || '',
        notes: incomeData.notes || ''
      });
    }
  }, [incomeData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Ensure we have a valid income type
      const type = incomeType || 'vast';

      // Voor lening: behandel als extra inkomen maar maak ook schuld aan
      const effectiveType = type === 'lening' ? 'extra' : type;

      const data = {
        name: formData.description || formData.name || 'Inkomen',
        description: formData.description || '',
        income_type: effectiveType,
        amount: parseFloat(formData.amount) || 0,
        monthly_equivalent: effectiveType === 'vast' ? monthlyEquivalent : null,
        day_of_week: effectiveType === 'vast' && needsDayOfWeek(formData.frequency) ? formData.day_of_week : null,
        day_of_month: effectiveType === 'vast' && needsDayOfMonth(formData.frequency) ? formData.day_of_month : null,
        end_date: formData.end_date || null,
        date: effectiveType === 'extra' ? formData.date : null,
        frequency: effectiveType === 'vast' ? formData.frequency : null,
        is_variable: effectiveType === 'vast' ? formData.is_variable : false,
        is_active: true,
        category: type === 'lening' ? 'lening' : (formData.category || 'salaris'),
        start_date: formData.start_date || new Date().toISOString().split('T')[0]
      };

      console.log('[IncomeFormModal] Submitting data:', data);

      // Als het een lening is, maak ook automatisch een schuld aan
      if (type === 'lening' && loanData.creditor_name) {
        try {
          // Haal user op voor user_id
          const currentUser = await User.me();

          const debtData = {
            user_id: currentUser.id,
            name: `Lening van ${loanData.creditor_name}`,
            creditor: loanData.creditor_name,
            amount: parseFloat(formData.amount) || 0,
            amount_paid: 0,
            status: 'open',
            category: 'lening_particulier',
            interest_rate: loanData.has_interest ? loanData.interest_rate : 0,
            notes: `Geleend geld ontvangen op ${formData.date || new Date().toISOString().split('T')[0]}`,
            created_at: new Date().toISOString()
          };

          console.log('[IncomeFormModal] Creating debt for loan:', debtData);
          await Debt.create(debtData);
          console.log('[IncomeFormModal] Debt created successfully');
        } catch (debtError) {
          console.error('[IncomeFormModal] Error creating debt:', debtError);
          // Ga door met het opslaan van het inkomen, zelfs als de schuld niet kon worden aangemaakt
        }
      }

      await onSave(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setIncomeType(null);
    setFormData({
      description: '',
      name: '',
      category: 'salaris',
      amount: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      day_of_week: null,
      day_of_month: 25,
      is_active: true,
      is_variable: false,
      notes: '',
      income_type: 'vast',
      date: new Date().toISOString().split('T')[0]
    });
    setLoanData({
      creditor_name: '',
      interest_rate: 0,
      has_interest: false
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[600px] p-0 gap-0 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a] rounded-[24px] overflow-hidden">
        <div className="p-10 md:p-12">
          {/* Header */}
          <div className="mb-2">
            <h2 className="text-[28px] font-bold text-[#1F2937] dark:text-white font-display leading-tight tracking-tight">
              {incomeData ? 'Inkomen Bewerken' : step === 1 ? 'Inkomen Toevoegen' : incomeType === 'vast' ? 'Vast Inkomen Toevoegen' : 'Extra Inkomen Toevoegen'}
            </h2>
          </div>

          {/* Step 1: Type Selection */}
          {step === 1 && !incomeData && (
            <>
              <p className="text-[15px] text-gray-500 dark:text-[#a1a1a1] mb-8 leading-relaxed">
                Kies het type inkomen dat je wilt toevoegen om je overzicht accuraat te houden.
              </p>

              <div className="flex flex-col gap-4 mb-8">
                {/* Vast Inkomen Option */}
                <label className="cursor-pointer group relative">
                  <input
                    type="radio"
                    name="income_type"
                    className="sr-only"
                    checked={incomeType === 'vast'}
                    onChange={() => setIncomeType('vast')}
                  />
                  <div className={`flex flex-col p-6 rounded-[16px] transition-all ${
                    incomeType === 'vast'
                      ? 'bg-[#F0FDF4] dark:bg-[#10b981]/10 border-2 border-[#10B981]'
                      : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] hover:border-[#10B981] hover:bg-[#F0FDF4]/30 dark:hover:bg-[#10b981]/5'
                  }`}>
                    <div className="flex items-center gap-4 mb-3">
                      <span
                        className={`material-symbols-outlined text-[32px] ${incomeType === 'vast' ? 'text-[#10B981]' : 'text-gray-400 dark:text-[#a1a1a1] group-hover:text-[#10B981]'}`}
                        style={{ fontVariationSettings: incomeType === 'vast' ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        bolt
                      </span>
                      <h3 className="text-[18px] font-semibold text-[#1F2937] dark:text-white">Vast Inkomen</h3>
                    </div>
                    <p className="text-[14px] text-gray-500 dark:text-[#a1a1a1] leading-relaxed">
                      Terugkerend inkomen zoals salaris, uitkering of studiefinanciering.
                    </p>
                  </div>
                </label>

                {/* Extra Inkomen Option */}
                <label className="cursor-pointer group relative">
                  <input
                    type="radio"
                    name="income_type"
                    className="sr-only"
                    checked={incomeType === 'extra'}
                    onChange={() => setIncomeType('extra')}
                  />
                  <div className={`flex flex-col p-6 rounded-[16px] transition-all ${
                    incomeType === 'extra'
                      ? 'bg-[#F0FDF4] dark:bg-[#10b981]/10 border-2 border-[#10B981]'
                      : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] hover:border-[#10B981] hover:bg-[#F0FDF4]/30 dark:hover:bg-[#10b981]/5'
                  }`}>
                    <div className="flex items-center gap-4 mb-3">
                      <span
                        className={`material-symbols-outlined text-[32px] ${incomeType === 'extra' ? 'text-[#10B981]' : 'text-gray-400 dark:text-[#a1a1a1] group-hover:text-[#10B981]'}`}
                      >
                        redeem
                      </span>
                      <h3 className="text-[18px] font-semibold text-[#1F2937] dark:text-white">Extra Inkomen</h3>
                    </div>
                    <p className="text-[14px] text-gray-500 dark:text-[#a1a1a1] leading-relaxed">
                      Eenmalige inkomsten zoals bonussen, cadeaus of terugbetalingen.
                    </p>
                  </div>
                </label>

                {/* Geleend Geld Option */}
                <label className="cursor-pointer group relative">
                  <input
                    type="radio"
                    name="income_type"
                    className="sr-only"
                    checked={incomeType === 'lening'}
                    onChange={() => setIncomeType('lening')}
                  />
                  <div className={`flex flex-col p-6 rounded-[16px] transition-all ${
                    incomeType === 'lening'
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-500'
                      : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#3a3a3a] hover:border-amber-500 hover:bg-amber-50/30 dark:hover:bg-amber-500/5'
                  }`}>
                    <div className="flex items-center gap-4 mb-3">
                      <span
                        className={`material-symbols-outlined text-[32px] ${incomeType === 'lening' ? 'text-amber-500' : 'text-gray-400 dark:text-[#a1a1a1] group-hover:text-amber-500'}`}
                      >
                        account_balance
                      </span>
                      <h3 className="text-[18px] font-semibold text-[#1F2937] dark:text-white">Geleend Geld</h3>
                    </div>
                    <p className="text-[14px] text-gray-500 dark:text-[#a1a1a1] leading-relaxed">
                      Geld dat je hebt geleend. Dit wordt automatisch ook als schuld geregistreerd.
                    </p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!incomeType}
                  className="w-full bg-[#10B981] text-white font-semibold py-[14px] rounded-[12px] hover:bg-[#059669] transition-all text-[16px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volgende
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-gray-500 dark:text-[#a1a1a1] hover:text-gray-700 dark:hover:text-white transition-colors text-[15px] font-medium py-1"
                >
                  Annuleren
                </button>
              </div>
            </>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <>
              {/* Back link */}
              {!incomeData && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-[14px] text-[#10B981] hover:text-[#059669] font-bold transition-colors mb-8"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  Terug naar type selectie
                </button>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Omschrijving */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Omschrijving *</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">chat_bubble</span>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={incomeType === 'vast' ? "bijv. Salaris, Zorgtoeslag" : "bijv. Marktplaats verkoop, Bonus"}
                      required
                      className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Bedrag */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Bedrag (€) *</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">euro</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      required
                      className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Extra Inkomen: alleen datum */}
                {incomeType === 'extra' && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Datum ontvangen *</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">calendar_today</span>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                          className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-4 text-gray-900 dark:text-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Info banner */}
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[20px]">info</span>
                      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        Let op: Dit inkomen wordt alleen meegeteld in de geselecteerde maand.
                      </p>
                    </div>
                  </>
                )}

                {/* Geleend Geld: extra velden */}
                {incomeType === 'lening' && (
                  <>
                    {/* Datum ontvangen */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Datum ontvangen *</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">calendar_today</span>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                          className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-4 text-gray-900 dark:text-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Van wie geleend */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Van wie geleend? *</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">person</span>
                        <input
                          type="text"
                          value={loanData.creditor_name}
                          onChange={(e) => setLoanData(prev => ({ ...prev, creditor_name: e.target.value }))}
                          placeholder="bijv. Ouders, Vriend, Bank"
                          required
                          className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Rente toggle */}
                    <div className="flex items-center justify-between py-2 px-1">
                      <span className="text-[15px] font-bold text-[#1F2937] dark:text-white">Is er rente?</span>
                      <Switch
                        checked={loanData.has_interest}
                        onCheckedChange={(checked) => setLoanData(prev => ({ ...prev, has_interest: checked, interest_rate: checked ? prev.interest_rate : 0 }))}
                      />
                    </div>

                    {/* Rente percentage */}
                    {loanData.has_interest && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Rente percentage (%)</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">percent</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={loanData.interest_rate}
                            onChange={(e) => setLoanData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.0"
                            className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Info banner */}
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">info</span>
                      <div className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                        <p className="font-semibold mb-1">Let op:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Dit bedrag wordt als inkomen voor deze maand geregistreerd</li>
                          <li>Er wordt automatisch een schuld aangemaakt bij "{loanData.creditor_name || '...'}"</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}

                {/* Vast Inkomen: uitgebreide opties */}
                {incomeType === 'vast' && (
                  <>
                    {/* Frequentie */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Frequentie *</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">repeat</span>
                        <select
                          value={formData.frequency}
                          onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                          className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-10 text-gray-900 dark:text-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all appearance-none cursor-pointer outline-none"
                        >
                          {paymentFrequencies.map((freq) => (
                            <option key={freq.value} value={freq.value}>{freq.label}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] pointer-events-none">expand_more</span>
                      </div>
                    </div>

                    {/* Betaaldag - Day of Month */}
                    {needsDayOfMonth(formData.frequency) && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Betaaldag *</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">calendar_month</span>
                          <select
                            value={formData.day_of_month?.toString() || '25'}
                            onChange={(e) => setFormData(prev => ({ ...prev, day_of_month: parseInt(e.target.value) }))}
                            className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-10 text-gray-900 dark:text-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all appearance-none cursor-pointer outline-none"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <option key={day} value={day}>{day}e van de maand</option>
                            ))}
                            <option value="0">Laatste dag van de maand</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] pointer-events-none">expand_more</span>
                        </div>
                      </div>
                    )}

                    {/* Day of Week */}
                    {needsDayOfWeek(formData.frequency) && (
                      <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-bold text-gray-700 dark:text-[#a1a1a1] ml-1">Op welke dag? *</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] text-[20px]">calendar_month</span>
                          <select
                            value={formData.day_of_week?.toString() || '5'}
                            onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                            className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl py-4 pl-12 pr-10 text-gray-900 dark:text-white focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all appearance-none cursor-pointer outline-none"
                          >
                            {daysOfWeek.map((day) => (
                              <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] pointer-events-none">expand_more</span>
                        </div>
                      </div>
                    )}

                    {/* Variabel inkomen toggle */}
                    <div className="flex items-center justify-between py-2 px-1">
                      <span className="text-[15px] font-bold text-[#1F2937] dark:text-white">Variabel inkomen?</span>
                      <Switch
                        checked={formData.is_variable || false}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_variable: checked }))}
                      />
                    </div>

                    {/* Info banner for variable income */}
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5 flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-500 text-[22px] mt-0.5">info</span>
                      <p className="text-[14px] text-amber-700 dark:text-amber-300 leading-relaxed">
                        Dit is handig voor flexwerkers. We vragen je dan elke maand om je werkelijke inkomen te bevestigen.
                      </p>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 rounded-full transition-all shadow-lg shadow-[#10B981]/20 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                        Bezig...
                      </>
                    ) : (
                      incomeData ? 'Bijwerken' : 'Toevoegen'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-[#a1a1a1] font-bold py-3 rounded-full transition-all"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
