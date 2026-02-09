import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  X,
  Euro,
  FileText,
  CreditCard,
  Calculator,
  Wallet,
  ClipboardCheck
} from 'lucide-react';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';

const StartgidsWidget = ({ 
  allIncomes = [], 
  allMonthlyCosts = [], 
  allDebts = [], 
  allPots = [],
  user,
  onRefresh
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { toast } = useToast();

  // Check of gebruiker de gids heeft weggeklikt
  useEffect(() => {
    if (user?.startgids_dismissed) {
      setIsDismissed(true);
    }
  }, [user]);

  // Definieer alle stappen met hun criteria
  const steps = [
    {
      id: 1,
      title: 'Voeg je Inkomen toe',
      description: 'De basis van alles is weten wat er binnenkomt',
      icon: Euro,
      link: '/income',
      isCompleted: allIncomes.filter(i => i.income_type === 'vast' && i.is_active !== false).length > 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 2,
      title: 'Registreer je Vaste Lasten',
      description: 'Huur, energie, verzekeringen, abonnementen',
      icon: FileText,
      link: '/maandelijkselasten',
      isCompleted: allMonthlyCosts.filter(c => c.status === 'actief' || c.status === 'active' || c.is_active === true).length >= 3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      title: 'Voer Betaalachterstanden in',
      description: 'Een eerlijk beeld van je schulden',
      icon: CreditCard,
      link: '/debts',
      isCompleted: allDebts.length > 0 || user?.has_debts === false,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      id: 4,
      title: 'Verfijn VTLB-gegevens',
      description: 'Voor een nauwkeurige berekening',
      icon: Calculator,
      link: '/vtlbsettings',
      isCompleted: user?.vtlb_settings && Object.keys(user.vtlb_settings).length > 5,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 5,
      title: 'Richt je Potjes in',
      description: 'Verdeel je geld over verschillende doelen',
      icon: Wallet,
      link: '/potjes',
      isCompleted: allPots.length >= 3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 6,
      title: 'Doe je eerste Check-in',
      description: 'Controleer of alles betaald is',
      icon: ClipboardCheck,
      link: '/vasteLastencheck',
      isCompleted: false, // Dit kunnen we later verfijnen met MonthlyCheck entity
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  const completedSteps = steps.filter(s => s.isCompleted).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const currentStep = steps.find(s => !s.isCompleted) || steps[steps.length - 1];
  const allCompleted = completedSteps === steps.length;

  const handleDismiss = async () => {
    try {
      await User.updateMe({ startgids_dismissed: true });
      setIsDismissed(true);
      toast({
        title: 'Startgids verborgen',
        description: 'Je kunt de gids later terugvinden in Instellingen',
        variant: 'success'
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error dismissing startgids:', error);
      toast({
        title: 'Fout',
        description: 'Kon de gids niet verbergen',
        variant: 'destructive'
      });
    }
  };

  const handleGoToStep = (link) => {
    window.location.href = link;
  };

  // Toon widget niet als dismissed of als alles voltooid is
  if (isDismissed || allCompleted) {
    return null;
  }

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-lg mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Konsensi Startgids
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Laten we je financiën stap voor stap op orde brengen
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Voortgangsbalk */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Voortgang: {completedSteps} van {steps.length} stappen
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* Huidige stap - Prominent */}
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`${currentStep.bgColor} rounded-xl p-4 border-2 border-dashed ${currentStep.color.replace('text-', 'border-')}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${currentStep.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 border-2 ${currentStep.color.replace('text-', 'border-')}`}>
                  <StepIcon className={`w-6 h-6 ${currentStep.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">
                    Stap {currentStep.id}: {currentStep.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {currentStep.description}
                  </p>
                  <Button
                    onClick={() => handleGoToStep(currentStep.link)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Ga naar deze stap
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Alle stappen - Compact overzicht */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      step.isCompleted ? 'bg-white/50' : 'bg-white/30'
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${
                      step.isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Onderste balk - Overslaan optie */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
              <p className="text-xs text-gray-500">
                💡 Je kunt de gids terugvinden in Instellingen
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-600 hover:text-gray-800"
              >
                Overslaan
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default StartgidsWidget;