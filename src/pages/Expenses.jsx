import React, { useState, useEffect, useCallback } from "react";
import { Expense } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingDown, Edit, Trash2, Euro } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "@/components/utils/LanguageContext";

const expenseCategories = [
  { value: 'housing', labelKey: 'expenses.categories.housing' },
  { value: 'food', labelKey: 'expenses.categories.food' },
  { value: 'transport', labelKey: 'expenses.categories.transport' },
  { value: 'entertainment', labelKey: 'expenses.categories.entertainment' },
  { value: 'healthcare', labelKey: 'expenses.categories.healthcare' },
  { value: 'debt_payments', labelKey: 'expenses.categories.debt_payments' },
  { value: 'savings', labelKey: 'expenses.categories.savings' },
  { value: 'other', labelKey: 'expenses.categories.other' }
];

const expenseCategoryColors = {
  housing: 'bg-blue-100 text-blue-700 border-blue-300',
  food: 'bg-green-100 text-green-700 border-green-300',
  transport: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  entertainment: 'bg-purple-100 text-purple-700 border-purple-300',
  healthcare: 'bg-red-100 text-red-700 border-red-300',
  debt_payments: 'bg-gray-100 text-gray-700 border-gray-300',
  savings: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  other: 'bg-orange-100 text-orange-700 border-orange-300'
};

