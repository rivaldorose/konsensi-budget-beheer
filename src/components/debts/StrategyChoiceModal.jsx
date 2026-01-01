import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Zap, Award, Snowflake, TrendingDown, Clock, Shield, Info, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/components/utils/LanguageContext';
import { calculateStrategies, activateStrategy } from '@/api/functions';
import { formatCurrency } from '@/components/utils/formatters';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

import SnowballExplanationModal from './SnowballExplanationModal';
import AvalancheExplanationModal from './AvalancheExplanationModal';

// Functions are now imported from @/api/functions


const StrategyCard = ({ title, icon, description, advantages, disadvantages, result, onChoose, isChoosing, t, onShowExplanation }) => {
    // Determine card styling based on title or a specific strategy type if available
    const isSnowball = title === t('strategy.snowball.title');
    const isAvalanche = title === t('strategy.avalanche.title');
    const isProportional = title === "Gelijkmatige Verdeling"; // Use a direct check for the new strategy's title

    let borderColor = 'border-gray-200';
    let bgColor = 'bg-gray-50';
    let iconBgColor = 'bg-gray-500';
    let titleTextColor = 'text-gray-900';
    let descriptionTextColor = 'text-gray-700';
    let buttonColor = 'bg-gray-600 hover:bg-gray-700';

    if (isSnowball) {
        borderColor = 'border-blue-200';
        bgColor = 'bg-blue-50';
        iconBgColor = 'bg-blue-500';
        titleTextColor = 'text-blue-900';
        descriptionTextColor = 'text-blue-700';
        buttonColor = 'bg-blue-600 hover:bg-blue-700';
    } else if (isAvalanche) {
        borderColor = 'border-purple-200';
        bgColor = 'bg-purple-50';
        iconBgColor = 'bg-purple-500';
        titleTextColor = 'text-purple-900';
        descriptionTextColor = 'text-purple-700';
        buttonColor = 'bg-purple-600 hover:bg-purple-700';
    } else if (isProportional) {
        // New styling for Proportional card
        borderColor = 'border-green-200';
        bgColor = 'bg-green-50';
        iconBgColor = 'bg-green-500';
        titleTextColor = 'text-green-900';
        descriptionTextColor = 'text-green-700';
        buttonColor = 'bg-green-600 hover:bg-green-700';
    }


    return (
        <div className={`p-6 border-2 rounded-lg flex flex-col h-full ${borderColor} ${bgColor}`}>
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor}`}>
                        <span className="text-2xl">{icon}</span>
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${titleTextColor}`}>{title}</h3>
                        <p className={`${descriptionTextColor}`}>{description}</p>
                    </div>
                </div>
                
                <div className="space-y-1 text-sm mb-4">
                    <p className="flex items-start gap-2"><span className="text-green-500 mt-1"><Award size={16}/></span>{advantages}</p>
                    <p className="flex items-start gap-2"><span className="text-red-500 mt-1"><Shield size={16}/></span>{disadvantages}</p>
                </div>
                
                <div className="bg-white/70 rounded-md p-3 space-y-2 my-4 text-sm">
                    <h4 className="font-semibold text-gray-700 mb-1">{t('strategy.yourOrder')}</h4>
                    {result ? (
                        <ol className="list-decimal list-inside space-y-1 text-gray-600">
                            {result.schedule.slice(0, 3).map(item => (
                                <li key={item.debt_id} className="truncate">
                                    {item.debt_name} ({formatCurrency(item.amount)})
                                </li>
                            ))}
                            {result.schedule.length > 3 && <li>... {t('strategy.andMore', {count: result.schedule.length - 3})}</li>}
                        </ol>
                    ) : (
                        <div className="h-20 flex items-center justify-center">
                            <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    )}
                </div>

                {result && (
                    <div className="text-sm space-y-2 bg-white/70 rounded-md p-3">
                        <div className="flex justify-between">
                            <span className="font-medium text-gray-600">{t('strategy.debtFree')}</span>
                            <span className="font-bold text-gray-800">{format(new Date(result.debt_free_date), 'MMM yyyy', { locale: nl })} ({result.total_months} {t('strategy.months')})</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-medium text-gray-600">{t('strategy.totalInterest')}</span>
                            <span className="font-bold text-gray-800">{formatCurrency(result.total_interest)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2 mt-6">
                 <Button onClick={onChoose} disabled={isChoosing || !result} className={`w-full ${buttonColor}`}>
                    {isChoosing ? <Loader2 className="animate-spin" /> : t('strategy.chooseButton', {title})}
                </Button>
                <Button variant="ghost" size="sm" onClick={onShowExplanation} className="flex items-center gap-1 text-gray-600">
                    <Info size={14}/> {t('strategy.viewExplanation')}
                </Button>
            </div>
        </div>
    );
}

const BudgetSelector = ({ available, initialBudget, onChange }) => {
    const [budget, setBudget] = useState(initialBudget);
    const { t } = useTranslation();

    useEffect(() => {
        // Debug log: BudgetSelector's internal budget state changed
        console.log('BudgetSelector: Internal budget state changed to', budget);
        onChange(budget);
    }, [budget, onChange]);

    // Ensure recommendedBudget is within the valid range [10, available]
    const recommendedBudget = Math.max(10, Math.min(available, Math.round((available / 2) / 50) * 50)); 

    return (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-bold text-gray-800">{t('strategy.budgetSelector.title')}</h3>
            <p className="text-gray-600 mb-4 text-sm">{t('strategy.budgetSelector.description', { amount: formatCurrency(available) })}</p>
            
            <Slider
                value={[budget]}
                onValueChange={(value) => {
                    console.log('BudgetSelector: Slider value changed to', value[0]); // Debug log
                    setBudget(value[0]);
                }}
                min={10}
                max={available}
                step={10}
                className="w-full"
            />
            
            <div className="flex justify-between text-sm text-gray-500 mt-2 mb-4">
                <span>€10</span>
                <span className="font-bold text-lg text-gray-900">{formatCurrency(budget)}</span>
                <span>{formatCurrency(available)}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                    const newBudget = Math.max(50, Math.round(available * 0.1));
                    console.log('BudgetSelector: Minimal button clicked, setting budget to', newBudget); // Debug log
                    setBudget(newBudget);
                }} className="h-auto py-2 flex flex-col">
                    <span className="font-bold">{formatCurrency(Math.max(50, Math.round(available * 0.1)))}</span>
                    <span className="text-xs font-normal">{t('strategy.budgetSelector.minimal')}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                    console.log('BudgetSelector: Recommended button clicked, setting budget to', recommendedBudget); // Debug log
                    setBudget(recommendedBudget);
                }} className="h-auto py-2 flex flex-col border-2 border-green-500 bg-green-50">
                    <span className="font-bold">{formatCurrency(recommendedBudget)}</span>
                    <span className="text-xs font-normal">{t('strategy.budgetSelector.recommended')}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                    console.log('BudgetSelector: Maximal button clicked, setting budget to', available); // Debug log
                    setBudget(available);
                }} className="h-auto py-2 flex flex-col">
                    <span className="font-bold">{formatCurrency(available)}</span>
                    <span className="text-xs font-normal">{t('strategy.budgetSelector.maximal')}</span>
                </Button>
            </div>
        </div>
    );
};

