import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { formatCurrency } from '@/components/utils/formatters';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Receipt, TrendingDown, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function PotActivityModal({ pot, isOpen, onClose, spent, onTransactionDeleted }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSpent, setCurrentSpent] = useState(spent);
  const { toast } = useToast();

  const loadTransactions = async () => {
    if (!pot || !isOpen) return;

    setLoading(true);
    try {
      const user = await User.me();
      if (!user || !user.id) {
        throw new Error('User not found');
      }

      const allTransactions = await Transaction.filter({ user_id: user.id });

      // Ensure allTransactions is an array
      if (!Array.isArray(allTransactions)) {
        console.error('allTransactions is not an array:', allTransactions);
        setTransactions([]);
        setCurrentSpent(0);
        setLoading(false);
        return;
      }
      
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      
      // Filter transacties voor dit potje in de huidige maand
      const potTransactions = (allTransactions || []).filter(tx => {
        // Comprehensive null/undefined checks
        if (!tx || typeof tx !== 'object') return false;
        if (!tx.date || !tx.type || !tx.category) return false;

        try {
          const txDate = new Date(tx.date);
          // Check if date is valid
          if (isNaN(txDate.getTime())) return false;

          const isInMonth = txDate >= monthStart && txDate <= monthEnd;
          const isExpense = tx.type === 'expense';
          const categoryMatches = tx.category === pot.name;

          return isInMonth && isExpense && categoryMatches;
        } catch (err) {
          console.error('Error processing transaction in modal:', err, tx);
          return false;
        }
      });
      
      // Sorteer op datum (nieuwste eerst)
      potTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(potTransactions);

      // 🆕 Bereken totaal uitgegeven
      const totalSpent = potTransactions.reduce((sum, tx) => {
        const amount = parseFloat(tx?.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      setCurrentSpent(totalSpent);
      
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [pot, isOpen]);

  const handleDelete = async (transactionId) => {
    if (!confirm('Weet je zeker dat je deze transactie wilt verwijderen?')) {
      return;
    }
    
    try {
      await Transaction.delete(transactionId);
      toast({ 
        title: '✅ Verwijderd', 
        description: 'Transactie is verwijderd' 
      });
      
      // 🆕 Herlaad de lijst EN update parent
      await loadTransactions();
      
      // 🆕 Trigger parent refresh
      if (onTransactionDeleted) {
        onTransactionDeleted();
      }
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({ 
        title: '❌ Fout', 
        description: 'Kon transactie niet verwijderen',
        variant: 'destructive' 
      });
    }
  };

  if (!pot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{pot.icon}</span>
            <span>Activiteit: {pot.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Totaal overzicht */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Budget deze maand</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(pot.monthly_budget || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Totaal uitgegeven</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(currentSpent)}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600 mb-1">Resterend</p>
                <p className={`text-lg font-semibold ${(pot.monthly_budget - currentSpent) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency((pot.monthly_budget || 0) - currentSpent)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transacties lijst */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Transacties deze maand ({transactions.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto mb-2"></div>
                Laden...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <TrendingDown className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nog geen uitgaven deze maand</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <Card key={tx.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tx.description || 'Uitgave'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(tx.date), 'd MMMM yyyy', { locale: nl })}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <p className="text-lg font-bold text-red-600">-{formatCurrency(tx.amount)}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tx.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}