const placeholderExamples = {
  housing: { amount: "850.00", descriptionKey: 'expenses.placeholders.housing' },
  food: { amount: "120.50", descriptionKey: 'expenses.placeholders.food' },
  transport: { amount: "89.00", descriptionKey: 'expenses.placeholders.transport' },
  entertainment: { amount: "15.99", descriptionKey: 'expenses.placeholders.entertainment' },
  healthcare: { amount: "75.00", descriptionKey: 'expenses.placeholders.healthcare' },
  debt_payments: { amount: "150.00", descriptionKey: 'expenses.placeholders.debt_payments' },
  savings: { amount: "200.00", descriptionKey: 'expenses.placeholders.savings' },
  other: { amount: "25.00", descriptionKey: 'expenses.placeholders.other' }
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const user = await User.me();
      if (!user || !user.id) {
        console.error("User not authenticated");
        setExpenses([]);
        setLoading(false);
        return;
      }
      
      // Try user_id first, then created_by as fallback
      let data = [];
      try {
        data = await Expense.filter({ user_id: user.id });
      } catch (err) {
        // Fallback to created_by if user_id doesn't work
        try {
          data = await Expense.filter({ created_by: user.id });
        } catch (err2) {
          // Last fallback: try with email if that's what the table uses
          if (user.email) {
            data = await Expense.filter({ created_by: user.email });
          }
        }
      }
      
      // Sort by date descending
      data.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at);
        const dateB = new Date(b.date || b.created_at);
        return dateB - dateA;
      });
      
      setExpenses(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast({
        title: t('expenses.errorLoading') || 'Error loading expenses',
        variant: 'destructive'
      });
      setExpenses([]);
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingExpense) {
        await Expense.update(editingExpense.id, {
          ...formData,
          amount: parseFloat(formData.amount)
        });
        toast.success(t('expenses.updated'));
      } else {
        await Expense.create({
          ...formData,
          amount: parseFloat(formData.amount)
        });
        toast.success(t('expenses.added'));
      }
      
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(t('expenses.errorSaving'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
    setEditingExpense(null);
  };

  const handleEdit = (expense) => {
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || '',
      date: expense.date
    });
    setEditingExpense(expense);
    setShowAddForm(true);
  };

  const handleDelete = async (id, amount, category) => {
    if (confirm(t('expenses.confirmDelete'))) {
      try {
        await Expense.delete(id);
        toast.success(t('expenses.removed'));
        loadExpenses();
      } catch (error) {
        console.error("Error deleting expense:", error);
        toast.error(t('expenses.errorDeleting'));
      }
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const currentPlaceholder = formData.category 
    ? placeholderExamples[formData.category] 
    : { amount: "0.00", descriptionKey: 'expenses.placeholders.default' };

  const getCategoryLabel = (category) => {
    const cat = expenseCategories.find(c => c.value === category);
    return cat ? t(cat.labelKey) : category;
  };

  return (
    <motion.div 
      className="p-4 md:p-6 space-y-6 md:space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {t('expenses.title')}
          </h1>
          <p className="text-white/90 drop-shadow-sm">{t('expenses.trackSpending')}</p>
        </motion.div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg w-full md:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                {t('expenses.addExpense')}
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="glass-card border-0 max-w-md mx-4">
            <DialogHeader>
              <DialogTitle className="text-gray-800 text-xl">
                {editingExpense ? t('expenses.editExpense') : t('expenses.newExpense')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-gray-700 font-medium">
                  {t('common.amount')} (€)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={currentPlaceholder.amount}
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="bg-white/70 border-gray-200 text-gray-800 placeholder:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="text-gray-700 font-medium">
                  {t('common.category')}
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="bg-white/70 border-gray-200 text-gray-800 transition-all duration-200 focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder={t('expenses.chooseCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(cat.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date" className="text-gray-700 font-medium">
                  {t('common.date')}
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="bg-white/70 border-gray-200 text-gray-800 transition-all duration-200 focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-gray-700 font-medium">
                  {t('common.description')}
                </Label>
                <Input
                  id="description"
                  placeholder={t(currentPlaceholder.descriptionKey)}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-white/70 border-gray-200 text-gray-800 placeholder:text-gray-500 transition-all duration-200 focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  disabled={submitting}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                  disabled={submitting}
                >
                  {submitting ? t('common.pleaseWait') : (editingExpense ? t('common.update') : t('common.add'))}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card border-0 rounded-2xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-gray-700 text-sm font-semibold">
              {t('expenses.totalExpenses')}
            </CardTitle>
            <Euro className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-2xl md:text-3xl font-bold text-gray-800"
              key={totalExpenses}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              €{totalExpenses.toFixed(2)}
            </motion.div>
            <p className="text-gray-600 text-sm mt-1">{t('expenses.allExpenses')}</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 rounded-2xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-gray-700 text-sm font-semibold">
              {t('time.thisMonth')}
            </CardTitle>
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <motion.div 
              className="text-2xl md:text-3xl font-bold text-gray-800"
              key={thisMonthExpenses}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              €{thisMonthExpenses.toFixed(2)}
            </motion.div>
            <p className="text-gray-600 text-sm mt-1">{t('expenses.thisMonth')}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-card border-0 rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-gray-800 text-lg md:text-xl font-bold">
              {t('expenses.allExpenses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <motion.div 
                    key={i} 
                    className="animate-pulse"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </motion.div>
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <motion.div 
                className="text-center py-8 md:py-12"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <TrendingDown className="w-12 md:w-16 h-12 md:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-gray-800 text-base md:text-lg font-semibold mb-2">
                  {t('expenses.noExpenses')}
                </h3>
                <p className="text-gray-600 text-sm md:text-base mb-6">
                  {t('expenses.addFirstExpense')}
                </p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {t('expenses.addFirstExpenseBtn')}
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {expenses.map((expense, index) => (
                    <motion.div 
                      key={expense.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <motion.div 
                          className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0"
                          whileHover={{ rotate: -5 }}
                        >
                          <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-gray-800 font-semibold text-sm md:text-base truncate">
                              {expense.description}
                            </h4>
                            <Badge className={`${expenseCategoryColors[expense.category]} border text-xs`}>
                              {getCategoryLabel(expense.category)}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-xs md:text-sm">
                            {new Date(expense.date).toLocaleDateString('nl-NL')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3">
                        <motion.span 
                          className="text-red-600 font-bold text-base md:text-lg"
                          whileHover={{ scale: 1.05 }}
                        >
                          -€{expense.amount.toFixed(2)}
                        </motion.span>
                        <div className="flex gap-1">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(expense)}
                              className="w-8 h-8 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(expense.id, expense.amount, expense.category)}
                              className="w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}