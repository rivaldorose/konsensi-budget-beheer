import React, { useState } from 'react';
import { Pot } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';

const ICON_OPTIONS = [
  { icon: 'flight_takeoff', label: 'Reizen' },
  { icon: 'home', label: 'Huis' },
  { icon: 'directions_car', label: 'Vervoer' },
  { icon: 'devices', label: 'Tech' },
  { icon: 'redeem', label: 'Cadeaus' },
  { icon: 'shield', label: 'Noodfonds' },
  { icon: 'school', label: 'Educatie' },
  { icon: 'celebration', label: 'Feesten' },
  { icon: 'savings', label: 'Sparen' },
  { icon: 'shopping_bag', label: 'Shopping' },
];

export default function CreatePotModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flight_takeoff');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ title: 'Vul een naam in', variant: 'destructive' });
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      toast({ title: 'Vul een geldig doelbedrag in', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const iconLabel = ICON_OPTIONS.find(i => i.icon === selectedIcon)?.label || 'Sparen';

      await Pot.create({
        name: name.trim(),
        icon: selectedIcon === 'flight_takeoff' ? '✈️' :
              selectedIcon === 'home' ? '🏠' :
              selectedIcon === 'directions_car' ? '🚗' :
              selectedIcon === 'devices' ? '💻' :
              selectedIcon === 'redeem' ? '🎁' :
              selectedIcon === 'shield' ? '🛡️' :
              selectedIcon === 'school' ? '🎓' :
              selectedIcon === 'celebration' ? '🎉' :
              selectedIcon === 'savings' ? '💰' :
              selectedIcon === 'shopping_bag' ? '🛍️' : '💰',
        pot_type: 'savings',
        category: iconLabel.toLowerCase(),
        target_amount: parseFloat(targetAmount),
        current_amount: 0,
        target_date: targetDate || null,
        monthly_budget: 0,
        is_essential: false,
      });

      toast({ title: `Potje "${name}" aangemaakt!` });

      // Reset form
      setName('');
      setTargetAmount('');
      setSelectedIcon('flight_takeoff');
      setTargetDate('');

      onCreated?.();
    } catch (error) {
      console.error('Error creating pot:', error);
      toast({ title: 'Fout bij aanmaken van potje', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setTargetAmount('');
    setSelectedIcon('flight_takeoff');
    setTargetDate('');
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-[#3D6456]/15 dark:bg-black/50 backdrop-blur-[4px]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-[#1a1a1a] w-full max-w-[480px] rounded-[24px] border border-gray-100 dark:border-[#2a2a2a] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <h2 className="text-[#3D6456] dark:text-white text-xl font-bold font-montserrat tracking-tight">
              Nieuw Potje Aanmaken
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 dark:text-[#a1a1a1] hover:text-[#3D6456] dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-[#6b7280] uppercase tracking-widest block ml-1">
                Naam van je potje
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-[#10B981] dark:focus:border-[#10B981] placeholder:text-gray-300 dark:placeholder:text-[#6b7280] text-[#1F2937] dark:text-white font-lato transition-all"
                placeholder="Bijv. Vakantie 2024"
              />
            </div>

            {/* Target Amount Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-[#6b7280] uppercase tracking-widest block ml-1">
                Doelbedrag
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] font-bold">
                  €
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-[#10B981] dark:focus:border-[#10B981] placeholder:text-gray-300 dark:placeholder:text-[#6b7280] text-[#1F2937] dark:text-white font-lato transition-all"
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-[#6b7280] uppercase tracking-widest block ml-1">
                Categorie & Icoon
              </label>
              <div className="grid grid-cols-5 gap-3">
                {ICON_OPTIONS.slice(0, 5).map((option) => (
                  <button
                    key={option.icon}
                    type="button"
                    onClick={() => setSelectedIcon(option.icon)}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
                      selectedIcon === option.icon
                        ? 'border-[#b2ff78] bg-[#b2ff78]/5 dark:bg-[#b2ff78]/10 text-[#3D6456] dark:text-[#b2ff78]'
                        : 'border-gray-100 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#2a2a2a] text-gray-400 dark:text-[#6b7280] hover:border-[#3D6456]/30 dark:hover:border-[#10B981]/30'
                    }`}
                  >
                    <span className="material-symbols-outlined">{option.icon}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-3 mt-3">
                {ICON_OPTIONS.slice(5, 10).map((option) => (
                  <button
                    key={option.icon}
                    type="button"
                    onClick={() => setSelectedIcon(option.icon)}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
                      selectedIcon === option.icon
                        ? 'border-[#b2ff78] bg-[#b2ff78]/5 dark:bg-[#b2ff78]/10 text-[#3D6456] dark:text-[#b2ff78]'
                        : 'border-gray-100 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#2a2a2a] text-gray-400 dark:text-[#6b7280] hover:border-[#3D6456]/30 dark:hover:border-[#10B981]/30'
                    }`}
                  >
                    <span className="material-symbols-outlined">{option.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Date Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 dark:text-[#6b7280] uppercase tracking-widest block ml-1">
                Streefdatum (optioneel)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-[#3a3a3a] bg-white dark:bg-[#2a2a2a] rounded-xl px-4 py-3 text-sm focus:ring-[#3D6456] focus:border-[#3D6456] dark:focus:ring-[#10B981] dark:focus:border-[#10B981] text-gray-600 dark:text-white font-lato transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-[#10B981]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? 'Aanmaken...' : 'Potje Starten'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
