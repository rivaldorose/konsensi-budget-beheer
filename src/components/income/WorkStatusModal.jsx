import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";

const workStatuses = [
  { value: 'werkend', label: 'Werkend', icon: '💼', description: 'Ik heb een baan (parttime of fulltime)' },
  { value: 'werkloos', label: 'Werkloos', icon: '🔍', description: 'Ik ben op zoek naar werk' },
  { value: 'uitkering', label: 'Uitkering', icon: '📋', description: 'Ik ontvang een uitkering (WW, bijstand, etc.)' },
  { value: 'zelfstandig', label: 'Zelfstandig/ZZP', icon: '🏠', description: 'Ik werk als zelfstandige of freelancer' },
  { value: 'student', label: 'Student', icon: '🎓', description: 'Ik studeer (met of zonder bijbaan)' },
  { value: 'pensioen', label: 'Gepensioneerd', icon: '🌴', description: 'Ik ben met pensioen' },
  { value: 'arbeidsongeschikt', label: 'Arbeidsongeschikt', icon: '🏥', description: 'Ik ontvang WIA/WAO/Wajong' },
  { value: 'anders', label: 'Anders', icon: '❓', description: 'Mijn situatie is anders' },
];

export default function WorkStatusModal({ isOpen, onClose, onSave }) {
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
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
      if (user.work_status) {
        setSelectedStatus(user.work_status);
        setCurrentStatus(user.work_status);
      }
      if (user.work_status_custom) {
        setCustomStatus(user.work_status_custom);
      }
    } catch (error) {
      console.error('Error loading work status:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedStatus) return;
    if (selectedStatus === 'anders' && !customStatus.trim()) return;
    
    setSaving(true);
    try {
      await User.updateMyUserData({ 
        work_status: selectedStatus,
        work_status_custom: selectedStatus === 'anders' ? customStatus : null
      });
      onSave?.(selectedStatus);
      onClose();
    } catch (error) {
      console.error('Error saving work status:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Werk/Inkomen Status</DialogTitle>
          <p className="text-sm text-gray-500">Wat is je huidige werksituatie?</p>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {workStatuses.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() => setSelectedStatus(status.value)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-all hover:border-green-400 hover:bg-green-50 ${
                selectedStatus === status.value ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{status.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{status.label}</h3>
                  <p className="text-xs text-gray-500">{status.description}</p>
                </div>
              </div>
            </button>
          ))}

          {selectedStatus === 'anders' && (
            <div className="mt-3">
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="Beschrijf je situatie..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Annuleren
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!selectedStatus || saving || (selectedStatus === 'anders' && !customStatus.trim())}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}