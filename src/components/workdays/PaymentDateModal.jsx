import React, { useState, useEffect } from 'react';
import { Income } from '@/api/entities';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Modal om betaaldatum in te stellen op basis van:
 * - Laatste betaaldag
 * - Frequentie (wekelijks, tweewekelijks, maandelijks)
 *
 * Berekent automatisch de volgende betaaldag
 */
export default function PaymentDateModal({ isOpen, onClose, income, onSaved }) {
  const [lastPaymentDate, setLastPaymentDate] = useState('');
  const [frequency, setFrequency] = useState('maandelijks');
  const [calculatedNextDate, setCalculatedNextDate] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (income) {
      // Pre-fill met bestaande data
      setFrequency(income.frequency || 'maandelijks');

      // Als er al een last_payment_date is, gebruik die
      if (income.last_payment_date) {
        setLastPaymentDate(income.last_payment_date);
      } else if (income.day_of_month) {
        // Bereken een datum op basis van day_of_month
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, income.day_of_month);
        setLastPaymentDate(format(lastMonth, 'yyyy-MM-dd'));
      } else {
        setLastPaymentDate('');
      }
    }
  }, [income]);

  // Bereken volgende betaaldag wanneer inputs veranderen
  useEffect(() => {
    if (lastPaymentDate && frequency) {
      const lastDate = new Date(lastPaymentDate);
      let nextDate;

      switch (frequency) {
        case 'wekelijks':
          nextDate = addWeeks(lastDate, 1);
          break;
        case 'tweewekelijks':
          nextDate = addWeeks(lastDate, 2);
          break;
        case '4wekelijks':
          nextDate = addWeeks(lastDate, 4);
          break;
        case 'maandelijks':
        default:
          nextDate = addMonths(lastDate, 1);
          break;
      }

      // Als berekende datum in het verleden ligt, blijf toevoegen tot het in de toekomst is
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (nextDate < today) {
        switch (frequency) {
          case 'wekelijks':
            nextDate = addWeeks(nextDate, 1);
            break;
          case 'tweewekelijks':
            nextDate = addWeeks(nextDate, 2);
            break;
          case '4wekelijks':
            nextDate = addWeeks(nextDate, 4);
            break;
          case 'maandelijks':
          default:
            nextDate = addMonths(nextDate, 1);
            break;
        }
      }

      setCalculatedNextDate(nextDate);
    } else {
      setCalculatedNextDate(null);
    }
  }, [lastPaymentDate, frequency]);

  if (!isOpen || !income) return null;

  const handleSave = async () => {
    if (!calculatedNextDate) return;

    setSaving(true);
    try {
      // Update income met de nieuwe betaaldata
      const updateData = {
        frequency: frequency,
        last_payment_date: lastPaymentDate,
        // Voor maandelijks: ook day_of_month zetten
        day_of_month: frequency === 'maandelijks' ? new Date(lastPaymentDate).getDate() : null,
      };

      await Income.update(income.id, updateData);
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error saving payment date:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDateNL = (date) => {
    return format(date, "EEEE d MMMM yyyy", { locale: nl });
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      'wekelijks': 'Wekelijks',
      'tweewekelijks': 'Tweewekelijks',
      '4wekelijks': '4-wekelijks',
      'maandelijks': 'Maandelijks',
    };
    return labels[freq] || freq;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">event</span>
            </div>
            <h3 className="font-display font-bold text-lg text-[#131d0c] dark:text-white">Betaaldatum instellen</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Inkomen info */}
          <div className="p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl">
            <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-0.5">Inkomen:</p>
            <p className="font-bold text-[#131d0c] dark:text-white">{income.description || 'Inkomen'}</p>
          </div>

          {/* Frequentie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
              Hoe vaak word je betaald?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['wekelijks', 'tweewekelijks', '4wekelijks', 'maandelijks'].map(freq => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    frequency === freq
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  {getFrequencyLabel(freq)}
                </button>
              ))}
            </div>
          </div>

          {/* Laatste betaaldag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
              Wanneer was je laatste betaaldag?
            </label>
            <input
              type="date"
              value={lastPaymentDate}
              onChange={(e) => setLastPaymentDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Berekende volgende betaaldag */}
          {calculatedNextDate && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[18px]">check_circle</span>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Volgende betaaldag:</p>
              </div>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 capitalize">
                {formatDateNL(calculatedNextDate)}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Deze datum wordt getoond in je werkschema kalender
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#0a0a0a]/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] font-medium text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-all"
          >
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !calculatedNextDate}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Opslaan...' : 'Bevestigen'}
          </button>
        </div>
      </div>
    </div>
  );
}
