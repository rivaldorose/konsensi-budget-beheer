import React, { useState, useEffect, useMemo } from 'react';
import { Income, VariableIncomeEntry, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/components/utils/LanguageContext';
import IncomeFormModal from '@/components/income/IncomeFormModal';
import ScanIncomeModal from '@/components/income/ScanIncomeModal';
import ImportStatementModal from '@/components/income/ImportStatementModal';
import WorkStatusModal from '@/components/income/WorkStatusModal';
import IncomeInfoModal from '@/components/income/IncomeInfoModal';
import { formatCurrency } from '@/components/utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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
    const [incomeType, setIncomeType] = useState('vast'); // For modal

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
            
            const userFilter = { user_id: userData.id };
            const incomeData = await Income.filter(userFilter).catch(() => 
                Income.filter({ created_by: userData.email }, '-created_date', 100)
            );
            setIncomes(incomeData);
            
            const variableData = await VariableIncomeEntry.filter(userFilter).catch(() =>
                VariableIncomeEntry.filter({ created_by: userData.email }, '-created_date', 500)
            );
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

    const fixedIncomeThisMonth = useMemo(() => {
        return incomes.filter(i => {
            if (i.income_type !== 'vast') return false;
            if (i.is_from_work_schedule) {
                return selectedMonth === currentMonth;
            }
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
    }, [incomes, selectedMonth, currentMonth]);
    
    const extraIncomeThisMonth = useMemo(() => {
        return incomes.filter(i => {
            if (i.income_type !== 'extra') return false;
            if (!i.date) return false;
            const incomeMonth = i.date.substring(0, 7);
            return incomeMonth === selectedMonth;
        });
    }, [incomes, selectedMonth]);
    
    const allFixedIncome = useMemo(() => {
        return incomes.filter(i => i.income_type === 'vast');
    }, [incomes]);

    const totalFixed = useMemo(() => {
        return fixedIncomeThisMonth.reduce((sum, i) => {
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
    }, [fixedIncomeThisMonth, variableEntries, selectedMonth]);

    const totalExtra = useMemo(() => {
        return extraIncomeThisMonth.reduce((sum, i) => sum + (i.amount || 0), 0);
    }, [extraIncomeThisMonth]);

    const totalMonth = totalFixed + totalExtra;

    // Calculate year statistics
    const yearStats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        let monthlyData = [];
        let totalYearFixed = 0;
        let totalYearExtra = 0;
        let monthsWithData = 0;

        for (let month = 1; month <= 12; month++) {
            const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`;
            const monthNames = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
            
            const currentMonthStr = new Date().toISOString().substring(0, 7);
            const fixedForMonth = allFixedIncome.reduce((sum, i) => {
                if (i.is_from_work_schedule) {
                    if (monthStr !== currentMonthStr) return sum;
                    return sum + (i.monthly_equivalent || i.amount || 0);
                }
                if (i.start_date) {
                    const startMonth = i.start_date.substring(0, 7);
                    if (startMonth > monthStr) return sum;
                }
                if (i.end_date) {
                    const endMonth = i.end_date.substring(0, 7);
                    if (endMonth < monthStr) return sum;
                }
                if (i.is_variable) {
                    const variableEntry = variableEntries.find(
                        v => v.income_id === i.id && v.month === monthStr
                    );
                    if (variableEntry) {
                        return sum + variableEntry.amount;
                    }
                    return sum + (i.monthly_equivalent || i.amount || 0);
                }
                return sum + (i.monthly_equivalent || i.amount || 0);
            }, 0);

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
    }, [allFixedIncome, incomes, variableEntries]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
            </div>
        );
    }

    const handleAddIncome = (type) => {
        setIncomeType(type);
        setEditingIncome(null);
        setShowFormModal(true);
    };

    return (
        <main className="flex-1 flex justify-center w-full px-4 py-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
            <div className="w-full max-w-[1600px] flex flex-col gap-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[#1F2937] dark:text-white text-3xl font-extrabold tracking-tight">Inkomen</h1>
                        <button 
                            onClick={() => setShowInfoModal(true)}
                            className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#1F2937] dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">help</span>
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link to={createPageUrl('WorkSchedule')}>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-[#2A3F36] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#1a2c26] hover:border-gray-300 dark:hover:border-[#2A3F36] transition-all text-sm font-medium bg-white dark:bg-[#1a2c26]">
                                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                <span>Werkschema</span>
                            </button>
                        </Link>
                        <button 
                            onClick={() => setShowScanModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-[#2A3F36] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#1a2c26] hover:border-gray-300 dark:hover:border-[#2A3F36] transition-all text-sm font-medium bg-white dark:bg-[#1a2c26]"
                        >
                            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                            <span>Scan Afschrift</span>
                        </button>
                        <button 
                            onClick={() => setShowWorkStatusModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-[#2A3F36] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#1a2c26] hover:border-gray-300 dark:hover:border-[#2A3F36] transition-all text-sm font-medium bg-white dark:bg-[#1a2c26]"
                        >
                            <span className="material-symbols-outlined text-[18px]">work</span>
                            <span>Status</span>
                        </button>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="flex items-center gap-2 pl-4 pr-3 py-2 rounded-full bg-white dark:bg-[#1a2c26] border border-gray-200 dark:border-[#2A3F36] text-[#1F2937] dark:text-white hover:border-primary transition-all text-sm font-bold shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] w-auto min-w-[180px]">
                                <span className="material-symbols-outlined text-primary">calendar_month</span>
                                <SelectValue>{currentMonthLabel}</SelectValue>
                                <span className="material-symbols-outlined text-[20px]">arrow_drop_down</span>
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

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column (65% on Desktop) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* 1. SUMMARY CARD */}
                        <div className="bg-gradient-to-br from-primary to-[#059669] rounded-[24px] p-6 md:p-8 shadow-[0_8px_24px_rgba(16,183,127,0.3)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
                                {/* Left Section */}
                                <div className="flex flex-col gap-4 flex-1">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="p-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10">
                                                <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
                                            </div>
                                            <span className="text-sm font-medium text-white/90">Vast inkomen (per maand)</span>
                                        </div>
                                        <span className="text-3xl font-extrabold text-white">{formatCurrency(totalFixed)}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="p-1 rounded-full bg-[#3D6456]/10">
                                                <span className="material-symbols-outlined text-[#3D6456] text-[16px]">redeem</span>
                                            </div>
                                            <span className="text-sm font-medium text-[#3D6456]/80">Extra inkomen deze maand</span>
                                        </div>
                                        <span className="text-xl font-bold text-[#3D6456]/70">{formatCurrency(totalExtra)}</span>
                                    </div>
                                </div>
                                {/* Right Section (Total) */}
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold tracking-wider text-[#3D6456] uppercase mb-1 opacity-70">
                                        Totaal {currentMonthLabel}
                                    </span>
                                    <span className="text-5xl font-extrabold text-[#3D6456] tracking-tight">{formatCurrency(totalMonth)}</span>
                                </div>
                            </div>
                            {/* Info Banner */}
                            <div className="mt-6 bg-[#3D6456]/5 rounded-[24px] p-4 flex items-start gap-3 border border-[#3D6456]/10 relative z-10">
                                <span className="material-symbols-outlined text-[#3D6456]">lightbulb</span>
                                <div>
                                    <h4 className="font-bold text-[#3D6456] text-sm">Je vaste maandinkomen: {formatCurrency(totalFixed)}</h4>
                                    <p className="text-xs text-[#3D6456]/80 mt-1 leading-relaxed">
                                        Dit is het bedrag dat je maandelijks ontvangt op basis van je huidige instellingen. Wijzigingen in je werkschema worden hier automatisch verwerkt.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. JAAROVERZICHT CARD */}
                        <div className="bg-white rounded-[24px] p-6 shadow-card border border-gray-100" style={{ boxShadow: '0 2px 10px rgba(61, 100, 86, 0.05)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="bg-[#b4ff7a] p-1.5 rounded-[24px]">
                                        <span className="material-symbols-outlined text-[#3D6456] text-[20px]">target</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#3D6456]">Jaaroverzicht Inkomsten</h3>
                                </div>
                                <button 
                                    onClick={() => setShowYearOverview(!showYearOverview)}
                                    className="text-gray-400 hover:text-[#3D6456]"
                                >
                                    <span className="material-symbols-outlined">{showYearOverview ? 'expand_less' : 'expand_more'}</span>
                                </button>
                            </div>
                            
                            {showYearOverview && (
                                <>
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="p-3 bg-blue-50 rounded-[24px] border border-blue-100">
                                            <span className="text-xs font-medium text-blue-600 block mb-1">Gem. Vast</span>
                                            <span className="text-lg font-bold text-[#3D6456]">{formatCurrency(yearStats.avgFixed)}</span>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-[24px] border border-green-100">
                                            <span className="text-xs font-medium text-green-600 block mb-1">Gem. Extra</span>
                                            <span className="text-lg font-bold text-[#3D6456]">{formatCurrency(yearStats.avgExtra)}</span>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-[24px] border border-purple-100">
                                            <span className="text-xs font-medium text-purple-600 block mb-1">Gem. Totaal</span>
                                            <span className="text-lg font-bold text-[#3D6456]">{formatCurrency(yearStats.avgTotal)}</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-[24px] border border-gray-100">
                                            <span className="text-xs font-medium text-gray-500 block mb-1">Totaal Jaar</span>
                                            <span className="text-lg font-bold text-[#3D6456]">{formatCurrency(yearStats.totalYear)}</span>
                                        </div>
                                    </div>
                                    {/* Chart Area */}
                                    <div className="relative h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={yearStats.monthlyData}>
                                                <defs>
                                                    <linearGradient id="colorVast" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3D6456" stopOpacity={0.6}/>
                                                        <stop offset="95%" stopColor="#3D6456" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorExtra" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis 
                                                    dataKey="name" 
                                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                                    axisLine={{ stroke: '#e5e7eb' }}
                                                />
                                                <YAxis 
                                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                                    axisLine={{ stroke: '#e5e7eb' }}
                                                    tickFormatter={(value) => `€${(value / 1000).toFixed(1)}k`}
                                                />
                                                <Tooltip 
                                                    formatter={(value) => formatCurrency(value)}
                                                    contentStyle={{ 
                                                        backgroundColor: 'white', 
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="vast" 
                                                    stackId="1"
                                                    stroke="#3D6456" 
                                                    fill="url(#colorVast)"
                                                    name="Vast inkomen"
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="extra" 
                                                    stackId="1"
                                                    stroke="#60A5FA" 
                                                    fill="url(#colorExtra)"
                                                    name="Extra inkomen"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* 3. VAST INKOMEN LIST CARD */}
                        <div className="bg-white rounded-[24px] p-6 shadow-card border border-gray-100" style={{ boxShadow: '0 2px 10px rgba(61, 100, 86, 0.05)' }}>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-[#3D6456] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#b4ff7a]">bolt</span>
                                        Vast Inkomen
                                    </h3>
                                    <p className="text-sm text-gray-400 font-medium mt-1">Terugkerend inkomen zoals salaris of uitkering</p>
                                </div>
                                <button 
                                    onClick={() => handleAddIncome('vast')}
                                    className="bg-[#ecf4e6] hover:bg-[#b4ff7a] text-[#3D6456] text-sm font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Nieuw Inkomen
                                </button>
                            </div>
                            <div className="flex flex-col gap-3">
                                {fixedIncomeThisMonth.length === 0 ? (
                                    <p className="text-gray-500 text-center py-6">Nog geen vast inkomen toegevoegd</p>
                                ) : (
                                    fixedIncomeThisMonth.map((income) => {
                                        const displayAmount = income.is_variable 
                                            ? (variableEntries.find(v => v.income_id === income.id && v.month === selectedMonth)?.amount 
                                                || income.monthly_equivalent 
                                                || income.amount)
                                            : (income.monthly_equivalent || income.amount);
                                        
                                        return (
                                            <div 
                                                key={income.id} 
                                                className="flex items-center justify-between p-4 rounded-[24px] border border-gray-100 hover:border-[#b4ff7a] hover:bg-[#fafcf8] transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-[#ecf4e6] flex items-center justify-center text-[#3D6456]">
                                                        <span className="material-symbols-outlined">
                                                            {income.is_from_work_schedule ? 'work' : 'trending_up'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-[#3D6456]">{income.description || 'Werk / Salaris'}</h4>
                                                        <p className="text-xs text-gray-500">
                                                            {income.day_of_month ? `Maandelijks op de ${income.day_of_month}e` : 'Maandelijks'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-lg font-bold text-[#3D6456]">
                                                        {income.is_from_work_schedule && '~'}
                                                        {formatCurrency(displayAmount)}
                                                    </span>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingIncome(income);
                                                                setShowFormModal(true);
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                if (window.confirm('Weet je zeker dat je dit inkomen wilt verwijderen?')) {
                                                                    await Income.delete(income.id);
                                                                    loadData();
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 4. EXTRA INKOMEN CARD */}
                        <div className="bg-white rounded-[24px] p-6 shadow-card border border-gray-100" style={{ boxShadow: '0 2px 10px rgba(61, 100, 86, 0.05)' }}>
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-[#3D6456] flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#b4ff7a]">redeem</span>
                                    Extra Inkomen
                                </h3>
                                <p className="text-sm text-gray-400 font-medium mt-1">Eenmalige inkomsten in {currentMonthLabel}</p>
                            </div>
                            {extraIncomeThisMonth.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-100 rounded-[24px] bg-gray-50/50">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-gray-300 text-3xl">savings</span>
                                    </div>
                                    <p className="text-gray-400 italic font-medium">Geen extra inkomsten deze maand</p>
                                    <button 
                                        onClick={() => handleAddIncome('extra')}
                                        className="mt-4 text-[#3D6456] text-sm font-bold hover:underline"
                                    >
                                        + Voeg extra inkomen toe
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {extraIncomeThisMonth.map((income) => (
                                        <div 
                                            key={income.id} 
                                            className="flex items-center justify-between p-4 rounded-[24px] border border-gray-100 hover:border-[#b4ff7a] hover:bg-[#fafcf8] transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-[#ecf4e6] flex items-center justify-center text-[#3D6456]">
                                                    <span className="material-symbols-outlined">redeem</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-[#3D6456]">{income.description}</h4>
                                                    <p className="text-xs text-gray-500">
                                                        {income.date && new Date(income.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-lg font-bold text-[#3D6456]">{formatCurrency(income.amount)}</span>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingIncome(income);
                                                            setShowFormModal(true);
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (window.confirm('Weet je zeker dat je dit inkomen wilt verwijderen?')) {
                                                                await Income.delete(income.id);
                                                                loadData();
                                                            }
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (35% on Desktop) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* 1. Quick Stats / Calendar */}
                        <div className="bg-white rounded-[24px] p-6 shadow-card border border-gray-100 flex flex-col gap-4" style={{ boxShadow: '0 2px 10px rgba(61, 100, 86, 0.05)' }}>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Selecteer periode</h3>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full flex items-center justify-between px-4 py-3 rounded-[24px] bg-[#fafcf8] border border-gray-200 text-[#3D6456] font-bold shadow-sm hover:border-[#b4ff7a] transition-all">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#b4ff7a]">calendar_month</span>
                                        <SelectValue>{currentMonthLabel}</SelectValue>
                                    </div>
                                    <span className="material-symbols-outlined">expand_more</span>
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => (
                                        <SelectItem key={month.value} value={month.value}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button 
                                    onClick={() => {
                                        const [year, month] = selectedMonth.split('-');
                                        const prevMonth = new Date(parseInt(year), parseInt(month) - 2, 1);
                                        setSelectedMonth(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
                                    }}
                                    className="p-2 text-xs font-bold text-center rounded-[24px] bg-gray-50 hover:bg-[#ecf4e6] text-gray-500 hover:text-[#3D6456] transition-colors"
                                >
                                    Vorige Maand
                                </button>
                                <button 
                                    onClick={() => {
                                        const [year, month] = selectedMonth.split('-');
                                        const nextMonth = new Date(parseInt(year), parseInt(month), 1);
                                        setSelectedMonth(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`);
                                    }}
                                    className="p-2 text-xs font-bold text-center rounded-[24px] bg-gray-50 hover:bg-[#ecf4e6] text-gray-500 hover:text-[#3D6456] transition-colors"
                                >
                                    Volgende Maand
                                </button>
                            </div>
                        </div>

                        {/* 2. Scan Action Card */}
                        <div className="bg-[#fafcf8] rounded-[24px] p-6 shadow-card border border-gray-200 flex flex-col items-center text-center" style={{ boxShadow: '0 2px 10px rgba(61, 100, 86, 0.05)' }}>
                            <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-[#3D6456]">
                                <span className="material-symbols-outlined text-3xl">document_scanner</span>
                            </div>
                            <h3 className="font-bold text-[#3D6456] text-lg mb-2">Scan loonstrook</h3>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Heb je een fysieke of digitale loonstrook? Scan hem direct voor automatische verwerking.
                            </p>
                            <button 
                                onClick={() => setShowScanModal(true)}
                                className="w-full bg-[#b4ff7a] text-[#3D6456] font-bold py-3 rounded-full hover:shadow-lg hover:translate-y-[-2px] transition-all shadow-sm"
                            >
                                Scan Nu
                            </button>
                        </div>

                        {/* 3. Tips Card */}
                        <div className="bg-blue-50 rounded-[24px] p-6 border border-blue-100 relative overflow-hidden">
                            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl text-blue-100 opacity-50 rotate-12">lightbulb</span>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-blue-600">lightbulb</span>
                                    <h3 className="font-bold text-blue-800">Tip van de maand</h3>
                                </div>
                                <p className="text-sm text-blue-900/80 leading-relaxed font-medium">
                                    Vraag je werkgever om je salaris eerder uit te betalen als je grote uitgaven verwacht deze maand.
                                </p>
                            </div>
                        </div>

                        {/* Status Summary Mini Card */}
                        <div className="bg-white rounded-[24px] p-5 shadow-card border border-gray-100" style={{ boxShadow: '0 2px 10px rgba(61, 100, 86, 0.05)' }}>
                            <h3 className="font-bold text-[#3D6456] mb-4 text-sm">Huidige Status</h3>
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 text-orange-600 p-2 rounded-[24px]">
                                    <span className="material-symbols-outlined">work_history</span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Dienstverband</p>
                                    <p className="text-sm font-bold text-[#3D6456]">
                                        {user?.work_status === 'parttime' ? 'Parttime' : user?.work_status === 'fulltime' ? 'Fulltime' : user?.work_status === 'zzp' ? 'ZZP' : 'Niet ingesteld'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <IncomeFormModal
                isOpen={showFormModal}
                onClose={() => {
                    setShowFormModal(false);
                    setEditingIncome(null);
                }}
                onSave={async (data) => {
                    const finalData = { ...data, income_type: incomeType };
                    if (editingIncome) {
                        await Income.update(editingIncome.id, finalData);
                    } else {
                        await Income.create(finalData);
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

            <IncomeInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
            />
        </main>
    );
}
