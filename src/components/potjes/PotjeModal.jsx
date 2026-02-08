import React, { useState, useEffect } from 'react';
import { Pot } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';

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
    e.preventDefault();

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
      const dataToSave = {
        ...formData,
        pot_type: formData.pot_type,
        budget: parseFloat(formData.budget || 0),
        target_amount: parseFloat(formData.target_amount || 0),
        current_amount: parseFloat(formData.current_amount || 0),
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-[480px] rounded-[24px] border border-gray-100 shadow-2xl overflow-hidden bg-white dark:bg-card-bg dark:border-border-main">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-[#3D6456] dark:text-konsensi-primary text-xl font-bold font-montserrat tracking-tight">
            {formData.id ? 'Potje Bewerken' : 'Nieuw Potje Aanmaken'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#3D6456] dark:hover:text-konsensi-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-8 pb-8 space-y-6">
          {/* Naam */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 dark:text-text-secondary uppercase tracking-widest block ml-1">
              Naam van je potje
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-200 dark:border-border-main dark:bg-card-elevated rounded-xl px-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-konsensi-primary dark:focus:border-konsensi-primary placeholder:text-gray-300 dark:placeholder:text-text-secondary/50 font-lato transition-all dark:text-white"
              placeholder="Bijv. Vakantie 2024"
            />
          </div>

          {/* Type potje */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 dark:text-text-secondary uppercase tracking-widest block ml-1">
              Type potje
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pot_type: 'expense' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  formData.pot_type === 'expense'
                    ? 'border-[#b2ff78] bg-[#b2ff78]/10 dark:border-konsensi-primary dark:bg-konsensi-primary/10'
                    : 'border-gray-100 dark:border-border-main bg-gray-50 dark:bg-card-elevated'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-red-500">receipt_long</span>
                <span className={`text-sm font-bold ${formData.pot_type === 'expense' ? 'text-[#3D6456] dark:text-konsensi-primary' : 'text-gray-500 dark:text-text-secondary'}`}>Enveloppe</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pot_type: 'savings' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  formData.pot_type === 'savings'
                    ? 'border-[#b2ff78] bg-[#b2ff78]/10 dark:border-konsensi-primary dark:bg-konsensi-primary/10'
                    : 'border-gray-100 dark:border-border-main bg-gray-50 dark:bg-card-elevated'
                }`}
              >
                <span className="material-symbols-outlined text-[18px] text-emerald-500">savings</span>
                <span className={`text-sm font-bold ${formData.pot_type === 'savings' ? 'text-[#3D6456] dark:text-konsensi-primary' : 'text-gray-500 dark:text-text-secondary'}`}>Spaarpot</span>
              </button>
            </div>
          </div>

          {/* Maandelijks budget (voor enveloppe/expense) */}
          {formData.pot_type === 'expense' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-text-secondary uppercase tracking-widest block ml-1">
                Maandelijks budget
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-secondary font-bold">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full border border-gray-200 dark:border-border-main dark:bg-card-elevated rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-konsensi-primary dark:focus:border-konsensi-primary font-lato transition-all dark:text-white"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          {/* Doelbedrag (voor spaarpot) */}
          {formData.pot_type === 'savings' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-text-secondary uppercase tracking-widest block ml-1">
                Doelbedrag
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-secondary font-bold">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="w-full border border-gray-200 dark:border-border-main dark:bg-card-elevated rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-konsensi-primary dark:focus:border-konsensi-primary font-lato transition-all dark:text-white"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          {/* Categorie & Icoon */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 dark:text-text-secondary uppercase tracking-widest block ml-1">
              Categorie & Icoon
            </label>
            <div className="grid grid-cols-5 gap-3">
              {iconOptions.slice(0, 5).map((option) => (
                <button
                  key={option.icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: option.icon })}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
                    formData.icon === option.icon
                      ? 'border-[#b2ff78] bg-[#b2ff78]/10 dark:border-konsensi-primary dark:bg-konsensi-primary/10'
                      : 'border-gray-100 dark:border-border-main bg-gray-50 dark:bg-card-elevated hover:border-[#3D6456]/30 dark:hover:border-konsensi-primary/30'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${
                    formData.icon === option.icon
                      ? 'text-[#3D6456] dark:text-konsensi-primary'
                      : 'text-gray-400 dark:text-text-secondary'
                  }`}>
                    {option.icon}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3 mt-3">
              {iconOptions.slice(5, 10).map((option) => (
                <button
                  key={option.icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: option.icon })}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
                    formData.icon === option.icon
                      ? 'border-[#b2ff78] bg-[#b2ff78]/10 dark:border-konsensi-primary dark:bg-konsensi-primary/10'
                      : 'border-gray-100 dark:border-border-main bg-gray-50 dark:bg-card-elevated hover:border-[#3D6456]/30 dark:hover:border-konsensi-primary/30'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${
                    formData.icon === option.icon
                      ? 'text-[#3D6456] dark:text-konsensi-primary'
                      : 'text-gray-400 dark:text-text-secondary'
                  }`}>
                    {option.icon}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Streefdatum (alleen bij spaarpot) */}
          {formData.pot_type === 'savings' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-text-secondary uppercase tracking-widest block ml-1">
                Streefdatum (optioneel)
              </label>
              <input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="w-full border border-gray-200 dark:border-border-main dark:bg-card-elevated rounded-xl px-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-konsensi-primary dark:focus:border-konsensi-primary text-gray-600 dark:text-white font-lato transition-all"
              />
            </div>
          )}

          {/* Huidig bedrag (alleen bij bewerken van spaarpot) */}
          {formData.id && formData.pot_type === 'savings' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-text-secondary uppercase tracking-widest block ml-1">
                Huidig gespaard
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-text-secondary font-bold">€</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  className="w-full border border-gray-200 dark:border-border-main dark:bg-card-elevated rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-konsensi-primary dark:focus:border-konsensi-primary font-lato transition-all dark:text-white"
                  placeholder="0,00"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-4 space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 dark:bg-konsensi-primary text-white dark:text-[#1a1a1a] py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 dark:shadow-konsensi-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Bezig...' : (formData.id ? 'Potje Opslaan' : 'Potje Starten')}
            </button>

            {formData.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
              >
                Potje Verwijderen
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
