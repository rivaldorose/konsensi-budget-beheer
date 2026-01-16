import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User } from "@/api/entities";

const workStatuses = [
  { value: 'werkend', label: 'Werkend', icon: 'work', description: 'Ik heb een baan (parttime of fulltime)' },
  { value: 'werkloos', label: 'Werkloos', icon: 'search', description: 'Ik ben op zoek naar werk' },
  { value: 'uitkering', label: 'Uitkering', icon: 'corporate_fare', description: 'Ik ontvang een uitkering (WW, bijstand, etc.)' },
  { value: 'zzp', label: 'Zelfstandig/ZZP', icon: 'account_circle', description: 'Ik werk als zelfstandige of freelancer' },
  { value: 'student', label: 'Student', icon: 'school', description: 'Ik studeer (met of zonder bijbaan)' },
  { value: 'gepensioneerd', label: 'Gepensioneerd', icon: 'nature_people', description: 'Ik ben met pensioen' },
  { value: 'arbeidsongeschikt', label: 'Arbeidsongeschikt', icon: 'home', description: 'Ik ontvang WIA/WAO/Wajong' },
  { value: 'anders', label: 'Anders', icon: 'help', description: 'Mijn situatie is anders' },
];

export default function WorkStatusModal({ isOpen, onClose, onSave }) {
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [customStatus, setCustomStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCurrentStatus();
    }
  }, [isOpen]);

  const loadCurrentStatus = async () => {
    try {
      const user = await User.me();
      if (user?.work_status) {
        // Handle both array and legacy string format
        if (Array.isArray(user.work_status)) {
          setSelectedStatuses(user.work_status);
        } else {
          setSelectedStatuses([user.work_status]);
        }
      } else {
        setSelectedStatuses([]);
      }
      if (user?.work_status_custom) {
        setCustomStatus(user.work_status_custom);
      }
    } catch (error) {
      console.error('Error loading work status:', error);
    }
  };

  const toggleStatus = (value) => {
    setSelectedStatuses(prev => {
      if (prev.includes(value)) {
        return prev.filter(s => s !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleSave = async () => {
    if (selectedStatuses.length === 0) return;
    if (selectedStatuses.includes('anders') && !customStatus.trim()) return;

    setSaving(true);
    try {
      await User.updateMe({
        work_status: selectedStatuses,
        work_status_custom: selectedStatuses.includes('anders') ? customStatus : null
      });
      onSave?.(selectedStatuses);
      onClose();
    } catch (error) {
      console.error('Error saving work status:', error);
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (value) => selectedStatuses.includes(value);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] p-0 gap-0 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2a2a2a]">
        <div className="p-8 md:p-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              Werk/Inkomen Status
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-[#9CA3AF] hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
          <p className="text-[15px] text-gray-500 dark:text-[#A1A1A1] mb-2">
            Wat is je huidige werksituatie?
          </p>
          <p className="text-[13px] text-emerald-600 dark:text-emerald-400 mb-6">
            Je kunt meerdere opties selecteren
          </p>

          {/* Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {workStatuses.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => toggleStatus(status.value)}
                className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 text-left
                  ${isSelected(status.value)
                    ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-[#b4ff7a] dark:hover:border-emerald-500/50'
                  }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all relative
                  ${isSelected(status.value)
                    ? 'bg-emerald-500 text-white dark:text-black'
                    : 'bg-gray-50 dark:bg-[#2a2a2a] text-gray-500 dark:text-emerald-500 border border-gray-200 dark:border-[#3a3a3a]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{status.icon}</span>
                  {isSelected(status.value) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 dark:bg-emerald-400 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white dark:text-black text-[14px]">check</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-[16px]">
                    {status.label}
                  </h4>
                  <p className="text-[13px] text-gray-500 dark:text-[#A1A1A1] mt-1 leading-snug">
                    {status.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Custom Status Input */}
          {selectedStatuses.includes('anders') && (
            <div className="mb-8">
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Beschrijf je situatie..."
                className="w-full p-4 border-2 border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Selected count */}
          {selectedStatuses.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {selectedStatuses.map(status => {
                const statusInfo = workStatuses.find(s => s.value === status);
                return (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-[16px]">{statusInfo?.icon}</span>
                    {statusInfo?.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-xl border border-gray-200 dark:border-[#3a3a3a] text-gray-500 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={selectedStatuses.length === 0 || saving || (selectedStatuses.includes('anders') && !customStatus.trim())}
              className="px-10 py-4 rounded-xl bg-emerald-500 dark:bg-emerald-500 text-white dark:text-black font-bold font-display hover:bg-emerald-600 dark:hover:bg-emerald-400 transition-all text-[16px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
