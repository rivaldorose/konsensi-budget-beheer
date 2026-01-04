import React, { useState, useEffect } from 'react';
import { Loan } from '@/api/entities';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/components/utils/formatters';
import { Plus, UserPlus, Calendar, CheckCircle2, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LentLoansWidget({ userEmail }) {
  const [lentLoans, setLentLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    person_name: '',
    amount: '',
    loan_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    loadLoans();
  }, [userEmail]);

  const loadLoans = async () => {
    try {
      const user = await User.me();
      const allLoans = await Loan.filter({ user_id: user.id, type: 'lent' });
      setLentLoans(allLoans.sort((a, b) => new Date(b.loan_date) - new Date(a.loan_date)));
      setLoading(false);
    } catch (error) {
      console.error('Error loading lent loans:', error);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      person_name: '',
      amount: '',
      loan_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: ''
    });
    setEditingLoan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const loanData = {
        type: 'lent',
        person_name: formData.person_name,
        amount: parseFloat(formData.amount),
        loan_date: formData.loan_date,
        due_date: formData.due_date,
        status: 'active',
        notes: formData.notes
      };

      if (editingLoan) {
        await Loan.update(editingLoan.id, loanData);
        toast({ title: '✅ Lening bijgewerkt!' });
      } else {
        await Loan.create(loanData);
        toast({ 
          title: '✅ Lening geregistreerd!',
          description: `${formData.person_name} moet je ${formatCurrency(parseFloat(formData.amount))} terugbetalen`
        });
      }

      setShowAddModal(false);
      resetForm();
      loadLoans();
    } catch (error) {
      console.error('Error saving loan:', error);
      toast({ 
        title: 'Fout bij opslaan', 
        variant: 'destructive' 
      });
    }
  };

  const handleMarkAsReceived = async (loan) => {
    try {
      await Loan.update(loan.id, { status: 'received' });
      toast({ title: '💰 Lening terugontvangen!' });
      loadLoans();
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({ title: 'Fout bij bijwerken', variant: 'destructive' });
    }
  };

  const handleDelete = async (loanId) => {
    if (!confirm('Weet je zeker dat je deze lening wilt verwijderen?')) return;
    
    try {
      await Loan.delete(loanId);
      toast({ title: 'Lening verwijderd' });
      loadLoans();
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    }
  };

  const handleEdit = (loan) => {
    setEditingLoan(loan);
    setFormData({
      person_name: loan.person_name,
      amount: loan.amount.toString(),
      loan_date: loan.loan_date,
      due_date: loan.due_date,
      notes: loan.notes || ''
    });
    setShowAddModal(true);
  };

  const totalLent = lentLoans
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + (l.amount || 0), 0);

  const overdueLoans = lentLoans.filter(l => {
    if (l.status !== 'active') return false;
    const dueDate = new Date(l.due_date);
    return dueDate < new Date();
  });

  const getStatusConfig = (loan) => {
    if (loan.status === 'received') {
      return {
        icon: CheckCircle2,
        label: 'Ontvangen',
        color: 'bg-green-100 text-green-700'
      };
    }
    
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    const isOverdue = dueDate < today;
    
    if (isOverdue) {
      return {
        icon: AlertCircle,
        label: 'Te laat',
        color: 'bg-red-100 text-red-700'
      };
    }
    
    return {
      icon: Clock,
      label: 'Actief',
      color: 'bg-blue-100 text-blue-700'
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                💸 Uitgeleende Leningen
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Geld dat mensen jou moeten terugbetalen</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lentLoans.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Nog geen uitgeleende leningen</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="mt-3"
              >
                Registreer eerste lening
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Totaal uitstaand</p>
                  <p className="text-xl font-bold text-purple-700">{formatCurrency(totalLent)}</p>
                </div>
                {overdueLoans.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">⚠️ Te laat</p>
                    <p className="text-xl font-bold text-red-700">{overdueLoans.length}</p>
                  </div>
                )}
              </div>

              {/* Loans List */}
              <div className="space-y-2">
                {lentLoans.map((loan) => {
                  const statusConfig = getStatusConfig(loan);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <motion.div
                      key={loan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className={loan.status === 'received' ? 'opacity-60' : ''}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">{loan.person_name}</p>
                                <Badge className={statusConfig.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <p className="text-lg font-bold text-purple-700">
                                {formatCurrency(loan.amount)}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                Terugbetalen voor: {new Date(loan.due_date).toLocaleDateString('nl-NL')}
                              </p>
                              {loan.notes && (
                                <p className="text-xs text-gray-600 mt-2 italic">"{loan.notes}"</p>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              {loan.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsReceived(loan)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(loan)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(loan.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLoan ? 'Lening bewerken' : '💸 Nieuwe uitgeleende lening'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label>Naam persoon</Label>
              <Input
                value={formData.person_name}
                onChange={(e) => setFormData({...formData, person_name: e.target.value})}
                placeholder="Bijv. Jan, Maria"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bedrag (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="50.00"
                  required
                />
              </div>
              <div>
                <Label>Uiterlijk terugbetalen</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Datum uitgeleend</Label>
              <Input
                type="date"
                value={formData.loan_date}
                onChange={(e) => setFormData({...formData, loan_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Notities (optioneel)</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Bijv. Voor boodschappen, noodgeval"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Annuleren
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                {editingLoan ? 'Bijwerken' : 'Registreren'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}