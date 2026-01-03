import React, { useState, useEffect, useMemo } from 'react';
import { MonthlyCost, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/components/utils/LanguageContext';
import { formatCurrency } from '@/components/utils/formatters';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { nl } from 'date-fns/locale';
import MonthlyCostsChart from '@/components/costs/MonthlyCostsChart';
import MonthlyCostsInfoModal from '@/components/costs/MonthlyCostsInfoModal';
import CommonCostsSelector from '@/components/costs/CommonCostsSelector';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function MaandelijkseLastenPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [costs, setCosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [editingCost, setEditingCost] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showCommonCostsModal, setShowCommonCostsModal] = useState(false);
    const [showYearOverview, setShowYearOverview] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        payment_date: '',
        category: '',
        start_date: '',
        end_date: '',
        status: 'actief'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await User.me();
            setUser(userData);
            
            const userFilter = { user_id: userData.id };
            const costsData = await MonthlyCost.filter(userFilter).catch(() => 
                MonthlyCost.filter({ created_by: userData.email }, '-payment_date', 100)
            );
            setCosts(costsData);
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

    const handleDelete = async (id) => {
        if (!window.confirm('Weet je zeker dat je deze vaste last wilt verwijderen?')) return;
        
        try {
            await MonthlyCost.delete(id);
            setCosts(prev => prev.filter(c => c.id !== id));
            toast({
                title: '✅ Verwijderd',
                description: 'Vaste last is succesvol verwijderd'
            });
        } catch (error) {
            console.error('Error deleting cost:', error);
            toast({
                title: '❌ Fout',
                description: 'Kon vaste last niet verwijderen',
                variant: 'destructive'
            });
        }
    };

    const handleEdit = (cost) => {
        setEditingCost(cost);
        setFormData({
            name: cost.name || '',
            amount: cost.amount?.toString() || '',
            payment_date: cost.payment_date?.toString() || '',
            category: cost.category || '',
            start_date: cost.start_date || '',
            end_date: cost.end_date || '',
            status: cost.status || 'actief'
        });
        setShowFormModal(true);
    };

    const handleFormClose = () => {
        setShowFormModal(false);
        setEditingCost(null);
        setFormData({
            name: '',
            amount: '',
            payment_date: '',
            category: '',
            start_date: '',
            end_date: '',
            status: 'actief'
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const data = {
                name: formData.name,
                amount: parseFloat(formData.amount),
                payment_date: parseInt(formData.payment_date),
                category: formData.category,
                start_date: formData.start_date || new Date().toISOString().split('T')[0],
                end_date: formData.end_date || null,
                status: formData.status
            };

            if (editingCost) {
                await MonthlyCost.update(editingCost.id, data);
                toast({
                    title: '✅ Bijgewerkt',
                    description: 'Vaste last is succesvol bijgewerkt'
                });
            } else {
                await MonthlyCost.create(data);
                toast({
                    title: '✅ Toegevoegd',
                    description: 'Vaste last is succesvol toegevoegd'
                });
            }
            
            loadData();
            handleFormClose();
        } catch (error) {
            console.error('Error saving cost:', error);
            toast({
                title: '❌ Fout',
                description: 'Kon vaste last niet opslaan',
                variant: 'destructive'
            });
        }
    };

    // Calculate totals
    const today = new Date();
    const currentMonth = startOfMonth(today);
    const activeCosts = useMemo(() => {
        return costs.filter(c => {
            if (c.is_active === false) return false;
            if (!c.start_date) return true;
        const startDate = new Date(c.start_date);
        const endDate = c.end_date ? new Date(c.end_date) : null;
        return startDate <= today && (!endDate || endDate >= currentMonth);
    });
    }, [costs, today, currentMonth]);

    const totalMonthly = useMemo(() => {
        return activeCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    }, [activeCosts]);

    const upcomingPayments = useMemo(() => {
        return activeCosts.filter(c => c.payment_date >= today.getDate());
    }, [activeCosts, today]);

    const totalUpcoming = useMemo(() => {
        return upcomingPayments.reduce((sum, c) => sum + (c.amount || 0), 0);
    }, [upcomingPayments]);

    // Group by category
    const costsByCategory = useMemo(() => {
        return activeCosts.reduce((acc, cost) => {
        const category = cost.category || 'other';
        if (!acc[category]) {
            acc[category] = { total: 0, items: [] };
        }
        acc[category].total += cost.amount || 0;
        acc[category].items.push(cost);
        return acc;
    }, {});
    }, [activeCosts]);

    const categoryLabels = {
        wonen: '🏠 Wonen',
        boodschappen: '🛒 Boodschappen',
        utilities: '⚡ Nutsvoorzieningen',
        verzekeringen: '🛡️ Verzekeringen',
        abonnementen: '📱 Abonnementen',
        streaming_diensten: '📺 Streaming',
        bankkosten: '🏦 Bankkosten',
        vervoer: '🚗 Vervoer',
        leningen: '💳 Leningen',
        other: '🧩 Overig'
    };

    const categoryEmojis = {
        wonen: '🏠',
        boodschappen: '🛒',
        utilities: '⚡',
        verzekeringen: '🛡️',
        abonnementen: '📱',
        streaming_diensten: '📺',
        bankkosten: '🏦',
        vervoer: '🚗',
        leningen: '💳',
        other: '🧩'
    };

    // Calculate year statistics
    const yearStats = useMemo(() => {
        const currentYear = new Date().getFullYear();
        let totalYearFixed = 0;
        let totalYearUnexpected = 0;
        let monthsWithData = 0;

        for (let month = 1; month <= 12; month++) {
            const monthDate = new Date(currentYear, month - 1, 1);
            const monthEnd = endOfMonth(monthDate);
            
            const costsForMonth = activeCosts.filter(c => {
                if (!c.start_date) return true;
                const startDate = new Date(c.start_date);
                const endDate = c.end_date ? new Date(c.end_date) : null;
                return startDate <= monthEnd && (!endDate || endDate >= monthDate);
            });

            const monthTotal = costsForMonth.reduce((sum, c) => sum + (c.amount || 0), 0);
            
            if (monthTotal > 0) {
                monthsWithData++;
                totalYearFixed += monthTotal;
            }
        }

        const avgFixed = monthsWithData > 0 ? totalYearFixed / monthsWithData : 0;
        const avgUnexpected = 0; // Placeholder for unexpected costs
        const avgTotal = avgFixed + avgUnexpected;
        const totalYear = totalYearFixed + totalYearUnexpected;

        return { avgFixed, avgUnexpected, avgTotal, totalYear };
    }, [activeCosts]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-[#F8F8F8] dark:bg-[#0a0a0a]">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary dark:border-primary"></div>
            </div>
        );
    }

    return (
        <main className="flex-grow w-full max-w-[1600px] mx-auto px-6 md:px-8 py-8 flex flex-col gap-8 bg-[#F8F8F8] dark:bg-[#0a0a0a] min-h-screen">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[#1F2937] dark:text-white text-3xl md:text-4xl font-extrabold tracking-tight">
                            💳 Maandelijkse Lasten
                        </h1>
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#1F2937] dark:hover:text-white transition-colors"
                            title="Info"
                        >
                            <span className="material-symbols-outlined text-[24px]">help</span>
                        </button>
                    </div>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base">Beheer je vaste maandelijkse uitgaven</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setShowQuickAddModal(true)}
                        className="group flex items-center justify-center h-11 px-5 rounded-[24px] border-2 border-gray-200 dark:border-[#2A3F36] bg-transparent text-[#1F2937] dark:text-white font-bold text-sm hover:border-primary hover:bg-white dark:hover:bg-[#1a2c26] transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px] mr-2 group-hover:scale-110 transition-transform text-primary">bolt</span>
                        Snel kiezen
                    </button>
                    <button 
                        onClick={() => {
                            setEditingCost(null);
                            setFormData({
                                name: '',
                                amount: '',
                                payment_date: '',
                                category: '',
                                start_date: '',
                                end_date: '',
                                status: 'actief'
                            });
                            setShowFormModal(true);
                        }}
                        className="flex items-center justify-center h-11 px-6 rounded-[24px] bg-primary hover:bg-[#059669] text-white font-bold text-sm shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        + Toevoegen
                    </button>
                </div>
            </header>

            {/* Statistics Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Totaal per maand */}
                <div className="bg-white dark:bg-[#1a2c26] rounded-[24px] p-6 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] flex flex-col gap-1 relative overflow-hidden group hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.7)] transition-shadow">
                    <div className="absolute top-6 right-6 size-10 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Totaal per maand</p>
                    <p className="text-[#1F2937] dark:text-white text-3xl font-bold tracking-tight">{formatCurrency(totalMonthly)}</p>
                </div>

                {/* Card 2: Actieve lasten */}
                <div className="bg-white dark:bg-[#1a2c26] rounded-[24px] p-6 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] flex flex-col gap-1 relative overflow-hidden group hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.7)] transition-shadow">
                    <div className="absolute top-6 right-6 size-10 rounded-full bg-green-50 dark:bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">assignment</span>
                    </div>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Actieve lasten</p>
                    <p className="text-[#1F2937] dark:text-white text-3xl font-bold tracking-tight">{activeCosts.length}</p>
                </div>

                {/* Card 3: Nog te betalen */}
                <div className="bg-white dark:bg-[#1a2c26] rounded-[24px] p-6 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] flex flex-col gap-1 relative overflow-hidden group hover:shadow-lg dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.7)] transition-shadow">
                    <div className="absolute top-6 right-6 size-10 rounded-full bg-orange-50 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 dark:text-orange-400 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-medium">Nog te betalen</p>
                    <p className="text-[#1F2937] dark:text-white text-3xl font-bold tracking-tight">{formatCurrency(totalUpcoming)}</p>
                </div>
            </div>

            {/* Year Overview Chart Card */}
            <div className="bg-white dark:bg-[#1a2c26] rounded-[24px] p-8 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] w-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[#1F2937] dark:text-white text-xl font-bold flex items-center gap-2">
                        📊 Overzicht Vaste Lasten
                    </h3>
                    <button 
                        onClick={() => setShowYearOverview(!showYearOverview)}
                        className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#1F2937] dark:hover:text-white"
                    >
                        <span className="material-symbols-outlined">{showYearOverview ? 'expand_less' : 'expand_more'}</span>
                    </button>
                        </div>
                
                {showYearOverview && (
                    <>
                        {/* Stats Mini-Pills */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-blue-50/50 dark:bg-blue-500/10 rounded-[24px] p-3 flex flex-col items-center justify-center text-center border border-blue-100 dark:border-blue-500/20">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF] text-xs font-semibold uppercase">Gem. Vast</span>
                                <span className="text-[#1F2937] dark:text-white font-bold text-lg">{formatCurrency(yearStats.avgFixed, { decimals: 0 })}</span>
                            </div>
                            <div className="bg-orange-50/50 dark:bg-orange-500/10 rounded-[24px] p-3 flex flex-col items-center justify-center text-center border border-orange-100 dark:border-orange-500/20">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF] text-xs font-semibold uppercase">Gem. Onverwacht</span>
                                <span className="text-[#1F2937] dark:text-white font-bold text-lg">{formatCurrency(yearStats.avgUnexpected, { decimals: 0 })}</span>
                            </div>
                            <div className="bg-purple-50/50 dark:bg-purple-500/10 rounded-[24px] p-3 flex flex-col items-center justify-center text-center border border-purple-100 dark:border-purple-500/20">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF] text-xs font-semibold uppercase">Gem. Totaal</span>
                                <span className="text-[#1F2937] dark:text-white font-bold text-lg">{formatCurrency(yearStats.avgTotal, { decimals: 0 })}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-[#2A3F36] rounded-[24px] p-3 flex flex-col items-center justify-center text-center border border-gray-200 dark:border-[#2A3F36]">
                                <span className="text-[#6B7280] dark:text-[#9CA3AF] text-xs font-semibold uppercase">Totaal Jaar</span>
                                <span className="text-[#1F2937] dark:text-white font-bold text-lg">{formatCurrency(yearStats.totalYear, { decimals: 0 })}</span>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="w-full h-[280px] relative">
                            <MonthlyCostsChart allMonthlyCosts={costs} allUnexpectedCosts={[]} />
                        </div>
                    </>
                )}
            </div>

            {/* Expense Categories */}
            <div className="flex flex-col gap-6">
            {Object.entries(costsByCategory).map(([category, data]) => (
                    <div key={category} className="bg-white dark:bg-[#1a2c26] rounded-[24px] p-6 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-[#2A3F36]">
                            <h4 className="text-[#1F2937] dark:text-white text-lg font-bold flex items-center gap-2">
                                {categoryEmojis[category] || '📦'} {categoryLabels[category] || category}
                            </h4>
                            <span className="text-[#1F2937] dark:text-white text-2xl font-bold">{formatCurrency(data.total)}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {data.items.map((cost) => (
                                <div 
                                    key={cost.id} 
                                    className="group flex items-center justify-between p-4 rounded-[24px] hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                                    onClick={() => handleEdit(cost)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                            {categoryEmojis[category] || '📦'}
                                        </div>
                                        <div>
                                            <p className="text-[#1F2937] dark:text-white font-bold text-sm">{cost.name}</p>
                                            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-xs">
                                                Betaaldag: {cost.payment_date}
                                                {cost.start_date && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="size-1 rounded-full bg-gray-300"></span>
                                                        Start: {format(new Date(cost.start_date), 'dd MMM yyyy', { locale: nl })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className="font-bold text-[#1F2937] dark:text-white">{formatCurrency(cost.amount)}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(cost);
                                                }}
                                                className="size-8 rounded-full bg-white dark:bg-[#1a2c26] border border-gray-200 dark:border-[#2A3F36] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#2A3F36] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#1F2937] dark:hover:text-white"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">edit</span>
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(cost.id);
                                                }}
                                                className="size-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 text-gray-500 hover:text-red-500"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {activeCosts.length === 0 && (
                    <div className="bg-white dark:bg-[#1a2c26] rounded-[24px] p-12 shadow-soft dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-[#2A3F36] flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-6xl text-[#9CA3AF] dark:text-[#6B7280] mb-4">receipt_long</span>
                        <p className="text-[#6B7280] dark:text-[#9CA3AF] text-lg font-medium mb-4">Nog geen vaste lasten toegevoegd</p>
                        <button 
                            onClick={() => {
                                setEditingCost(null);
                                setFormData({
                                    name: '',
                                    amount: '',
                                    payment_date: '',
                                    category: '',
                                    start_date: '',
                                    end_date: '',
                                    status: 'actief'
                                });
                                setShowFormModal(true);
                            }}
                            className="px-6 py-2.5 rounded-[24px] bg-[#B2FF78] hover:bg-[#a0f065] text-primary-dark font-bold shadow-soft hover:shadow-hover transition-all"
                        >
                            + Voeg eerste vaste last toe
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={showFormModal} onOpenChange={handleFormClose}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl p-0">
                    <form className="bg-white rounded-3xl overflow-hidden flex flex-col" onSubmit={handleFormSubmit}>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                            <h3 className="text-xl font-display font-bold text-primary-dark">
                                {editingCost ? 'Last bewerken' : 'Nieuwe uitgave toevoegen'}
                            </h3>
                            <button 
                                type="button"
                                onClick={handleFormClose}
                                className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Naam</label>
                                <input
                                    className="w-full h-12 rounded-[24px] border-gray-200 bg-gray-50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                                    placeholder="Bijv. Netflix"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Bedrag (€)</label>
                                    <input
                                        className="w-full h-12 rounded-[24px] border-gray-200 bg-gray-50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                                        placeholder="0.00"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Betaaldag</label>
                                    <input
                                        className="w-full h-12 rounded-[24px] border-gray-200 bg-gray-50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                                        max="31"
                                        min="1"
                                        placeholder="DD"
                                        type="number"
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-700">Categorie</label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                    <SelectTrigger className="w-full h-12 rounded-[24px] border-gray-200 bg-gray-50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-gray-700">
                                        <SelectValue placeholder="Selecteer categorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="wonen">🏠 Wonen</SelectItem>
                                        <SelectItem value="utilities">⚡ Nutsvoorzieningen</SelectItem>
                                        <SelectItem value="verzekeringen">🛡️ Verzekeringen</SelectItem>
                                        <SelectItem value="abonnementen">📱 Abonnementen</SelectItem>
                                        <SelectItem value="streaming_diensten">📺 Streaming</SelectItem>
                                        <SelectItem value="bankkosten">🏦 Bankkosten</SelectItem>
                                        <SelectItem value="vervoer">🚗 Vervoer</SelectItem>
                                        <SelectItem value="other">🧩 Overig</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">Startdatum</label>
                                    <input
                                        className="w-full h-12 rounded-[24px] border-gray-200 bg-gray-50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-gray-500"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-gray-700">
                                        Einddatum <span className="font-normal text-gray-400">(optioneel)</span>
                                    </label>
                                    <input
                                        className="w-full h-12 rounded-[24px] border-gray-200 bg-gray-50 px-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow text-gray-500"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-8 py-5 flex justify-end gap-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleFormClose}
                                className="px-6 py-2.5 rounded-[24px] border border-gray-300 text-gray-700 font-bold hover:bg-white hover:shadow-sm transition-all text-sm"
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-[24px] bg-primary-dark text-white font-bold hover:bg-opacity-90 shadow-soft hover:shadow-lg transition-all text-sm"
                            >
                                {editingCost ? 'Opslaan' : 'Toevoegen'}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Quick Add Modal */}
            <Dialog open={showQuickAddModal} onOpenChange={setShowQuickAddModal}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl p-0">
                    <form className="bg-white rounded-3xl overflow-hidden flex flex-col">
                        <div className="flex items-center gap-4 px-8 py-6 border-b border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowQuickAddModal(false)}
                                className="text-gray-400 hover:text-primary-dark transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h3 className="text-xl font-display font-bold text-primary-dark">Snel vaste lasten toevoegen</h3>
                        </div>
                        <div className="p-8">
                            <p className="text-gray-500 mb-6 text-sm">Kies een categorie om direct veelvoorkomende vaste lasten toe te voegen.</p>
                    <CommonCostsSelector 
                        existingCosts={costs}
                        onSelect={async (selectedCosts) => {
                            try {
                                for (const cost of selectedCosts) {
                                    await MonthlyCost.create({
                                        name: cost.name,
                                        amount: cost.amount,
                                                payment_date: cost.payment_date || 1,
                                        category: cost.category,
                                        start_date: new Date().toISOString().split('T')[0],
                                        status: 'actief'
                                    });
                                }
                                toast({
                                    title: '✅ Toegevoegd',
                                    description: `${selectedCosts.length} vaste lasten toegevoegd`
                                });
                                        setShowQuickAddModal(false);
                                loadData();
                            } catch (error) {
                                console.error('Error adding costs:', error);
                                toast({
                                    title: '❌ Fout',
                                    description: 'Kon vaste lasten niet toevoegen',
                                    variant: 'destructive'
                                });
                            }
                        }}
                    />
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <MonthlyCostsInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
            />
        </main>
    );
}
