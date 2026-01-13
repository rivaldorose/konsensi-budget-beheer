import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    }
    setNewEmployer('');
  }, [workDay, defaultHourlyRate, defaultEmployer, isOpen]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {workDay?.id ? 'Werkdag Bewerken' : 'Werkdag Toevoegen'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Datum *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Werkgever *</Label>
            {employers.length > 0 ? (
              <Select 
                value={formData.employer} 
                onValueChange={(value) => {
                  if (value === '__new__') {
                    setFormData({ ...formData, employer: '' });
                  } else {
                    setFormData({ ...formData, employer: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer werkgever" />
                </SelectTrigger>
                <SelectContent>
                  {employers.map((emp) => (
                    <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Nieuwe werkgever</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            {(employers.length === 0 || formData.employer === '' || !employers.includes(formData.employer)) && (
              <Input
                type="text"
                value={formData.employer || newEmployer}
                onChange={(e) => {
                  setFormData({ ...formData, employer: e.target.value });
                  setNewEmployer(e.target.value);
                }}
                placeholder="Bijv. Albert Heijn, Binck, etc."
                className={employers.length > 0 ? 'mt-2' : ''}
                required
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Uren Gewerkt {(formData.status === 'vrij' || formData.status === 'ziek') ? <span className="text-gray-400 dark:text-gray-500">(optioneel)</span> : '*'}
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hours_worked}
                onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
                placeholder="8"
                required={formData.status !== 'vrij' && formData.status !== 'ziek'}
                className="bg-white dark:bg-[#0a0a0a] dark:border-[#3a3a3a]"
              />
            </div>

            <div>
              <Label>
                Uurloon (€) {(formData.status === 'vrij' || formData.status === 'ziek') ? <span className="text-gray-400 dark:text-gray-500">(optioneel)</span> : '*'}
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={formData.hourly_rate}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    setFormData({ ...formData, hourly_rate: value });
                  }
                }}
                placeholder="15.00"
                required={formData.status !== 'vrij' && formData.status !== 'ziek'}
                className="bg-white dark:bg-[#0a0a0a] dark:border-[#3a3a3a]"
              />
            </div>
          </div>

          <div>
            <Label>Status *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gepland">Gepland</SelectItem>
                <SelectItem value="gewerkt">Gewerkt</SelectItem>
                <SelectItem value="ziek">Ziek</SelectItem>
                <SelectItem value="vrij">Vrij</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type Dienst</Label>
            <Select value={formData.shift_type} onValueChange={(value) => setFormData({ ...formData, shift_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer (optioneel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ochtend">Ochtend</SelectItem>
                <SelectItem value="middag">Middag</SelectItem>
                <SelectItem value="avond">Avond</SelectItem>
                <SelectItem value="nacht">Nacht</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notities</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Extra informatie..."
              rows={3}
            />
          </div>

          {calculatedAmount > 0 && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-400 font-medium">
                Verdiend: <span className="text-lg font-bold">€{calculatedAmount.toFixed(2)}</span>
              </p>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center">
            {onDelete && workDay?.id && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(workDay.id);
                  onClose();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Verwijder
              </Button>
            )}
            
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                Opslaan
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}