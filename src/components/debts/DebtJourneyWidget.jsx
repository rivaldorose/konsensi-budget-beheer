import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Flame, 
  Star, 
  Gift,
  ChevronRight,
  Sparkles,
  Medal,
  Crown,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/components/utils/formatters';

const DEBT_MILESTONES = [
  { id: 'first_payment', threshold: 1, icon: '🎯', title: 'Eerste Stap', description: 'Eerste betaling gedaan', xp: 50 },
  { id: 'five_payments', threshold: 5, icon: '⭐', title: 'Op Weg', description: '5 betalingen gedaan', xp: 100 },
  { id: 'ten_payments', threshold: 10, icon: '🌟', title: 'Volhouder', description: '10 betalingen gedaan', xp: 200 },
  { id: 'twentyfive_payments', threshold: 25, icon: '💪', title: 'Doorzetter', description: '25 betalingen gedaan', xp: 500 },
  { id: 'fifty_payments', threshold: 50, icon: '🏆', title: 'Kampioen', description: '50 betalingen gedaan', xp: 1000 },
];

const AMOUNT_MILESTONES = [
  { id: 'first_100', threshold: 100, icon: '💰', title: '€100 Afgelost', xp: 75 },
  { id: 'first_500', threshold: 500, icon: '💎', title: '€500 Afgelost', xp: 150 },
  { id: 'first_1000', threshold: 1000, icon: '🎖️', title: '€1.000 Afgelost', xp: 300 },
  { id: 'first_2500', threshold: 2500, icon: '👑', title: '€2.500 Afgelost', xp: 500 },
  { id: 'first_5000', threshold: 5000, icon: '🌈', title: '€5.000 Afgelost', xp: 1000 },
  { id: 'first_10000', threshold: 10000, icon: '🚀', title: '€10.000 Afgelost', xp: 2000 },
];

const DEBT_CLEARED_MILESTONES = [
  { id: 'first_debt_cleared', threshold: 1, icon: '✅', title: 'Eerste Schuld Weg!', xp: 250 },
  { id: 'three_debts_cleared', threshold: 3, icon: '🎊', title: 'Drie-dubbel Succes', xp: 500 },
  { id: 'five_debts_cleared', threshold: 5, icon: '🏅', title: 'Schuldenvrij Expert', xp: 1000 },
  { id: 'all_debts_cleared', threshold: -1, icon: '🎉', title: 'SCHULDENVRIJ!', xp: 5000 },
];

