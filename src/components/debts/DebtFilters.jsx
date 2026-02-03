import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Filter, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/components/utils/formatters";

const statusLabels = {
  niet_actief: 'Niet Actief',
  wachtend: 'Wachtend',
  actief: 'Actief',
  betalingsregeling: 'Betalingsregeling',
  aanmaning: 'Aanmaning',
  afbetaald: 'Afbetaald'
};

const statusColors = {
  niet_actief: 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-text-tertiary',
  wachtend: 'bg-accent-yellow/15 dark:bg-accent-yellow/10 text-accent-yellow',
  actief: 'bg-status-blue/15 dark:bg-accent-blue/10 text-status-blue dark:text-accent-blue',
  betalingsregeling: 'bg-status-blue/15 dark:bg-accent-blue/10 text-status-blue dark:text-accent-blue',
  aanmaning: 'bg-status-orange/15 dark:bg-accent-orange/10 text-status-orange dark:text-accent-orange',
  afbetaald: 'bg-primary/15 dark:bg-primary-green/10 text-primary dark:text-primary-green'
};

export default function DebtFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  debts = [],
  totalPaidFromPayments = 0
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const resetFilters = () => {
    const emptyFilters = {
      status: 'all',
      creditorType: 'all',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'status' || key === 'creditorType') return value !== 'all';
    return value !== '';
  }).length;

  // Bereken totalen per status
  const statusTotals = {};
  Object.keys(statusLabels).forEach(key => {
    statusTotals[key] = { count: 0, total: 0, remaining: 0 };
  });

  debts.forEach(debt => {
    const status = debt.status || 'niet_actief';
    if (statusTotals[status]) {
      statusTotals[status].count += 1;
      statusTotals[status].total += debt.amount || 0;
      statusTotals[status].remaining += (debt.amount || 0) - (debt.amount_paid || 0);
    }
  });

  const totalDebts = debts.length;
  const totalAmount = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalPaid = totalPaidFromPayments;
  const totalRemaining = debts
    .filter(d => d.status !== 'afbetaald')
    .reduce((sum, d) => sum + ((d.amount || 0) - (d.amount_paid || 0)), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary-green/10 flex items-center justify-center">
                <Filter className="w-5 h-5 text-primary dark:text-primary-green" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-main dark:text-text-primary">Filters & Overzicht</h2>
                {activeFilterCount > 0 && (
                  <p className="text-xs text-primary dark:text-primary-green font-medium">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} actief</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted dark:text-text-tertiary hover:bg-gray-100 dark:hover:bg-dark-card-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Totalen Overzicht */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-card-elevated rounded-xl border border-gray-100 dark:border-dark-border-accent">
            <h3 className="font-semibold text-text-main dark:text-text-primary mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px] text-primary dark:text-primary-green">analytics</span>
              Totaaloverzicht
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-dark-border">
                <p className="text-xs text-text-muted dark:text-text-tertiary font-medium">Totaal schulden</p>
                <p className="text-lg font-bold text-text-main dark:text-text-primary">{totalDebts}</p>
              </div>
              <div className="bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-dark-border">
                <p className="text-xs text-text-muted dark:text-text-tertiary font-medium">Totaal bedrag</p>
                <p className="text-lg font-bold text-text-main dark:text-text-primary">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-dark-border">
                <p className="text-xs text-text-muted dark:text-text-tertiary font-medium">Afbetaald</p>
                <p className="text-lg font-bold text-primary dark:text-primary-green">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-100 dark:border-dark-border">
                <p className="text-xs text-text-muted dark:text-text-tertiary font-medium">Openstaand</p>
                <p className="text-lg font-bold text-status-orange dark:text-accent-orange">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>

            {/* Per status */}
            <h4 className="text-sm font-medium text-text-muted dark:text-text-secondary mb-2">Per status:</h4>
            <div className="space-y-2">
              {Object.entries(statusTotals).filter(([_, data]) => data.count > 0).map(([status, data]) => (
                <div
                  key={status}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    localFilters.status === status
                      ? 'bg-primary/5 dark:bg-primary-green/5 border-primary/30 dark:border-primary-green/30'
                      : 'bg-white dark:bg-dark-card border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-card-elevated'
                  }`}
                  onClick={() => handleFilterChange('status', localFilters.status === status ? 'all' : status)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${statusColors[status]}`}>
                      {data.count}
                    </span>
                    <span className="text-sm font-medium text-text-main dark:text-text-primary">{statusLabels[status]}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-main dark:text-text-primary">{formatCurrency(data.total)}</p>
                    {status !== 'afbetaald' && data.remaining > 0 && (
                      <p className="text-xs text-text-muted dark:text-text-tertiary">Open: {formatCurrency(data.remaining)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter opties */}
          <div className="space-y-4">
            <h3 className="font-semibold text-text-main dark:text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined !text-[18px] text-text-muted dark:text-text-secondary">tune</span>
              Filteropties
            </h3>

            {/* Status filter */}
            <div>
              <Label className="text-sm text-text-main dark:text-text-primary">Status</Label>
              <Select
                value={localFilters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary">
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border">
                  <SelectItem value="all">Alle statussen</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schuldeiser type filter */}
            <div>
              <Label className="text-sm text-text-main dark:text-text-primary">Type schuldeiser</Label>
              <Select
                value={localFilters.creditorType || 'all'}
                onValueChange={(value) => handleFilterChange('creditorType', value)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary">
                  <SelectValue placeholder="Alle types" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border">
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="energie">Energie</SelectItem>
                  <SelectItem value="telecom">Telecom</SelectItem>
                  <SelectItem value="zorgverzekeraar">Zorgverzekeraar</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="webshop">Webshop</SelectItem>
                  <SelectItem value="overheid">Overheid</SelectItem>
                  <SelectItem value="incassobureau">Incassobureau</SelectItem>
                  <SelectItem value="deurwaarder">Deurwaarder</SelectItem>
                  <SelectItem value="persoonlijke_lening">Persoonlijke lening</SelectItem>
                  <SelectItem value="anders">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bedrag range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-text-main dark:text-text-primary">Min. bedrag (€)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary placeholder:text-text-muted dark:placeholder:text-text-tertiary"
                />
              </div>
              <div>
                <Label className="text-sm text-text-main dark:text-text-primary">Max. bedrag (€)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary placeholder:text-text-muted dark:placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Datum range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-text-main dark:text-text-primary">Datum vanaf</Label>
                <Input
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary"
                />
              </div>
              <div>
                <Label className="text-sm text-text-main dark:text-text-primary">Datum tot</Label>
                <Input
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary"
                />
              </div>
            </div>

            {/* Zoeken */}
            <div>
              <Label className="text-sm text-text-main dark:text-text-primary">Zoeken</Label>
              <Input
                type="text"
                placeholder="Zoek op naam of dossiernummer..."
                value={localFilters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="bg-gray-50 dark:bg-dark-card-elevated border-gray-200 dark:border-dark-border-accent text-text-main dark:text-text-primary placeholder:text-text-muted dark:placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {/* Actie knoppen */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="flex items-center gap-2 border-gray-200 dark:border-dark-border text-text-main dark:text-text-primary hover:bg-gray-50 dark:hover:bg-dark-card-elevated"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 bg-primary dark:bg-primary-green text-white dark:text-dark-bg hover:bg-primary-dark dark:hover:bg-light-green font-semibold"
            >
              Filters toepassen
              {activeFilterCount > 0 && (
                <span className="ml-2 bg-white/20 dark:bg-black/20 px-2 py-0.5 rounded-full text-xs">{activeFilterCount}</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
