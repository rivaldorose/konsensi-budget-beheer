import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Income, MonthlyCost, Transaction, Pot } from '@/api/entities';

export default function AddTransactionModal({ isOpen, onClose, onSuccess, userEmail, editTransaction = null }) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('expense');
    const [saving, setSaving] = useState(false);
    const [pots, setPots] = useState([]);
    const [editId, setEditId] = useState(null);

    // Form state
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [selectedPot, setSelectedPot] = useState('');
    const [expenseType, setExpenseType] = useState('eenmalig'); // eenmalig, vast
    const [incomeType, setIncomeType] = useState('extra'); // extra, vast
    const [showNewPot, setShowNewPot] = useState(false);
    const [newPotName, setNewPotName] = useState('');
    const [newPotIcon, setNewPotIcon] = useState('📦');
    const [newPotBudget, setNewPotBudget] = useState('');

    // Vaste lasten categorieën
    const costCategories = [
        { value: 'wonen', label: '🏠 Wonen' },
        { value: 'utilities', label: '💡 Gas/Water/Licht' },
        { value: 'verzekeringen', label: '🛡️ Verzekeringen' },
        { value: 'abonnementen', label: '📱 Abonnementen' },
        { value: 'vervoer', label: '🚗 Vervoer' },
        { value: 'boodschappen', label: '🛒 Boodschappen' },
        { value: 'other', label: '📦 Overig' }
    ];

    useEffect(() => {
        if (isOpen && userEmail) {
            loadPots();
        }
    }, [isOpen, userEmail]);

    useEffect(() => {
        if (isOpen) {
            if (editTransaction) {
                // Pre-fill form with existing transaction data
                setEditId(editTransaction.id);
                setDescription(editTransaction.description || '');
                setAmount(editTransaction.amount?.toString() || '');
                setDate(editTransaction.date || new Date().toISOString().split('T')[0]);
                setCategory(editTransaction.category || '');
                setActiveTab(editTransaction.type === 'income' ? 'income' : 'expense');
                setExpenseType('eenmalig');
                setIncomeType(editTransaction.type === 'income' ? 'extra' : 'extra');
                setSelectedPot('');
            } else {
                // Reset form
                setEditId(null);
                setDescription('');
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setCategory('');
                setSelectedPot('');
                setExpenseType('eenmalig');
                setIncomeType('extra');
            }
            setShowNewPot(false);
            setNewPotName('');
            setNewPotIcon('📦');
            setNewPotBudget('');
        }
    }, [isOpen, editTransaction]);

    const [userId, setUserId] = useState(null);

    const loadPots = async () => {
        try {
            const { User } = await import('@/api/entities');
            const user = await User.me();
            if (!user) return;
            setUserId(user.id);
            const potsData = await Pot.filter({ user_id: user.id });
            setPots(potsData.filter(p => p.pot_type === 'expense'));
        } catch (error) {
            console.error('Error loading pots:', error);
        }
    };

    const handleCreateNewPot = async () => {
        if (!newPotName) {
            toast({ title: '⚠️ Vul een naam in', variant: 'destructive' });
            return;
        }
        if (!userId) return;
        try {
            await Pot.create({
                user_id: userId,
                name: newPotName,
                icon: newPotIcon,
                pot_type: 'expense',
                budget: parseFloat(newPotBudget || 0),
                target_amount: 0,
                current_amount: 0,
            });
            toast({ title: `✅ Potje "${newPotName}" aangemaakt!` });
            setCategory(newPotName.toLowerCase());
            setShowNewPot(false);
            setNewPotName('');
            setNewPotIcon('📦');
            setNewPotBudget('');
            await loadPots();
        } catch (error) {
            console.error('Error creating pot:', error);
            toast({ title: '❌ Fout bij aanmaken potje', variant: 'destructive' });
        }
    };

    const handleSave = async () => {
        if (!description || !amount) {
            toast({ title: '⚠️ Vul alle velden in', variant: 'destructive' });
            return;
        }

        if (!userId) {
            toast({ title: '⚠️ Niet ingelogd', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const parsedAmount = parseFloat(amount);

            // UPDATE existing transaction
            if (editId) {
                await Transaction.update(editId, {
                    description,
                    amount: parsedAmount,
                    date,
                    category: category || (activeTab === 'income' ? 'inkomen' : 'overig'),
                    type: activeTab,
                });
                toast({ title: '✅ Transactie bijgewerkt!' });
                onSuccess?.();
                onClose();
                return;
            }

            if (activeTab === 'income') {
                // Inkomen toevoegen
                if (incomeType === 'vast') {
                    await Income.create({
                        user_id: userId,
                        description,
                        amount: parsedAmount,
                        income_type: 'vast',
                        frequency: 'monthly',
                        monthly_equivalent: parsedAmount,
                        start_date: date,
                        is_active: true
                    });
                } else {
                    await Income.create({
                        user_id: userId,
                        description,
                        amount: parsedAmount,
                        income_type: 'extra',
                        date: date
                    });
                }

                // Ook als transactie registreren
                await Transaction.create({
                    user_id: userId,
                    type: 'income',
                    amount: parsedAmount,
                    description,
                    category: 'inkomen',
                    date
                });

                toast({ title: '✅ Inkomen toegevoegd!' });

            } else {
                // Uitgave toevoegen
                if (expenseType === 'vast') {
                    // Vaste last toevoegen
                    const dayOfMonth = new Date(date).getDate();
                    await MonthlyCost.create({
                        user_id: userId,
                        name: description,
                        amount: parsedAmount,
                        payment_date: dayOfMonth,
                        category: category || 'other',
                        status: 'actief',
                        start_date: date
                    });
                    toast({ title: '✅ Vaste last toegevoegd!' });

                } else if (selectedPot) {
                    // Aan potje koppelen
                    const pot = pots.find(p => p.id === selectedPot);
                    if (pot) {
                        const newSpent = (parseFloat(pot.spent) || 0) + parsedAmount;
                        await Pot.update(pot.id, { spent: newSpent });
                    }

                    // Transactie registreren
                    await Transaction.create({
                        user_id: userId,
                        type: 'expense',
                        amount: parsedAmount,
                        description,
                        category: pot?.name || 'overig',
                        date
                    });
                    toast({ title: '✅ Uitgave toegevoegd aan potje!' });

                } else {
                    // Losse uitgave
                    const expenseCategory = category || 'overig';
                    await Transaction.create({
                        user_id: userId,
                        type: 'expense',
                        amount: parsedAmount,
                        description,
                        category: expenseCategory,
                        date
                    });

                    // Auto-pot aanmaken als er geen pot bestaat voor deze categorie
                    if (expenseCategory !== 'other' && expenseCategory !== 'overig') {
                        const existingPots = await Pot.filter({ user_id: userId });
                        const hasPot = existingPots.some(p => p.name.toLowerCase() === expenseCategory.toLowerCase());
                        if (!hasPot) {
                            const catInfo = costCategories.find(c => c.value === expenseCategory);
                            const icon = catInfo ? catInfo.label.split(' ')[0] : '📦';
                            const potName = catInfo ? catInfo.label.split(' ').slice(1).join(' ') : expenseCategory;
                            await Pot.create({
                                user_id: userId,
                                name: potName,
                                icon: icon,
                                pot_type: 'expense',
                                budget: 0,
                                target_amount: 0,
                                current_amount: 0
                            });
                            toast({ title: '✅ Uitgave toegevoegd!', description: `Nieuw potje "${potName}" automatisch aangemaakt` });
                        } else {
                            toast({ title: '✅ Uitgave toegevoegd!' });
                        }
                    } else {
                        toast({ title: '✅ Uitgave toegevoegd!' });
                    }
                }
            }

            onSuccess?.();
            onClose();

        } catch (error) {
            console.error('Error saving:', error);
            toast({ title: '❌ Fout bij opslaan', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-[#2a2a2a] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${
                            activeTab === 'expense'
                                ? 'bg-red-50 dark:bg-red-900/20'
                                : 'bg-emerald-50 dark:bg-emerald-900/20'
                        }`}>
                            <span className={`material-symbols-outlined text-[20px] ${
                                activeTab === 'expense'
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                                {activeTab === 'expense' ? 'shopping_cart' : 'account_balance_wallet'}
                            </span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-[#131d0c] dark:text-white">
                            {editId ? 'Transactie bewerken' : 'Transactie toevoegen'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 dark:text-[#a1a1a1] hover:text-gray-600 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="px-5 pt-5">
                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-[#0a0a0a] rounded-xl">
                        <button
                            onClick={() => setActiveTab('expense')}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'expense'
                                    ? 'bg-white dark:bg-[#2a2a2a] text-red-500 dark:text-red-400 shadow-sm'
                                    : 'text-gray-500 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-[#a1a1a1]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">trending_down</span>
                            Uitgave
                        </button>
                        <button
                            onClick={() => setActiveTab('income')}
                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                activeTab === 'income'
                                    ? 'bg-white dark:bg-[#2a2a2a] text-emerald-500 dark:text-emerald-400 shadow-sm'
                                    : 'text-gray-500 dark:text-[#6b7280] hover:text-gray-700 dark:hover:text-[#a1a1a1]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">trending_up</span>
                            Inkomen
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Beschrijving */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
                            Beschrijving
                        </label>
                        <input
                            type="text"
                            placeholder={activeTab === 'expense' ? 'Bijv. Boodschappen Albert Heijn' : 'Bijv. Salaris januari'}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>

                    {/* Bedrag + Datum */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
                                Bedrag
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6b7280] font-bold text-sm">€</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-[#6b7280] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-1.5">
                                Datum
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-[#2a2a2a] rounded-xl bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Expense-specific fields */}
                    {activeTab === 'expense' && (
                        <>
                            {/* Type uitgave */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
                                    Type uitgave
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'eenmalig', label: 'Eenmalig', icon: 'receipt_long' },
                                        { value: 'vast', label: 'Vaste last', icon: 'sync' },
                                        { value: 'potje', label: 'Potje', icon: 'savings' },
                                    ].map(type => (
                                        <button
                                            key={type.value}
                                            onClick={() => setExpenseType(type.value)}
                                            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                                                expenseType === type.value
                                                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                    : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-300 dark:hover:border-emerald-700'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">{type.icon}</span>
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Categorie selector */}
                            {(expenseType === 'vast' || expenseType === 'eenmalig') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
                                        {expenseType === 'vast' ? 'Categorie vaste last' : 'Categorie'}
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {costCategories.map(cat => (
                                            <button
                                                key={cat.value}
                                                onClick={() => setCategory(cat.value)}
                                                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[11px] font-medium transition-all border ${
                                                    category === cat.value
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                                                        : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-200 dark:hover:border-emerald-800'
                                                }`}
                                            >
                                                <span className="text-lg">{cat.label.split(' ')[0]}</span>
                                                <span className="truncate w-full text-center">{cat.label.split(' ').slice(1).join(' ')}</span>
                                            </button>
                                        ))}
                                        {/* Bestaande potjes als extra categorieën */}
                                        {pots.filter(p => !costCategories.some(c => c.value === p.name.toLowerCase())).map(pot => (
                                            <button
                                                key={`pot-${pot.id}`}
                                                onClick={() => setCategory(pot.name.toLowerCase())}
                                                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[11px] font-medium transition-all border ${
                                                    category === pot.name.toLowerCase()
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                                                        : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-200 dark:hover:border-emerald-800'
                                                }`}
                                            >
                                                <span className="text-lg">{pot.icon || '📦'}</span>
                                                <span className="truncate w-full text-center">{pot.name}</span>
                                            </button>
                                        ))}
                                        {/* Nieuw potje aanmaken knop */}
                                        <button
                                            onClick={() => setShowNewPot(!showNewPot)}
                                            className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-[11px] font-medium transition-all border border-dashed ${
                                                showNewPot
                                                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                    : 'border-gray-300 dark:border-[#3a3a3a] text-gray-500 dark:text-[#6b7280] hover:border-emerald-300 dark:hover:border-emerald-700'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-lg">add</span>
                                            <span className="truncate w-full text-center">Nieuw</span>
                                        </button>
                                    </div>

                                    {/* Inline nieuw potje formulier */}
                                    {showNewPot && (
                                        <div className="mt-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 space-y-2">
                                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Nieuw potje aanmaken</p>
                                            <div className="flex gap-2">
                                                <div className="flex gap-1">
                                                    {['🏠','🛒','🚗','📱','💡','🎮','🎁','✈️','📦','💊'].map(icon => (
                                                        <button
                                                            key={icon}
                                                            type="button"
                                                            onClick={() => setNewPotIcon(icon)}
                                                            className={`size-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                                                                newPotIcon === icon
                                                                    ? 'bg-emerald-200 dark:bg-emerald-700'
                                                                    : 'bg-white dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#3a3a3a]'
                                                            }`}
                                                        >
                                                            {icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Naam potje"
                                                    value={newPotName}
                                                    onChange={(e) => setNewPotName(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                                />
                                                <div className="relative w-24">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">€</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Budget"
                                                        value={newPotBudget}
                                                        onChange={(e) => setNewPotBudget(e.target.value)}
                                                        className="w-full pl-6 pr-2 py-2 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#2a2a2a] text-[#131d0c] dark:text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleCreateNewPot}
                                                className="w-full px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                                Potje Aanmaken
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Potje selector */}
                            {expenseType === 'potje' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
                                        Kies potje
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {pots.map(pot => {
                                            const remaining = (parseFloat(pot.budget || pot.monthly_budget || 0) - (parseFloat(pot.spent) || 0));
                                            return (
                                                <button
                                                    key={pot.id}
                                                    onClick={() => setSelectedPot(pot.id)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                                        selectedPot === pot.id
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                                                            : 'bg-white dark:bg-[#2a2a2a] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-200 dark:hover:border-emerald-800'
                                                    }`}
                                                >
                                                    <span className="text-xl">{pot.icon || '📦'}</span>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-sm font-bold text-[#131d0c] dark:text-white">{pot.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-[#6b7280]">
                                                            €{remaining.toFixed(0)} over
                                                        </p>
                                                    </div>
                                                    {selectedPot === pot.id && (
                                                        <span className="material-symbols-outlined text-emerald-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                            check_circle
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        {pots.length === 0 && (
                                            <p className="text-sm text-gray-400 dark:text-[#6b7280] text-center py-4">
                                                Geen potjes gevonden
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Income-specific fields */}
                    {activeTab === 'income' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-[#a1a1a1] mb-2">
                                Type inkomen
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { value: 'extra', label: 'Eenmalig', icon: 'payments' },
                                    { value: 'vast', label: 'Vast (maandelijks)', icon: 'sync' },
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        onClick={() => setIncomeType(type.value)}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                                            incomeType === type.value
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                : 'bg-white dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] border-gray-200 dark:border-[#3a3a3a] hover:border-emerald-300 dark:hover:border-emerald-700'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{type.icon}</span>
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-[#2a2a2a] bg-gray-50/50 dark:bg-[#0a0a0a]/50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1] font-medium text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-all"
                    >
                        Annuleren
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        {saving ? (
                            <>
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                Opslaan...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">check</span>
                                Opslaan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}