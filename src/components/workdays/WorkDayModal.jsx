import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function WorkDayModal({ isOpen, onClose, onSave, onDelete, workDay, defaultHourlyRate, employers = [], defaultEmployer = '' }) {
  const [formData, setFormData] = useState({
    date: '',
    employer: defaultEmployer || '',
    hours_worked: '',
    hourly_rate: defaultHourlyRate || '',
    status: 'gepland',
    shift_type: '',
    notes: '',
    is_paid: false
  });
  const [newEmployer, setNewEmployer] = useState('');
  const [showNewEmployerInput, setShowNewEmployerInput] = useState(false);

  useEffect(() => {
    if (workDay && workDay.id) {
      setFormData({
        date: workDay.date || '',
        employer: workDay.employer || defaultEmployer || '',
        hours_worked: workDay.hours_worked || '',
        hourly_rate: workDay.hourly_rate || defaultHourlyRate || '',
        status: workDay.status || 'gepland',
        shift_type: workDay.shift_type || '',
        notes: workDay.notes || '',
        is_paid: workDay.is_paid || false
      });
      setShowNewEmployerInput(false);
    } else if (workDay && workDay instanceof Date) {
      setFormData({
        date: format(workDay, 'yyyy-MM-dd'),
        employer: defaultEmployer || '',
        hours_worked: '',
        hourly_rate: defaultHourlyRate || '',
        status: 'gepland',
        shift_type: '',
        notes: '',
        is_paid: false
      });
      setShowNewEmployerInput(employers.length === 0);
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        employer: defaultEmployer || '',
        hours_worked: '',
        hourly_rate: defaultHourlyRate || '',
        status: 'gepland',
        shift_type: '',
        notes: '',
        is_paid: false
      });
      setShowNewEmployerInput(employers.length === 0);
    }
    setNewEmployer('');
  }, [workDay, defaultHourlyRate, defaultEmployer, isOpen, employers.length]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Als status vrij of ziek is, hoeven uren en uurloon niet ingevuld
    if (formData.status === 'vrij' || formData.status === 'ziek') {
      onSave({
        ...formData,
        hours_worked: 0,
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        calculated_amount: 0
      });
      return;
    }

    const hours = parseFloat(formData.hours_worked);
    const rate = parseFloat(formData.hourly_rate);
    const calculated_amount = hours * rate;

    onSave({
      ...formData,
      hours_worked: hours,
      hourly_rate: rate,
      calculated_amount
    });
  };

  const calculatedAmount = (parseFloat(formData.hours_worked) || 0) * (parseFloat(formData.hourly_rate) || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-[#0a0a0a]/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-200 dark:border-[#2a2a2a] shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.7)] w-full max-w-[600px] p-8 md:p-12 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-display font-bold text-2xl text-[#1F2937] dark:text-white">
            {workDay?.id ? 'Werkdag Bewerken' : 'Werkdag Toevoegen'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-[#6b7280] hover:text-gray-600 dark:hover:text-white transition-colors p-1"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Datum */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Datum *</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] group-focus-within:text-gray-600 dark:group-focus-within:text-white transition-colors pointer-events-none">
                <span className="material-symbols-outlined text-xl">calendar_today</span>
              </div>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-[#1F2937] dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
              />
            </div>
          </div>

          {/* Werkgever */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Werkgever *</label>
            {employers.length > 0 && !showNewEmployerInput ? (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] group-focus-within:text-gray-600 dark:group-focus-within:text-white transition-colors pointer-events-none">
                  <span className="material-symbols-outlined text-xl">work</span>
                </div>
                <select
                  value={formData.employer}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setShowNewEmployerInput(true);
                      setFormData({ ...formData, employer: '' });
                    } else {
                      setFormData({ ...formData, employer: e.target.value });
                    }
                  }}
                  required
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-12 pr-10 py-3.5 text-sm font-medium text-[#1F2937] dark:text-white appearance-none focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                >
                  <option value="" disabled>Selecteer werkgever</option>
                  {employers.map((emp) => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                  <option value="__new__">+ Nieuwe werkgever</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] pointer-events-none">expand_more</span>
              </div>
            ) : (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] group-focus-within:text-gray-600 dark:group-focus-within:text-white transition-colors pointer-events-none">
                  <span className="material-symbols-outlined text-xl">work</span>
                </div>
                <input
                  type="text"
                  value={formData.employer || newEmployer}
                  onChange={(e) => {
                    setFormData({ ...formData, employer: e.target.value });
                    setNewEmployer(e.target.value);
                  }}
                  placeholder="Bijv. Albert Heijn, Binck, etc."
                  required
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-[#1F2937] dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                />
                {employers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewEmployerInput(false);
                      setFormData({ ...formData, employer: defaultEmployer || employers[0] || '' });
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-primary dark:text-[#10b981] hover:underline"
                  >
                    Annuleren
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Uren & Uurloon Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">
                Uren Gewerkt {(formData.status === 'vrij' || formData.status === 'ziek') ? '' : '*'}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] group-focus-within:text-gray-600 dark:group-focus-within:text-white transition-colors pointer-events-none">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                  placeholder="0.0"
                  required={formData.status !== 'vrij' && formData.status !== 'ziek'}
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-[#1F2937] dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">
                Uurloon (€) {(formData.status === 'vrij' || formData.status === 'ziek') ? '' : '*'}
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] group-focus-within:text-gray-600 dark:group-focus-within:text-white transition-colors pointer-events-none">
                  <span className="material-symbols-outlined text-xl">euro</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.hourly_rate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      setFormData({ ...formData, hourly_rate: value });
                    }
                  }}
                  placeholder="0.00"
                  required={formData.status !== 'vrij' && formData.status !== 'ziek'}
                  className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl pl-12 pr-4 py-3.5 text-sm font-medium text-[#1F2937] dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Status *</label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1F2937] dark:text-white appearance-none focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
              >
                <option value="gepland">Gepland</option>
                <option value="gewerkt">Gewerkt</option>
                <option value="ziek">Ziek</option>
                <option value="vrij">Vrij</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Type Dienst */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Type Dienst (optioneel)</label>
            <div className="relative">
              <select
                value={formData.shift_type}
                onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3.5 text-sm font-medium text-[#1F2937] dark:text-white appearance-none focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
              >
                <option value="">Selecteer type dienst</option>
                <option value="ochtend">Ochtenddienst</option>
                <option value="middag">Middagdienst</option>
                <option value="avond">Avonddienst</option>
                <option value="nacht">Nachtdienst</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Notities */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase text-gray-500 dark:text-[#a1a1a1] tracking-widest">Notities</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Bijv. bijzonderheden over de dienst..."
              rows={3}
              className="w-full bg-gray-50 dark:bg-[#2a2a2a] border border-gray-200 dark:border-[#3a3a3a] rounded-xl px-4 py-3 text-sm font-medium text-[#1F2937] dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] resize-none focus:ring-2 focus:ring-primary dark:focus:ring-[#10b981] focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Calculated Amount */}
          {calculatedAmount > 0 && (
            <div className="bg-green-50 dark:bg-[#10b981]/10 border border-green-200 dark:border-[#10b981]/20 rounded-xl p-4">
              <p className="text-sm text-green-700 dark:text-[#34d399] font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">payments</span>
                Verdiend: <span className="text-lg font-bold">€{calculatedAmount.toFixed(2)}</span>
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-between gap-4 mt-4">
            {onDelete && workDay?.id && (
              <button
                type="button"
                onClick={() => {
                  onDelete(workDay.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-red-200 dark:border-red-500/30 bg-transparent hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Verwijder
              </button>
            )}

            <div className="flex items-center gap-4 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-transparent hover:bg-gray-50 dark:hover:bg-[#1a1a1a] text-[#1F2937] dark:text-white font-bold text-sm transition-all"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="px-10 py-3 rounded-xl bg-primary dark:bg-[#10b981] hover:bg-primary-dark dark:hover:bg-[#34d399] active:bg-primary dark:active:bg-[#059669] text-white dark:text-black font-display font-bold text-sm shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Opslaan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
