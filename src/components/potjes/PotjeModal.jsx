import React, { useState, useEffect } from 'react';
import { Pot, User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';

// Icon options met Material Symbols namen
const iconOptions = [
  { icon: 'flight_takeoff', label: 'Reizen', category: 'reizen' },
  { icon: 'home', label: 'Wonen', category: 'wonen' },
  { icon: 'directions_car', label: 'Auto', category: 'vervoer' },
  { icon: 'devices', label: 'Elektronica', category: 'elektronica' },
  { icon: 'redeem', label: 'Cadeau', category: 'cadeau' },
  { icon: 'savings', label: 'Sparen', category: 'sparen' },
  { icon: 'school', label: 'Studie', category: 'studie' },
  { icon: 'shopping_bag', label: 'Shopping', category: 'shopping' },
  { icon: 'favorite', label: 'Gezondheid', category: 'gezondheid' },
  { icon: 'celebration', label: 'Feest', category: 'feest' },
];

const initialFormData = {
  name: '',
  icon: 'flight_takeoff',
  pot_type: 'expense',
  budget: '',
  target_amount: '',
  current_amount: 0,
  target_date: '',
};

export default function PotjeModal({ pot, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (pot) {
        setFormData({
          id: pot.id,
          name: pot.name || '',
          icon: pot.icon || 'flight_takeoff',
          pot_type: pot.pot_type || 'expense',
          budget: pot.budget || pot.monthly_budget || '',
          target_amount: pot.target_amount || '',
          current_amount: pot.current_amount || 0,
          target_date: pot.target_date || '',
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [pot, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!formData.name) {
      toast({ title: "Vul een naam in", variant: "destructive" });
      return;
    }

    if (formData.pot_type === 'expense' && (!formData.budget || formData.budget === '')) {
      toast({ title: "Vul een maandelijks budget in", variant: "destructive" });
      return;
    }

    if (formData.pot_type === 'savings' && (!formData.target_amount || formData.target_amount === '')) {
      toast({ title: "Vul een doelbedrag in", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await User.me();
      if (!user) {
        toast({ title: "Niet ingelogd", variant: "destructive" });
        return;
      }

      const dataToSave = {
        name: formData.name,
        icon: formData.icon,
        pot_type: formData.pot_type,
        budget: parseFloat(formData.budget || 0),
        monthly_budget: parseFloat(formData.budget || 0),
        target_amount: parseFloat(formData.target_amount || 0),
        current_amount: parseFloat(formData.current_amount || 0),
        target_date: formData.target_date || null,
        user_id: user.id,
      };

      if (formData.id) {
        await Pot.update(formData.id, dataToSave);
        toast({ title: `Potje "${formData.name}" bijgewerkt!` });
      } else {
        await Pot.create(dataToSave);
        toast({ title: `Potje "${formData.name}" aangemaakt!` });
      }

      onSave();
    } catch (error) {
      console.error("Error saving pot:", error);
      toast({ title: "Fout bij opslaan van potje.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Weet je zeker dat je het potje "${formData.name}" wilt verwijderen?`)) {
      try {
        await Pot.delete(formData.id);
        toast({ title: "Potje verwijderd." });
        onSave();
      } catch (error) {
        toast({ title: "Kon potje niet verwijderen.", variant: "destructive" });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400">savings</span>
            </div>
            <h3 className="font-display font-bold text-lg text-[#131d0c] dark:text-white">
              {formData.id ? 'Potje Bewerken' : 'Nieuw Potje'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Naam */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
              Naam van je potje
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Bijv. Boodschappen, Vakantie 2024"
            />
          </div>

          {/* Type potje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
              Type potje
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pot_type: 'expense' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  formData.pot_type === 'expense'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span className="text-sm font-bold">Enveloppe</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pot_type: 'savings' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  formData.pot_type === 'savings'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                    : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">savings</span>
                <span className="text-sm font-bold">Spaarpot</span>
              </button>
            </div>
          </div>

          {/* Maandelijks budget (voor enveloppe/expense) */}
          {formData.pot_type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
                Maandelijks budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] font-bold text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          {/* Doelbedrag (voor spaarpot) */}
          {formData.pot_type === 'savings' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
                Doelbedrag
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] font-bold text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          {/* Categorie & Icoon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
              Icoon
            </label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((option) => (
                <button
                  key={option.icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: option.icon })}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[11px] font-medium transition-all border ${
                    formData.icon === option.icon
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-200 dark:hover:border-emerald-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{option.icon}</span>
                  <span className="truncate w-full text-center">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Streefdatum (alleen bij spaarpot) */}
          {formData.pot_type === 'savings' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
                Streefdatum (optioneel)
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Huidig bedrag (alleen bij bewerken van spaarpot) */}
          {formData.id && formData.pot_type === 'savings' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
                Huidig gespaard
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] font-bold text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#0a0a0a]/50 space-y-3">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Opslaan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">check</span>
                {formData.id ? 'Potje Opslaan' : 'Potje Starten'}
              </>
            )}
          </button>

          {formData.id && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full px-6 py-2.5 rounded-xl border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Potje Verwijderen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
