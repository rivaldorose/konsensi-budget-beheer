import React, { useState, useEffect } from 'react';
import { Income } from '.@/api/entities/Income';
import { VariableIncomeEntry } from '.@/api/entities/VariableIncomeEntry';
import { User } from '.@/api/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ChevronDown, TrendingUp, Calendar, Clock, FileText, Sparkles, Plus, Edit2, Trash2, RefreshCw, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/components/utils/LanguageContext';
import IncomeFormModal from '@/components/income/IncomeFormModal';
import ScanIncomeModal from '@/components/income/ScanIncomeModal';
import ImportStatementModal from '@/components/income/ImportStatementModal';
import WorkStatusModal from '@/components/income/WorkStatusModal';
import IncomeInfoModal from '@/components/income/IncomeInfoModal';
import { formatCurrency } from '@/components/utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function IncomePage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showScanModal, setShowScanModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
        const [showWorkStatusModal, setShowWorkStatusModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [showYearOverview, setShowYearOverview] = useState(true);
    const [variableEntries, setVariableEntries] = useState([]);
    const [showUpdateAmountModal, setShowUpdateAmountModal] = useState(false);
    const [updatingIncome, setUpdatingIncome] = useState(null);
    const [updateAmount, setUpdateAmount] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);

    const months = [
        { value: '2025-01', label: 'januari 2025' },
        { value: '2025-02', label: 'februari 2025' },
        { value: '2025-03', label: 'maart 2025' },
        { value: '2025-04', label: 'april 2025' },
        { value: '2025-05', label: 'mei 2025' },
        { value: '2025-06', label: 'juni 2025' },
        { value: '2025-07', label: 'juli 2025' },
        { value: '2025-08', label: 'augustus 2025' },
        { value: '2025-09', label: 'september 2025' },
        { value: '2025-10', label: 'oktober 2025' },
        { value: '2025-11', label: 'november 2025' },
        { value: '2025-12', label: 'december 2025' },
    ];

    const currentMonthLabel = months.find(m => m.value === selectedMonth)?.label || selectedMonth;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await User.me();
            setUser(userData);
            
            const incomeData = await Income.filter({ created_by: userData.email }, '-created_date', 100);
            setIncomes(incomeData);
            
            // Laad variabele inkomen entries
            const variableData = await VariableIncomeEntry.filter({ created_by: userData.email }, '-created_date', 500);
            setVariableEntries(variableData);
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                title: '❌ Fout',
                description: 'Kon gegevens niet laden',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals for selected month
    const currentMonth = new Date().toISOString().substring(0, 7);

              const fixedIncomeThisMonth = incomes.filter(i => {
                  if (i.income_type !== 'vast') return false;

                  // Werkrooster inkomen alleen tonen in huidige maand
                  if (i.is_from_work_schedule) {
                      return selectedMonth === currentMonth;
                  }

                  // Check of inkomen actief is in de geselecteerde maand
                  if (i.start_date) {
                      const startMonth = i.start_date.substring(0, 7);
                      if (startMonth > selectedMonth) return false;
                  }
                  if (i.end_date) {
                      const endMonth = i.end_date.substring(0, 7);
                      if (endMonth < selectedMonth) return false;
                  }
                  if (i.is_active === false) return false;
                  return true;
              });
    
    const extraIncomeThisMonth = incomes.filter(i => {
        if (i.income_type !== 'extra') return false;
        if (!i.date) return false;
        const incomeMonth = i.date.substring(0, 7);
        return incomeMonth === selectedMonth;
    });
    
    // Alle vaste inkomsten (voor jaaroverzicht)
    const allFixedIncome = incomes.filter(i => i.income_type === 'vast');

    const totalFixed = fixedIncomeThisMonth.reduce((sum, i) => {
        // Voor variabel inkomen: check of er een entry is voor de geselecteerde maand
        if (i.is_variable) {
            const variableEntry = variableEntries.find(
                v => v.income_id === i.id && v.month === selectedMonth
            );
            if (variableEntry) {
                return sum + variableEntry.amount;
            }
        }
        return sum + (i.monthly_equivalent || i.amount || 0);
    }, 0);
    const totalExtra = extraIncomeThisMonth.reduce((sum, i) => sum + (i.amount || 0), 0);
    const totalMonth = totalFixed + totalExtra;

    // Calculate year statistics
    const calculateYearStats = () => {
        const currentYear = new Date().getFullYear();
        let monthlyData = [];
        let totalYearFixed = 0;
        let totalYearExtra = 0;
        let monthsWithData = 0;

        for (let month = 1; month <= 12; month++) {
            const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`;
            const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
            
            // Fixed income for this month
            const currentMonthStr = new Date().toISOString().substring(0, 7);
            const fixedForMonth = allFixedIncome.reduce((sum, i) => {
                // Werkrooster inkomen alleen in huidige maand
                if (i.is_from_work_schedule) {
                    if (monthStr !== currentMonthStr) return sum;
                    return sum + (i.monthly_equivalent || i.amount || 0);
                }

                // Check if income was active during this month
                if (i.start_date) {
                    const startMonth = i.start_date.substring(0, 7);
                    if (startMonth > monthStr) return sum;
                }
                if (i.end_date) {
                    const endMonth = i.end_date.substring(0, 7);
                    if (endMonth < monthStr) return sum;
                }
                
                // Voor variabel inkomen: check of er een entry is voor deze maand
                if (i.is_variable) {
                    const variableEntry = variableEntries.find(
                        v => v.income_id === i.id && v.month === monthStr
                    );
                    if (variableEntry) {
                        return sum + variableEntry.amount;
                    }
                    // Geen entry voor deze maand? Gebruik standaard bedrag
                    return sum + (i.monthly_equivalent || i.amount || 0);
                }
                
                return sum + (i.monthly_equivalent || i.amount || 0);
            }, 0);

            // Extra income for this month
            const extraForMonth = incomes
                .filter(i => i.income_type === 'extra' && i.date?.substring(0, 7) === monthStr)
                .reduce((sum, i) => sum + (i.amount || 0), 0);

            const total = fixedForMonth + extraForMonth;
            
            if (total > 0) {
                monthsWithData++;
                totalYearFixed += fixedForMonth;
                totalYearExtra += extraForMonth;
            }

            monthlyData.push({
                name: monthNames[month - 1],
                vast: fixedForMonth,
                extra: extraForMonth,
                total: total
            });
        }

        const avgFixed = monthsWithData > 0 ? totalYearFixed / monthsWithData : 0;
        const avgExtra = monthsWithData > 0 ? totalYearExtra / monthsWithData : 0;
        const avgTotal = avgFixed + avgExtra;
        const totalYear = totalYearFixed + totalYearExtra;

        return { monthlyData, avgFixed, avgExtra, avgTotal, totalYear };
    };

    const yearStats = calculateYearStats();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">💰 Inkomen</h1>
                    <button
                        onClick={() => setShowInfoModal(true)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Uitleg"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link to={createPageUrl('WorkSchedule')}>
                        <Button variant="outline" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            Werkschema
                        </Button>
                    </Link>
                    <Button variant="outline" className="gap-2" onClick={() => setShowScanModal(true)}>
                        <Sparkles className="w-4 h-4" />
                        Scan Afschrift
                    </Button>

                    <Button variant="outline" className="gap-2" onClick={() => setShowWorkStatusModal(true)}>
                                                <Clock className="w-4 h-4" />
                                                Werk/Inkomen Status
                                            </Button>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[160px] bg-white border-gray-300">
                            <SelectValue>{currentMonthLabel}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Income Summary Card */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Vast inkomen */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-500">⚡</span>
                                <span className="text-gray-700">Vast inkomen (per maand)</span>
                            </div>
                            <span className="text-xl font-semibold text-gray-900">
                                {formatCurrency(totalFixed)}
                            </span>
                        </div>

                        {/* Extra inkomen */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-green-500">⚡</span>
                                <span className="text-gray-700">Extra inkomen deze maand</span>
                            </div>
                            <span className="text-xl font-semibold text-gray-900">
                                {formatCurrency(totalExtra)}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-500">📊</span>
                                    <span className="font-semibold text-gray-900">
                                        TOTAAL {currentMonthLabel.toUpperCase()}
                                    </span>
                                </div>
                                <span className="text-2xl font-bold text-green-600">
                                    {formatCurrency(totalMonth)}
                                </span>
                            </div>
                        </div>

                        {/* Info box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                            <div className="flex items-start gap-2">
                                <span className="text-blue-500">💡</span>
                                <div>
                                    <p className="text-sm text-blue-800">
                                        <strong>Je vaste maandinkomen: {formatCurrency(totalFixed)}</strong>
                                    </p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Dit is het bedrag dat je elke maand kunt verwachten. Gebruik dit om je vaste lasten en potjes mee in te plannen. Extra inkomen kun je gebruiken voor eenmalige uitgaven of om schulden af te lossen.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Year Overview */}
            <Card>
                <CardHeader className="cursor-pointer" onClick={() => setShowYearOverview(!showYearOverview)}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Jaaroverzicht Inkomsten
                        </CardTitle>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showYearOverview ? 'rotate-180' : ''}`} />
                    </div>
                </CardHeader>
                
                {showYearOverview && (
                    <CardContent>
                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-xs text-blue-600 font-medium">Gem. Vast</p>
                                <p className="text-xl font-bold text-blue-700">
                                    {formatCurrency(yearStats.avgFixed)}
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <p className="text-xs text-green-600 font-medium">Gem. Extra</p>
                                <p className="text-xl font-bold text-green-700">
                                    {formatCurrency(yearStats.avgExtra)}
                                </p>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4">
                                <p className="text-xs text-purple-600 font-medium">Gem. Totaal</p>
                                <p className="text-xl font-bold text-purple-700">
                                    {formatCurrency(yearStats.avgTotal)}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-600 font-medium">Totaal Jaar</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {formatCurrency(yearStats.totalYear)}
                                </p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={yearStats.monthlyData}>
                                    <defs>
                                        <linearGradient id="colorVast" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorExtra" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: '#6b7280' }}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickFormatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                                    />
                                    <Tooltip 
                                        formatter={(value) => formatCurrency(value)}
                                        contentStyle={{ 
                                            backgroundColor: 'white', 
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="vast" 
                                        stackId="1"
                                        stroke="#3b82f6" 
                                        fill="url(#colorVast)"
                                        name="Vast inkomen"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="extra" 
                                        stackId="1"
                                        stroke="#10b981" 
                                        fill="url(#colorExtra)"
                                        name="Extra inkomen"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Vast Inkomen Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <span className="text-yellow-500">⚡</span>
                                Vast Inkomen
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">Terugkerend inkomen zoals salaris of uitkering</p>
                        </div>
                        <Button 
                            data-tour="add-income"
                            className="bg-green-500 hover:bg-green-600 text-white gap-2"
                            onClick={() => {
                                setEditingIncome(null);
                                setShowFormModal(true);
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            Nieuw Inkomen
                        </Button>
                    </div>
                </CardHeader>
                <CardContent data-tour="income-list">
                    {fixedIncomeThisMonth.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">Nog geen vast inkomen toegevoegd</p>
                    ) : (
                        <div className="space-y-3">
                            {fixedIncomeThisMonth.map((income) => (
                                <div key={income.id} className={`flex items-center justify-between p-4 rounded-xl hover:bg-gray-100 transition-colors ${income.is_variable ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${income.is_variable ? 'bg-amber-100' : 'bg-green-100'}`}>
                                            {income.is_variable ? (
                                                <RefreshCw className="w-5 h-5 text-amber-600" />
                                            ) : (
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-gray-900">{income.description}</h3>
                                                {income.is_variable && (
                                                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                        Variabel
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {formatCurrency(income.amount)} {income.frequency === 'monthly' ? 'maandelijks' : income.frequency === 'weekly' ? 'wekelijks' : income.frequency === 'biweekly' ? 'tweewekelijks' : income.frequency === 'four_weekly' ? 'vierwekelijks' : ''}
                                                {income.day_of_month && ` • Op de ${income.day_of_month}e`}
                                                {income.is_variable && income.last_amount_update && (
                                                    <span className="text-amber-600"> • Bijgewerkt: {new Date(income.last_amount_update).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-bold text-gray-900">
                                            {income.is_from_work_schedule && '~'}
                                            {income.is_variable ? (
                                                formatCurrency(
                                                    variableEntries.find(v => v.income_id === income.id && v.month === selectedMonth)?.amount 
                                                    || income.monthly_equivalent 
                                                    || income.amount
                                                )
                                            ) : (
                                                formatCurrency(income.monthly_equivalent || income.amount)
                                            )}
                                        </span>
                                        {income.is_variable && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setUpdatingIncome(income);
                                                    // Zoek bestaande entry voor deze maand
                                                    const existingEntry = variableEntries.find(
                                                        v => v.income_id === income.id && v.month === selectedMonth
                                                    );
                                                    setUpdateAmount(existingEntry ? existingEntry.amount.toString() : income.amount.toString());
                                                    setShowUpdateAmountModal(true);
                                                }}
                                                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                Update {currentMonthLabel}
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingIncome(income);
                                                setShowFormModal(true);
                                            }}
                                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={async () => {
                                                if (window.confirm('Weet je zeker dat je dit inkomen wilt verwijderen?')) {
                                                    await Income.delete(income.id);
                                                    loadData();
                                                }
                                            }}
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Extra Inkomen Section */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <span className="text-green-500">✨</span>
                            Extra Inkomen
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Eenmalige inkomsten in {currentMonthLabel}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {extraIncomeThisMonth.length === 0 ? (
                        <p className="text-gray-500 text-center py-6">Geen extra inkomsten deze maand</p>
                    ) : (
                        <div className="space-y-3">
                            {extraIncomeThisMonth.map((income) => (
                                <div key={income.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{income.description}</h3>
                                            <p className="text-sm text-gray-500">
                                                {income.date && new Date(income.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatCurrency(income.amount)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingIncome(income);
                                                setShowFormModal(true);
                                            }}
                                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={async () => {
                                                if (window.confirm('Weet je zeker dat je dit inkomen wilt verwijderen?')) {
                                                    await Income.delete(income.id);
                                                    loadData();
                                                }
                                            }}
                                            className="h-8 w-8 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            <IncomeFormModal
                isOpen={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingIncome(null);
                }}
                onSave={async (data) => {
                    if (editingIncome) {
                        await Income.update(editingIncome.id, data);
                    } else {
                        await Income.create(data);
                    }
                    loadData();
                    setShowFormModal(false);
                    setEditingIncome(null);
                }}
                editingIncome={editingIncome}
                income={editingIncome}
            />

            <ScanIncomeModal
                isOpen={showScanModal}
                onClose={() => setShowScanModal(false)}
                onSuccess={() => {
                    setShowScanModal(false);
                    loadData();
                }}
            />

            <ImportStatementModal
                                isOpen={showImportModal}
                                onClose={() => setShowImportModal(false)}
                                onSuccess={() => {
                                    setShowImportModal(false);
                                    loadData();
                                }}
                            />

                            <WorkStatusModal
                                            isOpen={showWorkStatusModal}
                                            onClose={() => setShowWorkStatusModal(false)}
                                            onSave={() => loadData()}
                                        />

                                        {/* Update Amount Modal voor variabel inkomen */}
                                        {showUpdateAmountModal && updatingIncome && (
                                            <Dialog open={showUpdateAmountModal} onOpenChange={() => setShowUpdateAmountModal(false)}>
                                                <DialogContent className="max-w-sm">
                                                    <DialogHeader>
                                                        <DialogTitle>💰 Bedrag bijwerken</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 pt-4">
                                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                            <p className="text-sm text-amber-800">
                                                                <strong>{updatingIncome.description}</strong>
                                                            </p>
                                                            <p className="text-xs text-amber-600">
                                                                Vul het werkelijke bedrag in voor {currentMonthLabel}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <Label htmlFor="updateAmount">Bedrag voor {currentMonthLabel} (€)</Label>
                                                            <Input
                                                                id="updateAmount"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={updateAmount}
                                                                onChange={(e) => setUpdateAmount(e.target.value)}
                                                                placeholder="0.00"
                                                                className="text-lg"
                                                            />
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => setShowUpdateAmountModal(false)}
                                                                className="flex-1"
                                                            >
                                                                Annuleren
                                                            </Button>
                                                            <Button 
                                                                onClick={async () => {
                                                                    const amount = parseFloat(updateAmount) || 0;

                                                                    // Zoek bestaande entry
                                                                    const existingEntry = variableEntries.find(
                                                                        v => v.income_id === updatingIncome.id && v.month === selectedMonth
                                                                    );

                                                                    if (existingEntry) {
                                                                        await VariableIncomeEntry.update(existingEntry.id, { amount });
                                                                    } else {
                                                                        await VariableIncomeEntry.create({
                                                                            income_id: updatingIncome.id,
                                                                            month: selectedMonth,
                                                                            amount
                                                                        });
                                                                    }

                                                                    toast({
                                                                        title: '✅ Bedrag bijgewerkt',
                                                                        description: `${updatingIncome.description}: ${formatCurrency(amount)} voor ${currentMonthLabel}`
                                                                    });

                                                                    setShowUpdateAmountModal(false);
                                                                    setUpdatingIncome(null);
                                                                    loadData();
                                                                }}
                                                                className="flex-1 bg-green-500 hover:bg-green-600"
                                                            >
                                                                Opslaan
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        <IncomeInfoModal
                                            isOpen={showInfoModal}
                                            onClose={() => setShowInfoModal(false)}
                                        />
                                    </div>
                                );
                            }