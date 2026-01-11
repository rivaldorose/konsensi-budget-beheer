import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Pot } from '@/api/entities';
import { User } from '@/api/entities';
import { Loader2 } from 'lucide-react';

const CATEGORY_PRESETS = [
    { name: 'Wonen', icon: '🏠', color: '#10b77f', description: 'Huur, hypotheek, onderhoud' },
    { name: 'Boodschappen', icon: '🛒', color: '#ef4444', description: 'Dagelijkse boodschappen' },
    { name: 'Vervoer', icon: '🚗', color: '#3b82f6', description: 'Auto, OV, brandstof' },
    { name: 'Abonnementen', icon: '📱', color: '#8b5cf6', description: 'Streaming, telefoon, internet' },
    { name: 'Energie & Water', icon: '💡', color: '#f59e0b', description: 'Gas, elektriciteit, water' },
    { name: 'Verzekeringen', icon: '🛡️', color: '#06b6d4', description: 'Zorg, auto, inboedel' },
    { name: 'Kleding', icon: '👕', color: '#ec4899', description: 'Kleding en schoenen' },
    { name: 'Gezondheid', icon: '💊', color: '#14b8a6', description: 'Medicijnen, sport, wellness' },
    { name: 'Vrije tijd', icon: '🎮', color: '#a855f7', description: 'Hobby\'s, uitjes, entertainment' },
    { name: 'Sparen', icon: '💰', color: '#22c55e', description: 'Spaardoelen' },
    { name: 'Overig', icon: '📦', color: '#6b7280', description: 'Andere uitgaven' },
];

const NIBUD_PERCENTAGES = {
    'Wonen': 30,
    'Boodschappen': 12,
    'Vervoer': 10,
    'Abonnementen': 5,
    'Energie & Water': 8,
    'Verzekeringen': 10,
    'Kleding': 4,
    'Gezondheid': 3,
    'Vrije tijd': 8,
    'Sparen': 10,
    'Overig': 0,
};