export default function StrategyChoiceModal({ isOpen, onClose, monthlyBudget, onStrategyChosen }) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [strategies, setStrategies] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isChoosing, setIsChoosing] = useState(null);
    const [currentBudget, setCurrentBudget] = useState(monthlyBudget);

    const [showSnowballExplanation, setShowSnowballExplanation] = useState(false);
    const [showAvalancheExplanation, setShowAvalancheExplanation] = useState(false);

    useEffect(() => {
        console.log(`StrategyChoiceModal: Modal is ${isOpen ? 'OPEN' : 'CLOSED'}. Initial monthlyBudget: ${monthlyBudget}, currentBudget: ${currentBudget}`);
        if (!isOpen) {
            setStrategies(null);
            setIsLoading(false);
            setIsChoosing(null);
            setShowSnowballExplanation(false);
            setShowAvalancheExplanation(false);
            console.log('StrategyChoiceModal: Internal state reset upon modal close.');
        }
    }, [isOpen, monthlyBudget, currentBudget]);

    const fetchStrategies = useCallback(async (budget) => {
        console.log(`StrategyChoiceModal: fetchStrategies called for budget: ${budget}`);
        setIsLoading(true);
        setStrategies(null);
        try {
            const { data } = await calculateStrategies({ monthly_budget: budget });
            console.log('StrategyChoiceModal: calculateStrategies succeeded. Data:', data);
            setStrategies(data);
        } catch (error) {
            console.error('StrategyChoiceModal: calculateStrategies failed. Error:', error);
            toast({ title: t('toast.error.title'), description: t('strategy.error.calculation'), variant: 'destructive' });
        } finally {
            setIsLoading(false);
            console.log('StrategyChoiceModal: fetchStrategies completed.');
        }
    }, [t, toast]);

    useEffect(() => {
        if (isOpen && currentBudget > 0) {
            console.log(`StrategyChoiceModal: currentBudget changed to ${currentBudget} while modal is open. Fetching strategies.`);
            fetchStrategies(currentBudget);
        } else if (isOpen && currentBudget <= 0) {
            console.warn(`StrategyChoiceModal: Modal is open but currentBudget is ${currentBudget}. Cannot fetch strategies.`);
            setStrategies(null);
        }
    }, [isOpen, currentBudget, fetchStrategies]);

    const handleBudgetChange = useCallback((newBudget) => {
        console.log(`StrategyChoiceModal: handleBudgetChange called. Old budget: ${currentBudget}, New budget: ${newBudget}`);
        setCurrentBudget(newBudget);
    }, [currentBudget]);

    const handleChooseStrategy = async (strategyType) => {
        console.log('🎯 User clicked strategy:', strategyType);
        console.log('💰 Budget:', currentBudget);
        
        setIsChoosing(strategyType);
        try {
            console.log('📞 Calling activateStrategy...');
            
            const response = await activateStrategy({
                strategy_type: strategyType,
                monthly_budget: currentBudget,
            });
            
            console.log('✅ Response from activateStrategy:', response);
            
            if (response && response.data && response.data.success) {
                console.log('✅ Strategy saved successfully!');
                console.log('📦 Received strategy:', response.data.strategy);
                console.log('📦 Received schedule:', response.data.schedule);
                
                toast({
                    title: t('strategy.toast.activatedTitle'),
                    description: response.data.message,
                });
                
                onClose();
                
                console.log('⏳ Waiting for database commit (1.5s)...');
                setTimeout(() => {
                    console.log('🔄 Now calling onStrategyChosen()...');
                    if (onStrategyChosen) {
                        onStrategyChosen();
                    }
                    setTimeout(() => {
                        console.log('🔄 Force reload as backup (window.location.reload())...');
                        window.location.reload();
                    }, 500);
                }, 1500);
                
            } else {
                console.error('❌ Invalid response:', response);
                throw new Error(response?.data?.error || t('strategy.error.activation')); 
            }
        } catch (error) {
            console.error('❌ Error in handleChooseStrategy:', error);
            toast({ 
                title: t('toast.error.title'), 
                description: error.message || t('strategy.error.activation'), 
                variant: "destructive" 
            });
        } finally {
            setIsChoosing(null);
        }
    };
    
    useEffect(() => {
        if (showSnowballExplanation) {
            console.log('StrategyChoiceModal: Snowball explanation modal opened.');
        } else if (isOpen) {
            console.log('StrategyChoiceModal: Snowball explanation modal closed.');
        }
    }, [showSnowballExplanation, isOpen]);

    useEffect(() => {
        if (showAvalancheExplanation) {
            console.log('StrategyChoiceModal: Avalanche explanation modal opened.');
        } else if (isOpen) {
            console.log('StrategyChoiceModal: Avalanche explanation modal closed.');
        }
    }, [showAvalancheExplanation, isOpen]);

    const avalancheSavings = strategies ? Math.max(0, strategies.snowball.total_interest - strategies.avalanche.total_interest) : 0;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                console.log(`StrategyChoiceModal: Dialog onOpenChange event, new state: ${open}`);
                onClose();
            }}>
                <DialogContent className="max-w-5xl p-0"> {/* Changed from max-w-4xl to max-w-5xl */}
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-3xl font-bold">{t('strategy.modalTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('strategy.modalDescription')}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="absolute right-4 top-4 rounded-full">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Sluiten</span>
                        </Button>
                    </DialogClose>

                    <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
                        <BudgetSelector available={monthlyBudget} initialBudget={currentBudget} onChange={handleBudgetChange} />

                        <div className="grid md:grid-cols-3 gap-4"> {/* Changed from md:grid-cols-2 to md:grid-cols-3 */}
                            {isLoading ? (
                                <>
                                    <div className="border rounded-lg p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin w-8 h-8 text-gray-400"/></div>
                                    <div className="border rounded-lg p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin w-8 h-8 text-gray-400"/></div>
                                    <div className="border rounded-lg p-6 flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin w-8 h-8 text-gray-400"/></div> {/* Added for the new card */}
                                </>
                            ) : (
                                <>
                                    <StrategyCard
                                        title={t('strategy.snowball.title')}
                                        icon="❄️"
                                        description={t('strategy.snowball.description')}
                                        advantages={t('strategy.snowball.advantages')}
                                        disadvantages={t('strategy.snowball.disadvantages')}
                                        result={strategies?.snowball}
                                        onChoose={() => {
                                            console.log('StrategyChoiceModal: Snowball card choose button clicked.');
                                            handleChooseStrategy('snowball');
                                        }}
                                        isChoosing={isChoosing === 'snowball'}
                                        onShowExplanation={() => {
                                            console.log('StrategyChoiceModal: Snowball card "View Explanation" button clicked.');
                                            setShowSnowballExplanation(true);
                                        }}
                                        t={t}
                                    />
                                    <div className="relative">
                                        <StrategyCard
                                            title={t('strategy.avalanche.title')}
                                            icon="⚡"
                                            description={t('strategy.avalanche.description')}
                                            advantages={t('strategy.avalanche.advantages')}
                                            disadvantages={t('strategy.avalanche.disadvantages')}
                                            result={strategies?.avalanche}
                                            onChoose={() => {
                                                console.log('StrategyChoiceModal: Avalanche card choose button clicked.');
                                                handleChooseStrategy('avalanche');
                                            }}
                                            isChoosing={isChoosing === 'avalanche'}
                                            onShowExplanation={() => {
                                                console.log('StrategyChoiceModal: Avalanche card "View Explanation" button clicked.');
                                                setShowAvalancheExplanation(true);
                                            }}
                                            t={t}
                                        />
                                        {avalancheSavings > 0 && (
                                            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-sm">
                                                {t('strategy.avalanche.savings')}: {formatCurrency(avalancheSavings)}
                                            </div>
                                        )}
                                    </div>
                                    {/* NEW STRATEGY CARD: Gelijkmatige Verdeling (Proportional) */}
                                    <StrategyCard
                                        title="Gelijkmatige Verdeling"
                                        icon="⚖️"
                                        description="Los alle schulden tegelijk af"
                                        advantages="Eerlijk: elke schuldeiser krijgt zijn deel"
                                        disadvantages="Kan langer duren dan focusmethodes"
                                        result={strategies?.proportional}
                                        onChoose={() => {
                                            console.log('StrategyChoiceModal: Proportional card choose button clicked.');
                                            handleChooseStrategy('proportional');
                                        }}
                                        isChoosing={isChoosing === 'proportional'}
                                        onShowExplanation={() => {
                                            toast({ title: 'Info', description: 'Je budget wordt eerlijk verdeeld over alle schulden op basis van hun grootte.' });
                                        }}
                                        t={t}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Explanation Modals */}
            <SnowballExplanationModal 
                isOpen={showSnowballExplanation} 
                onClose={() => {
                    console.log('StrategyChoiceModal: SnowballExplanationModal onClose called.');
                    setShowSnowballExplanation(false);
                }}
                budget={currentBudget}
                strategyResult={strategies?.snowball}
            />
            <AvalancheExplanationModal 
                isOpen={showAvalancheExplanation} 
                onClose={() => {
                    console.log('StrategyChoiceModal: AvalancheExplanationModal onClose called.');
                    setShowAvalancheExplanation(false);
                }}
                budget={currentBudget}
                strategyResult={strategies?.avalanche}
                savings={avalancheSavings}
            />
        </>
    );
}