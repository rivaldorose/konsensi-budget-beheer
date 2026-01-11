import React, { useState, useEffect } from 'react';
import { Challenge } from '@/api/entities';
import { User } from '@/api/entities';
import { formatCurrency } from '@/components/utils/formatters';
import { useToast } from '@/components/ui/use-toast';

const CHALLENGE_TEMPLATES = [
  {
    title: 'Eerste Betaling',
    description: 'Doe deze week een betaling op een schuld',
    goal_type: 'clear_debt',
    target_value: 1,
    xp_reward: 75,
    challenge_type: 'weekly'
  },
  {
    title: 'Consistent Aflosser',
    description: 'Doe 3 betalingen deze maand',
    goal_type: 'clear_debt',
    target_value: 3,
    xp_reward: 150,
    challenge_type: 'monthly'
  },
  {
    title: 'Extra Aflossing',
    description: 'Los €50 extra af bovenop je reguliere betalingen',
    goal_type: 'save_amount',
    target_value: 50,
    xp_reward: 100,
    challenge_type: 'weekly'
  },
  {
    title: 'Check-in Streak',
    description: 'Check 5 dagen je schulden overzicht',
    goal_type: 'check_in',
    target_value: 5,
    xp_reward: 50,
    challenge_type: 'weekly'
  },
  {
    title: 'Grote Stap',
    description: 'Los €200 af deze maand',
    goal_type: 'save_amount',
    target_value: 200,
    xp_reward: 250,
    challenge_type: 'monthly'
  }
];

export default function DebtChallengesWidget({
  currentMonthPaid = 0,
  paymentCountThisMonth = 0,
  onChallengeComplete
}) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const user = await User.me();
      const userChallenges = await Challenge.filter({
        created_by: user.email,
        status: 'active'
      });

      // If no active challenges, create some
      if (userChallenges.length === 0) {
        await generateNewChallenges();
      } else {
        // Update progress on existing challenges
        const updatedChallenges = userChallenges.map(c => ({
          ...c,
          current_value: calculateProgress(c)
        }));
        setChallenges(updatedChallenges);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (challenge) => {
    switch (challenge.goal_type) {
      case 'clear_debt':
        return paymentCountThisMonth;
      case 'save_amount':
        return currentMonthPaid;
      case 'check_in':
        return challenge.current_value || 0;
      default:
        return challenge.current_value || 0;
    }
  };

  const generateNewChallenges = async () => {
    try {
      const today = new Date();
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Pick 2-3 random challenges
      const shuffled = [...CHALLENGE_TEMPLATES].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 3);

      const newChallenges = [];
      for (const template of selected) {
        if (!template) continue;
        const challengeType = template.challenge_type || 'weekly';
        const challenge = await Challenge.create({
          title: template.title,
          description: template.description,
          goal_type: template.goal_type,
          target_value: template.target_value,
          xp_reward: template.xp_reward,
          type: challengeType,
          start_date: today.toISOString().split('T')[0],
          end_date: challengeType === 'weekly'
            ? endOfWeek.toISOString().split('T')[0]
            : endOfMonth.toISOString().split('T')[0],
          current_value: 0,
          status: 'active'
        });
        newChallenges.push(challenge);
      }

      setChallenges(newChallenges);
      toast({ title: 'Nieuwe uitdagingen beschikbaar!' });
    } catch (error) {
      console.error('Error generating challenges:', error);
    }
  };

  const handleCompleteChallenge = async (challenge) => {
    try {
      await Challenge.update(challenge.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      toast({
        title: 'Uitdaging voltooid!',
        description: `+${challenge.xp_reward} XP verdiend!`
      });

      if (onChallengeComplete) {
        onChallengeComplete(challenge);
      }

      loadChallenges();
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getChallengeIcon = (goalType) => {
    switch (goalType) {
      case 'clear_debt':
        return 'check_circle';
      case 'save_amount':
        return 'savings';
      case 'check_in':
        return 'visibility';
      default:
        return 'flag';
    }
  };

  const getChallengeColor = (index) => {
    const colors = [
      { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-500', border: 'border-emerald-200 dark:border-emerald-500/30' },
      { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-200 dark:border-blue-500/30' },
      { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-500', border: 'border-purple-200 dark:border-purple-500/30' }
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-[#2a2a2a] rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 dark:bg-[#2a2a2a] rounded-xl"></div>
          <div className="h-24 bg-gray-200 dark:bg-[#2a2a2a] rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-[24px] p-6 shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-500 text-[20px]">flag</span>
          </div>
          <h3 className="font-semibold text-lg text-[#1F2937] dark:text-white">Actieve Uitdagingen</h3>
        </div>

        <button
          onClick={generateNewChallenges}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
          title="Nieuwe uitdagingen"
        >
          <span className="material-symbols-outlined text-gray-500 dark:text-[#a1a1a1] text-[20px]">refresh</span>
        </button>
      </div>

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <div className="text-center py-8">
          <div className="size-16 rounded-full bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-gray-400 dark:text-[#a1a1a1] text-[32px]">flag</span>
          </div>
          <p className="text-gray-500 dark:text-[#a1a1a1] mb-4">Geen actieve uitdagingen</p>
          <button
            onClick={generateNewChallenges}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2 mx-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Genereer Uitdagingen
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {challenges.filter(c => c && c.id).map((challenge, index) => {
            const progress = challenge.target_value > 0 ? (challenge.current_value / challenge.target_value) * 100 : 0;
            const isComplete = progress >= 100;
            const daysLeft = getDaysRemaining(challenge.end_date);
            const color = getChallengeColor(index);

            return (
              <div
                key={challenge.id}
                className={`rounded-2xl p-4 border transition-all ${
                  isComplete
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-gray-50 dark:bg-[#0a0a0a] border-gray-100 dark:border-[#2a2a2a]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`size-10 rounded-xl ${color.bg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${color.text} text-[20px]`}>
                      {getChallengeIcon(challenge.goal_type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#1F2937] dark:text-white text-sm">{challenge.title}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-[#2a2a2a] text-gray-600 dark:text-[#a1a1a1]">
                        {(challenge.type || 'weekly') === 'weekly' ? 'Week' : 'Maand'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-[#a1a1a1] mb-3">{challenge.description}</p>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? 'bg-emerald-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-[#a1a1a1] whitespace-nowrap">
                        {challenge.goal_type === 'save_amount'
                          ? `${formatCurrency(challenge.current_value)}/${formatCurrency(challenge.target_value)}`
                          : `${Math.min(challenge.current_value, challenge.target_value)}/${challenge.target_value}`
                        }
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-[#a1a1a1]">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {daysLeft} dagen over
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          +{challenge.xp_reward} XP
                        </span>
                        {isComplete && (
                          <button
                            onClick={() => handleCompleteChallenge(challenge)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Claim
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