export default function AddBudgetCategoryModal({ isOpen, onClose, onSuccess, monthlyIncome = 0 }) {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState('select'); // 'select' or 'customize'
    const [existingPots, setExistingPots] = useState([]);

    // Form state
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [customName, setCustomName] = useState('');
    const [customIcon, setCustomIcon] = useState('📦');
    const [budget, setBudget] = useState('');
    const [potType, setPotType] = useState('expense'); // expense or savings

    useEffect(() => {
        if (isOpen) {
            loadExistingPots();
            resetForm();
        }
    }, [isOpen]);

    useEffect(() => {
        // Calculate suggested budget based on NIBUD percentages
        if (selectedPreset && monthlyIncome > 0) {
            const percentage = NIBUD_PERCENTAGES[selectedPreset.name] || 5;
            const suggestedBudget = Math.round((monthlyIncome * percentage) / 100);
            setBudget(suggestedBudget.toString());
        }
    }, [selectedPreset, monthlyIncome]);

    const loadExistingPots = async () => {
        try {
            const user = await User.me();
            if (user) {
                const pots = await Pot.filter({ user_id: user.id });
                setExistingPots(pots || []);
            }
        } catch (error) {
            console.error('Error loading pots:', error);
        }
    };

    const resetForm = () => {
        setStep('select');
        setSelectedPreset(null);
        setCustomName('');
        setCustomIcon('📦');
        setBudget('');
        setPotType('expense');
    };

    const isPresetUsed = (presetName) => {
        return existingPots.some(pot => pot.name === presetName);
    };

    const handlePresetSelect = (preset) => {
        if (isPresetUsed(preset.name)) {
            toast({
                title: '⚠️ Categorie bestaat al',
                description: `Je hebt al een budget voor ${preset.name}`,
                variant: 'destructive'
            });
            return;
        }
        setSelectedPreset(preset);
        setCustomName(preset.name);
        setCustomIcon(preset.icon);
        setPotType(preset.name === 'Sparen' ? 'savings' : 'expense');
        setStep('customize');
    };

    const handleCustomCategory = () => {
        setSelectedPreset(null);
        setCustomName('');
        setCustomIcon('📦');
        setBudget('');
        setStep('customize');
    };

    const handleSave = async () => {
        if (!customName || !budget) {
            toast({ title: '⚠️ Vul alle velden in', variant: 'destructive' });
            return;
        }

        // Check if name already exists
        if (existingPots.some(pot => pot.name.toLowerCase() === customName.toLowerCase())) {
            toast({
                title: '⚠️ Naam bestaat al',
                description: 'Kies een andere naam voor je budget categorie',
                variant: 'destructive'
            });
            return;
        }

        setSaving(true);
        try {
            const user = await User.me();
            if (!user) throw new Error('Niet ingelogd');

            const parsedBudget = parseFloat(budget);

            await Pot.create({
                user_id: user.id,
                name: customName,
                icon: customIcon,
                budget: parsedBudget,
                spent: 0,
                pot_type: potType,
            });

            toast({
                title: '✅ Budget categorie aangemaakt!',
                description: `${customIcon} ${customName} met een budget van €${parsedBudget.toFixed(2)}`
            });

            onSuccess?.();
            onClose();

        } catch (error) {
            console.error('Error saving category:', error);
            toast({ title: '❌ Fout bij opslaan', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const availableIcons = ['🏠', '🛒', '🚗', '📱', '💡', '🛡️', '👕', '💊', '🎮', '💰', '📦', '🎁', '✈️', '🍽️', '☕', '🎬', '📚', '🏋️', '🐕', '👶'];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'select' ? 'Nieuwe Budget Categorie' : 'Categorie Instellen'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'select' ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Kies een standaard categorie of maak een eigen categorie aan.
                        </p>

                        {/* Preset Categories Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {CATEGORY_PRESETS.map((preset) => {
                                const isUsed = isPresetUsed(preset.name);
                                return (
                                    <button
                                        key={preset.name}
                                        onClick={() => handlePresetSelect(preset)}
                                        disabled={isUsed}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            isUsed
                                                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{preset.icon}</span>
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">{preset.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {isUsed ? 'Al in gebruik' : preset.description}
                                                </p>
                                            </div>
                                        </div>
                                        {!isUsed && monthlyIncome > 0 && (
                                            <p className="text-xs text-primary mt-2 font-medium">
                                                NIBUD advies: {NIBUD_PERCENTAGES[preset.name]}% = €{Math.round((monthlyIncome * NIBUD_PERCENTAGES[preset.name]) / 100)}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Custom Category Button */}
                        <button
                            onClick={handleCustomCategory}
                            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-primary">add</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">Eigen categorie maken</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Back Button */}
                        <button
                            onClick={() => setStep('select')}
                            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Terug naar categorieën
                        </button>

                        {/* Icon Selector */}
                        <div>
                            <Label>Icoon</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {availableIcons.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setCustomIcon(icon)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                                            customIcon === icon
                                                ? 'bg-primary/20 border-2 border-primary'
                                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Name */}
                        <div>
                            <Label>Naam categorie</Label>
                            <Input
                                placeholder="Bijv. Vakantie, Cadeaus, etc."
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        {/* Budget Amount */}
                        <div>
                            <Label>Maandelijks budget (€)</Label>
                            <Input
                                type="number"
                                step="1"
                                min="0"
                                placeholder="0"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="mt-1"
                            />
                            {selectedPreset && monthlyIncome > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    NIBUD advies voor {selectedPreset.name}: {NIBUD_PERCENTAGES[selectedPreset.name]}% van je inkomen
                                </p>
                            )}
                        </div>

                        {/* Category Type */}
                        <div>
                            <Label>Type</Label>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setPotType('expense')}
                                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                                        potType === 'expense'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-red-500">trending_down</span>
                                        <span className="font-medium text-gray-900 dark:text-white">Uitgave</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Voor maandelijkse uitgaven</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPotType('savings')}
                                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                                        potType === 'savings'
                                            ? 'border-primary bg-primary/10'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-500">savings</span>
                                        <span className="font-medium text-gray-900 dark:text-white">Sparen</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Voor spaardoelen</p>
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Preview</p>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                                    {customIcon}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{customName || 'Naam categorie'}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Budget: €{parseFloat(budget || 0).toFixed(2)} per maand
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {step === 'customize' && (
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Annuleren
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !customName || !budget}
                            className="flex-1 bg-primary hover:bg-primary/90"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Opslaan...
                                </>
                            ) : (
                                'Categorie Aanmaken'
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
