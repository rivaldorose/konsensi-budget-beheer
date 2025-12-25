import React, { useState, useEffect } from 'react';
import { MonthlyCost } from '.@/api/entities/MonthlyCost';
import { User } from '.@/api/entities/User';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Receipt, Calendar, Edit2, Trash2, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';
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
    const [editingCost, setEditingCost] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showCommonCostsModal, setShowCommonCostsModal] = useState(false);
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
            
            const costsData = await MonthlyCost.filter({ created_by: userData.email }, '-payment_date', 100);
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
    const activeCosts = costs.filter(c => {
        if (!c.start_date) return c.status === 'actief';
        const startDate = new Date(c.start_date);
        const endDate = c.end_date ? new Date(c.end_date) : null;
        return startDate <= today && (!endDate || endDate >= currentMonth);
    });

    const totalMonthly = activeCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    const upcomingPayments = activeCosts.filter(c => c.payment_date >= today.getDate());
    const totalUpcoming = upcomingPayments.reduce((sum, c) => sum + (c.amount || 0), 0);

    // Group by category
    const costsByCategory = activeCosts.reduce((acc, cost) => {
        const category = cost.category || 'other';
        if (!acc[category]) {
            acc[category] = { total: 0, items: [] };
        }
        acc[category].total += cost.amount || 0;
        acc[category].items.push(cost);
        return acc;
    }, {});

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
        other: '📦 Overig'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-gray-900">{t('monthlyCosts.title')}</h1>
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Uitleg"
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-gray-600 mt-1">{t('monthlyCosts.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => setShowCommonCostsModal(true)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                        ✨ Snel kiezen
                    </Button>
                    <Button data-tour="add-cost" onClick={() => setShowFormModal(true)} className="bg-[#386641] hover:bg-[#2A4B30]">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('monthlyCosts.addCost')}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            {t('monthlyCosts.totalMonthly')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(totalMonthly)}
                            </span>
                            <Receipt className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            {t('monthlyCosts.activeCosts')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-900">
                                {activeCosts.length}
                            </span>
                            <Calendar className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            {t('monthlyCosts.upcomingPayments')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(totalUpcoming)}
                            </span>
                            <TrendingUp className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('monthlyCosts.overview')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <MonthlyCostsChart allMonthlyCosts={costs} allUnexpectedCosts={[]} />
                </CardContent>
            </Card>

            {/* Costs by Category */}
            <div data-tour="costs-categories" className="space-y-4">
            {Object.entries(costsByCategory).map(([category, data]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>{categoryLabels[category] || category}</span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(data.total)}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.items.map((cost) => (
                                <div key={cost.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{cost.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            {t('monthlyCosts.paymentDay')}: {cost.payment_date}
                                            {cost.start_date && ` • Start: ${format(new Date(cost.start_date), 'dd MMM yyyy', { locale: nl })}`}
                                            {cost.end_date && ` • Eind: ${format(new Date(cost.end_date), 'dd MMM yyyy', { locale: nl })}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-bold text-lg text-gray-900">
                                            {formatCurrency(cost.amount)}
                                        </p>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(cost)}
                                                className="h-8 w-8"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(cost.id)}
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
            </div>

            {activeCosts.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-center">
                            {t('monthlyCosts.noCosts')}
                        </p>
                        <Button onClick={() => setShowFormModal(true)} className="mt-4">
                            <Plus className="w-4 h-4 mr-2" />
                            {t('monthlyCosts.addFirstCost')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Form Modal */}
            <Dialog open={showFormModal} onOpenChange={handleFormClose}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCost ? t('monthlyCosts.editCost') : t('monthlyCosts.addCost')}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('monthlyCosts.name')}</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Bijv. Huur, Stroom, Internet"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">{t('monthlyCosts.amount')}</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_date">{t('monthlyCosts.paymentDay')}</Label>
                                    <Input
                                        id="payment_date"
                                        type="number"
                                        min="1"
                                        max="31"
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        placeholder="1-31"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">{t('monthlyCosts.category')}</Label>
                                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('monthlyCosts.selectCategory')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="wonen">🏠 Wonen</SelectItem>
                                        <SelectItem value="boodschappen">🛒 Boodschappen</SelectItem>
                                        <SelectItem value="utilities">⚡ Nutsvoorzieningen</SelectItem>
                                        <SelectItem value="verzekeringen">🛡️ Verzekeringen</SelectItem>
                                        <SelectItem value="abonnementen">📱 Abonnementen</SelectItem>
                                        <SelectItem value="streaming_diensten">📺 Streaming</SelectItem>
                                        <SelectItem value="bankkosten">🏦 Bankkosten</SelectItem>
                                        <SelectItem value="vervoer">🚗 Vervoer</SelectItem>
                                        <SelectItem value="leningen">💳 Leningen</SelectItem>
                                        <SelectItem value="other">📦 Overig</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">{t('monthlyCosts.startDate')}</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end_date">{t('monthlyCosts.endDate')} ({t('common.optional')})</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleFormClose}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit">
                                {editingCost ? t('common.save') : t('common.add')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <MonthlyCostsInfoModal
                isOpen={showInfoModal}
                onClose={() => setShowInfoModal(false)}
            />

            {/* Common Costs Modal */}
            <Dialog open={showCommonCostsModal} onOpenChange={setShowCommonCostsModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>✨ Snel vaste lasten toevoegen</DialogTitle>
                    </DialogHeader>
                    <CommonCostsSelector 
                        existingCosts={costs}
                        onSelect={async (selectedCosts) => {
                            try {
                                for (const cost of selectedCosts) {
                                    await MonthlyCost.create({
                                        name: cost.name,
                                        amount: cost.amount,
                                        payment_date: 1,
                                        category: cost.category,
                                        start_date: new Date().toISOString().split('T')[0],
                                        status: 'actief'
                                    });
                                }
                                toast({
                                    title: '✅ Toegevoegd',
                                    description: `${selectedCosts.length} vaste lasten toegevoegd`
                                });
                                setShowCommonCostsModal(false);
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
                </DialogContent>
            </Dialog>
        </div>
    );
}