import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Medal,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/components/utils/formatters';

const ALL_ACHIEVEMENTS = {
  payments: [
    { id: 'first_payment', threshold: 1, icon: '🎯', title: 'Eerste Stap', description: 'Eerste betaling gedaan', xp: 50 },
    { id: 'five_payments', threshold: 5, icon: '⭐', title: 'Op Weg', description: '5 betalingen gedaan', xp: 100 },
    { id: 'ten_payments', threshold: 10, icon: '🌟', title: 'Volhouder', description: '10 betalingen gedaan', xp: 200 },
    { id: 'twentyfive_payments', threshold: 25, icon: '💪', title: 'Doorzetter', description: '25 betalingen gedaan', xp: 500 },
    { id: 'fifty_payments', threshold: 50, icon: '🏆', title: 'Kampioen', description: '50 betalingen gedaan', xp: 1000 },
    { id: 'hundred_payments', threshold: 100, icon: '👑', title: 'Legende', description: '100 betalingen gedaan', xp: 2000 },
  ],
  amounts: [
    { id: 'first_100', threshold: 100, icon: '💰', title: '€100 Club', description: '€100 totaal afgelost', xp: 75 },
    { id: 'first_500', threshold: 500, icon: '💎', title: 'Halfduizend', description: '€500 totaal afgelost', xp: 150 },
    { id: 'first_1000', threshold: 1000, icon: '🎖️', title: 'Duizendpoot', description: '€1.000 totaal afgelost', xp: 300 },
    { id: 'first_2500', threshold: 2500, icon: '🌟', title: 'Grote Sprongen', description: '€2.500 totaal afgelost', xp: 500 },
    { id: 'first_5000', threshold: 5000, icon: '🎊', title: 'High Roller', description: '€5.000 totaal afgelost', xp: 1000 },
    { id: 'first_10000', threshold: 10000, icon: '🚀', title: 'Tienduizend!', description: '€10.000 totaal afgelost', xp: 2000 },
  ],
  cleared: [
    { id: 'first_debt_cleared', threshold: 1, icon: '✅', title: 'Eerste Schuld Weg!', description: 'Eerste schuld volledig afbetaald', xp: 250 },
    { id: 'three_debts_cleared', threshold: 3, icon: '🎊', title: 'Drie-dubbel Succes', description: '3 schulden afbetaald', xp: 500 },
    { id: 'five_debts_cleared', threshold: 5, icon: '🏅', title: 'Schuldenvrij Expert', description: '5 schulden afbetaald', xp: 1000 },
  ],
  special: [
    { id: 'early_bird', icon: '🌅', title: 'Vroege Vogel', description: 'Betaling gedaan voor de 10e van de maand', xp: 50, special: true },
    { id: 'streak_7', icon: '🔥', title: 'Week Warrior', description: '7 dagen streak', xp: 100, special: true },
    { id: 'streak_30', icon: '💫', title: 'Maand Meester', description: '30 dagen streak', xp: 500, special: true },
    { id: 'all_clear', icon: '🎉', title: 'SCHULDENVRIJ!', description: 'Alle schulden afbetaald', xp: 5000, special: true },
  ]
};

export default function DebtAchievementsModal({ 
  isOpen, 
  onClose, 
  totalPaid = 0, 
  paymentCount = 0,
  clearedDebts = 0,
  allDebtsCleared = false,
  streak = 0
}) {
  const isUnlocked = (achievement, category) => {
    if (achievement.special) {
      switch (achievement.id) {
        case 'streak_7': return streak >= 7;
        case 'streak_30': return streak >= 30;
        case 'all_clear': return allDebtsCleared;
        default: return false;
      }
    }
    
    switch (category) {
      case 'payments': return paymentCount >= achievement.threshold;
      case 'amounts': return totalPaid >= achievement.threshold;
      case 'cleared': return clearedDebts >= achievement.threshold;
      default: return false;
    }
  };

  const getProgress = (achievement, category) => {
    if (achievement.special) return isUnlocked(achievement, category) ? 100 : 0;
    
    let current = 0;
    switch (category) {
      case 'payments': current = paymentCount; break;
      case 'amounts': current = totalPaid; break;
      case 'cleared': current = clearedDebts; break;
    }
    return Math.min((current / achievement.threshold) * 100, 100);
  };

  const totalUnlocked = Object.entries(ALL_ACHIEVEMENTS).reduce((sum, [category, achievements]) => {
    return sum + achievements.filter(a => isUnlocked(a, category)).length;
  }, 0);

  const totalAchievements = Object.values(ALL_ACHIEVEMENTS).flat().length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Alle Prestaties
            <Badge className="ml-2 bg-purple-500">
              {totalUnlocked}/{totalAchievements}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payments">Betalingen</TabsTrigger>
            <TabsTrigger value="amounts">Bedragen</TabsTrigger>
            <TabsTrigger value="cleared">Schulden Weg</TabsTrigger>
            <TabsTrigger value="special">Speciaal</TabsTrigger>
          </TabsList>

          {Object.entries(ALL_ACHIEVEMENTS).map(([category, achievements]) => (
            <TabsContent key={category} value={category} className="space-y-3 mt-4">
              {achievements.map((achievement, index) => {
                const unlocked = isUnlocked(achievement, category);
                const progress = getProgress(achievement, category);
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border-2 ${
                      unlocked 
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${
                        unlocked 
                          ? 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-2 border-yellow-400 shadow-lg' 
                          : 'bg-gray-200 border-2 border-gray-300'
                      }`}>
                        {unlocked ? achievement.icon : <Lock className="w-6 h-6 text-gray-400" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                            {achievement.title}
                          </span>
                          {unlocked && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className={`text-sm ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                          {achievement.description}
                        </p>
                        
                        {!unlocked && !achievement.special && (
                          <div className="mt-2">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-gray-400 mt-1">
                              {category === 'amounts' 
                                ? `${formatCurrency(totalPaid)} / ${formatCurrency(achievement.threshold)}`
                                : category === 'payments'
                                  ? `${paymentCount} / ${achievement.threshold}`
                                  : `${clearedDebts} / ${achievement.threshold}`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Badge className={unlocked ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'}>
                        +{achievement.xp} XP
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}