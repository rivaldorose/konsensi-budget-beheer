import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Filter, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/components/utils/formatters";

const statusLabels = {
  niet_actief: 'Niet Actief',
  wachtend: 'Wachtend',
  betalingsregeling: 'Betalingsregeling',
  afbetaald: 'Afbetaald'
};

const statusColors = {
  niet_actief: 'bg-gray-400',
  wachtend: 'bg-yellow-500',
  betalingsregeling: 'bg-blue-500',
  afbetaald: 'bg-green-500'
};

export default function DebtFilters({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  debts = [],
  totalPaidFromPayments = 0 // Totaal uit DebtPayment records
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

  // Bereken totalen per status
  const statusTotals = {
    niet_actief: { count: 0, total: 0, remaining: 0 },
    wachtend: { count: 0, total: 0, remaining: 0 },
    betalingsregeling: { count: 0, total: 0, remaining: 0 },
    afbetaald: { count: 0, total: 0, remaining: 0 }
  };

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
  // Gebruik het totaal uit DebtPayment records (zoals Dashboard doet)
  const totalPaid = totalPaidFromPayments;
  const totalRemaining = debts
    .filter(d => d.status !== 'afbetaald')
    .reduce((sum, d) => sum + ((d.amount || 0) - (d.amount_paid || 0)), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold">Filters & Overzicht</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Totalen Overzicht */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">📊 Totaaloverzicht</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Totaal schulden</p>
                <p className="text-lg font-bold">{totalDebts}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Totaal bedrag</p>
                <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Totaal afbetaald</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <p className="text-xs text-gray-500">Nog openstaand</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>

            {/* Per status */}
            <h4 className="text-sm font-medium text-gray-600 mb-2">Per status:</h4>
            <div className="space-y-2">
              {Object.entries(statusTotals).map(([status, data]) => (
                <div 
                  key={status} 
                  className="flex items-center justify-between p-2 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    handleFilterChange('status', status);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[status]} text-white text-xs`}>
                      {data.count}
                    </Badge>
                    <span className="text-sm font-medium">{statusLabels[status]}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(data.total)}</p>
                    {status !== 'afbetaald' && data.remaining > 0 && (
                      <p className="text-xs text-gray-500">Open: {formatCurrency(data.remaining)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter opties */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">🔍 Filteropties</h3>
            
            {/* Status filter */}
            <div>
              <Label className="text-sm">Status</Label>
              <Select 
                value={localFilters.status || 'all'} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schuldeiser type filter */}
            <div>
              <Label className="text-sm">Type schuldeiser</Label>
              <Select 
                value={localFilters.creditorType || 'all'} 
                onValueChange={(value) => handleFilterChange('creditorType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Alle types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  <SelectItem value="energie">Energie</SelectItem>
                  <SelectItem value="telecom">Telecom</SelectItem>
                  <SelectItem value="zorgverzekeraar">Zorgverzekeraar</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="webshop">Webshop</SelectItem>
                  <SelectItem value="overheid">Overheid</SelectItem>
                  <SelectItem value="incassobureau">Incassobureau</SelectItem>
                  <SelectItem value="deurwaarder">Deurwaarder</SelectItem>
                  <SelectItem value="anders">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bedrag range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Min. bedrag (€)</Label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={localFilters.minAmount || ''} 
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Max. bedrag (€)</Label>
                <Input 
                  type="number" 
                  placeholder="10000" 
                  value={localFilters.maxAmount || ''} 
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                />
              </div>
            </div>

            {/* Datum range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Datum vanaf</Label>
                <Input 
                  type="date" 
                  value={localFilters.dateFrom || ''} 
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm">Datum tot</Label>
                <Input 
                  type="date" 
                  value={localFilters.dateTo || ''} 
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Zoeken */}
            <div>
              <Label className="text-sm">Zoeken (naam of dossiernummer)</Label>
              <Input 
                type="text" 
                placeholder="Zoek op naam of dossiernummer..." 
                value={localFilters.searchTerm || ''} 
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
            </div>
          </div>

          {/* Actie knoppen */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button 
              onClick={applyFilters}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              Filters toepassen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}