export default function DebtJourneyWidget({ 
  debts = [], 
  totalPaid = 0, 
  paymentCount = 0,
  onViewAll 
}) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);
  
  const totalDebt = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const clearedDebts = debts.filter(d => d.status === 'afbetaald').length;
  const activeDebts = debts.filter(d => d.status !== 'afbetaald').length;
  const overallProgress = totalDebt > 0 ? (totalPaid / totalDebt) * 100 : 0;
  
  // Calculate unlocked milestones
  const unlockedPaymentMilestones = DEBT_MILESTONES.filter(m => paymentCount >= m.threshold);
  const unlockedAmountMilestones = AMOUNT_MILESTONES.filter(m => totalPaid >= m.threshold);
  const unlockedClearedMilestones = DEBT_CLEARED_MILESTONES.filter(m => 
    m.threshold === -1 ? (activeDebts === 0 && debts.length > 0) : clearedDebts >= m.threshold
  );
  
  const totalUnlocked = unlockedPaymentMilestones.length + unlockedAmountMilestones.length + unlockedClearedMilestones.length;
  const totalMilestones = DEBT_MILESTONES.length + AMOUNT_MILESTONES.length + DEBT_CLEARED_MILESTONES.length;
  
  // Calculate total XP
  const totalXP = [
    ...unlockedPaymentMilestones,
    ...unlockedAmountMilestones,
    ...unlockedClearedMilestones
  ].reduce((sum, m) => sum + m.xp, 0);
  
  // Determine level (every 500 XP = 1 level)
  const level = Math.floor(totalXP / 500) + 1;
  const xpInLevel = totalXP % 500;
  const xpToNextLevel = 500;
  
  // Next milestone to unlock
  const nextPaymentMilestone = DEBT_MILESTONES.find(m => paymentCount < m.threshold);
  const nextAmountMilestone = AMOUNT_MILESTONES.find(m => totalPaid < m.threshold);
  
  // Streak calculation (simplified - based on payments in last 30 days)
  const getStreak = () => {
    // This would need actual payment dates, simplified for now
    return Math.min(paymentCount, 7);
  };
  const streak = getStreak();

  const getLevelTitle = (lvl) => {
    if (lvl >= 20) return 'Schuldenvrij Meester';
    if (lvl >= 15) return 'Financieel Expert';
    if (lvl >= 10) return 'Aflos Kampioen';
    if (lvl >= 5) return 'Gedisciplineerde Betaler';
    if (lvl >= 3) return 'Actieve Aflosser';
    return 'Beginner';
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 border-2 border-purple-200 overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-purple-600" />
            Jouw Aflos Journey
          </CardTitle>
          {streak > 0 && (
            <Badge className="bg-orange-500 text-white flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {streak} dagen streak
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Level & XP Progress */}
        <div className="bg-white/70 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {level}
                </div>
                {level >= 5 && (
                  <Crown className="w-5 h-5 text-yellow-500 absolute -top-1 -right-1" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">{getLevelTitle(level)}</p>
                <p className="text-sm text-gray-600">{totalXP} XP totaal</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Volgend level</p>
              <p className="font-bold text-purple-600">{xpToNextLevel - xpInLevel} XP</p>
            </div>
          </div>
          <Progress value={(xpInLevel / xpToNextLevel) * 100} className="h-2 bg-purple-100" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <motion.div 
            className="bg-white/70 rounded-lg p-3 text-center border border-green-100"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-600">Afgelost</p>
          </motion.div>
          <motion.div 
            className="bg-white/70 rounded-lg p-3 text-center border border-blue-100"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-blue-600">{paymentCount}</p>
            <p className="text-xs text-gray-600">Betalingen</p>
          </motion.div>
          <motion.div 
            className="bg-white/70 rounded-lg p-3 text-center border border-purple-100"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-2xl font-bold text-purple-600">{clearedDebts}</p>
            <p className="text-xs text-gray-600">Schulden weg</p>
          </motion.div>
        </div>

        {/* Overall Progress */}
        <div className="bg-white/70 rounded-xl p-4 border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Totale Voortgang</span>
            <span className="text-sm font-bold text-green-600">{overallProgress.toFixed(0)}%</span>
          </div>
          <div className="relative">
            <Progress value={Math.min(overallProgress, 100)} className="h-4 bg-gray-100" />
            {/* Milestone markers */}
            <div className="absolute top-0 left-0 right-0 h-4 flex items-center">
              {[25, 50, 75, 100].map((milestone) => (
                <div 
                  key={milestone}
                  className="absolute w-1 h-4 bg-gray-300"
                  style={{ left: `${milestone}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Start</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>🎉</span>
          </div>
        </div>

        {/* Recent Badges */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Medal className="w-4 h-4" />
              Behaalde Badges ({totalUnlocked}/{totalMilestones})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...unlockedPaymentMilestones, ...unlockedAmountMilestones, ...unlockedClearedMilestones]
              .slice(-6)
              .map((milestone) => (
                <motion.div
                  key={milestone.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="group relative"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-400 flex items-center justify-center text-lg shadow-sm cursor-pointer hover:scale-110 transition-transform">
                    {milestone.icon}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {milestone.title}
                  </div>
                </motion.div>
              ))}
            {totalUnlocked === 0 && (
              <p className="text-sm text-gray-500 italic">Doe je eerste betaling om badges te verdienen!</p>
            )}
          </div>
        </div>

        {/* Next Milestone */}
        {(nextPaymentMilestone || nextAmountMilestone) && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-2xl border-2 border-dashed border-purple-300">
                {nextAmountMilestone?.icon || nextPaymentMilestone?.icon || '🎯'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {nextAmountMilestone?.title || nextPaymentMilestone?.title}
                </p>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={nextAmountMilestone 
                      ? (totalPaid / nextAmountMilestone.threshold) * 100
                      : (paymentCount / nextPaymentMilestone.threshold) * 100
                    } 
                    className="h-2 flex-1 bg-white/50" 
                  />
                  <span className="text-xs font-medium text-purple-600">
                    +{nextAmountMilestone?.xp || nextPaymentMilestone?.xp} XP
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Button */}
        {onViewAll && (
          <Button 
            variant="outline" 
            className="w-full border-purple-200 hover:bg-purple-50"
            onClick={onViewAll}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Bekijk alle prestaties
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
      </CardContent>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && celebrationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-4">{celebrationData.icon}</div>
              <h2 className="text-2xl font-bold mb-2">{celebrationData.title}</h2>
              <p className="text-gray-600 mb-4">{celebrationData.description}</p>
              <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                +{celebrationData.xp} XP
              </Badge>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}