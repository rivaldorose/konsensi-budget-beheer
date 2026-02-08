import React, { useState, useEffect } from 'react';
import { Income } from '@/api/entities';

/**
 * Simpele modal om ALLEEN de betaaldatum van een inkomen in te stellen
 * Geen andere velden - alleen de betaaldatum
 */
export default function PaymentDateModal({ isOpen, onClose, income, onSaved }) {
  const [dayOfMonth, setDayOfMonth] = useState(25);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (income) {
      setDayOfMonth(income.day_of_month || 25);
    }
  }, [income]);

  if (!isOpen || !income) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await Income.update(income.id, {
        day_of_month: dayOfMonth
      });
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error saving payment date:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">event</span>
            </div>
            <h3 className="font-display font-bold text-lg text-[#131d0c] dark:text-white">Betaaldatum</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-[#a1a1a1] mb-1">Inkomen:</p>
            <p className="font-bold text-[#131d0c] dark:text-white">{income.description || 'Vast inkomen'}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
              Op welke dag van de maand word je betaald?
            </label>
            <div className="flex items-center gap-3">
              <select
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium text-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <span className="text-gray-500 dark:text-[#a1a1a1] font-medium">van de maand</span>
            </div>
          </div>

          {/* Quick select common days */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[1, 15, 20, 23, 25, 27, 28].map(day => (
              <button
                key={day}
                onClick={() => setDayOfMonth(day)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  dayOfMonth === day
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'
                }`}
              >
                {day}e
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#0a0a0a]/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] font-medium text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  );
}
