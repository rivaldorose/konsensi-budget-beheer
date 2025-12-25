import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Challenge } from '@/api/entities';
import { User } from '@/api/entities';
import { 
  Target, 
  Clock, 
  Zap,
  CheckCircle2,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/components/utils/formatters';
import { useToast } from '@/components/ui/use-toast';

const CHALLENGE_TEMPLATES = [
  {
    title: 'Eerste Betaling',
    description: 'Doe deze week een betaling op een schuld',
    goal_type: 'clear_debt',
    target_value: 1,
    xp_reward: 75,
    icon: '🎯',
    challenge_type: 'weekly'
  },
  {
    title: 'Consistent Aflosser',
    description: 'Doe 3 betalingen deze maand',
    goal_type: 'clear_debt',
    target_value: 3,
    xp_reward: 150,
    icon: '📅',
    challenge_type: 'monthly'
  },
  {
    title: 'Extra Aflossing',
    description: 'Los €50 extra af bovenop je reguliere betalingen',
    goal_type: 'save_amount',
    target_value: 50,
    xp_reward: 100,
    icon: '💪',
    challenge_type: 'weekly'
  },
  {
    title: 'Check-in Streak',
    description: 'Check 5 dagen je schulden overzicht',
    goal_type: 'check_in',
    target_value: 5,
    xp_reward: 50,
    icon: '🔥',
    challenge_type: 'weekly'
  },
  {
    title: 'Grote Stap',
    description: 'Los €200 af deze maand',
    goal_type: 'save_amount',
    target_value: 200,
    xp_reward: 250,
    icon: '🚀',
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
          icon: template.icon,
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
      toast({ title: '🎯 Nieuwe uitdagingen beschikbaar!' });
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
        title: '🎉 Uitdaging voltooid!',
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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-blue-600" />
            Actieve Uitdagingen
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={generateNewChallenges}
            className="text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Nieuwe
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {challenges.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">Geen actieve uitdagingen</p>
            <Button onClick={generateNewChallenges} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Genereer Uitdagingen
            </Button>
          </div>
        ) : (
          challenges.filter(c => c && c.id).map((challenge, index) => {
            const progress = challenge.target_value > 0 ? (challenge.current_value / challenge.target_value) * 100 : 0;
            const isComplete = progress >= 100;
            const daysLeft = getDaysRemaining(challenge.end_date);
            
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl p-4 border ${isComplete ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{challenge.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{challenge.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {(challenge.type || 'weekly') === 'weekly' ? 'Week' : 'Maand'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                    
                    <div className="flex items-center gap-2">
                      <Progress value={Math.min(progress, 100)} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-gray-600">
                        {challenge.goal_type === 'save_amount' 
                          ? `${formatCurrency(challenge.current_value)}/${formatCurrency(challenge.target_value)}`
                          : `${Math.min(challenge.current_value, challenge.target_value)}/${challenge.target_value}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {daysLeft} dagen over
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700">
                          <Zap className="w-3 h-3 mr-1" />
                          +{challenge.xp_reward} XP
                        </Badge>
                        {isComplete && (
                          <Button 
                            size="sm" 
                            className="h-7 bg-green-500 hover:bg-green-600"
                            onClick={() => handleCompleteChallenge(challenge)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Claim
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}