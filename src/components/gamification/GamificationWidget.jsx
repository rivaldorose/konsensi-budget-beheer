import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, TrendingUp, Award, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "@/api/entities";
import { UserProgress } from "@/api/entities";
import { Achievement } from "@/api/entities";
import { Challenge } from "@/api/entities";
import { checkAchievements } from "@/api/functions";
import { useToast } from "@/components/ui/use-toast";

export default function GamificationWidget({ compact = false, onViewAll }) {
    const [progress, setProgress] = useState(null);
    const [recentAchievements, setRecentAchievements] = useState([]);
    const [weeklyChallenge, setWeeklyChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadProgress();
        loadWeeklyChallenge();
        checkAchievements();
    }, []);

    const loadProgress = async () => {
        try {
            const user = await User.me();
            if (!user) return;
            const progressRecords = await UserProgress.filter({ 
                created_by: user.email 
            });

            if (progressRecords.length > 0) {
                setProgress(progressRecords[0]);
            }

            // Load recent achievements (last 3)
            const allAchievements = await Achievement.filter({ created_by: user.email });
            const recentAchievements = allAchievements
                .filter(a => a.is_unlocked)
                .sort((a, b) => new Date(b.unlocked_at || 0) - new Date(a.unlocked_at || 0))
                .slice(0, 3);
            setRecentAchievements(recentAchievements);
        } catch (error) {
            console.error('Error loading progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWeeklyChallenge = async () => {
        try {
            const user = await User.me();
            if (!user) return;
            const challenges = await Challenge.filter(
                { 
                    created_by: user.email,
                    status: 'active',
                    type: 'weekly'
                }
            ).then(challenges => challenges
                .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
                .slice(0, 1)
            );

            if (challenges.length > 0) {
                setWeeklyChallenge(challenges[0]);
            } else {
                // Create a new weekly challenge
                await createWeeklyChallenge(user);
            }
        } catch (error) {
            console.error('Error loading weekly challenge:', error);
        }
    };

    const createWeeklyChallenge = async (user) => {
        try {
            const challenges = [
                { goal_type: 'save_amount', title: '💰 Spaar €50 deze week', description: 'Zet €50 opzij in je spaarpotjes', target_value: 50, icon: '💰', xp_reward: 150 },
                { goal_type: 'log_transactions', title: '📝 Log 10 transacties', description: 'Houd 10 uitgaven bij deze week', target_value: 10, icon: '📝', xp_reward: 100 },
                { goal_type: 'reduce_spending', title: '🎯 Bespaar €30', description: 'Geef €30 minder uit dan vorige week', target_value: 30, icon: '🎯', xp_reward: 200 },
                { goal_type: 'check_in', title: '✅ Check-in streak', description: 'Log elke dag in deze week', target_value: 7, icon: '✅', xp_reward: 120 }
            ];

            const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
            
            const today = new Date();
            const endOfWeek = new Date(today);
            endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

            const newChallenge = await Challenge.create({
                ...randomChallenge,
                type: 'weekly',
                start_date: today.toISOString().split('T')[0],
                end_date: endOfWeek.toISOString().split('T')[0],
                status: 'active',
                current_value: 0
            });

            setWeeklyChallenge(newChallenge);
        } catch (error) {
            console.error('Error creating weekly challenge:', error);
        }
    };

    const checkAchievements = async () => {
        setChecking(true);
        try {
            const response = await checkAchievements({});
            
            if (response.success) {
                const { newAchievements, progress: updatedProgress } = response;
                
                // Update progress
                setProgress(updatedProgress);

                // Show notifications for new achievements
                if (newAchievements && newAchievements.length > 0) {
                    setShowCelebration(true);
                    
                    newAchievements.forEach((achievement, index) => {
                        setTimeout(() => {
                            toast({
                                title: `🏆 ${achievement.title}`,
                                description: `${achievement.description} (+${achievement.xp_reward} XP)`,
                                duration: 5000,
                            });
                        }, index * 1000);
                    });

                    // Reload achievements to show new ones
                    setTimeout(() => {
                        loadProgress();
                        setShowCelebration(false);
                    }, 3000);
                }
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
        } finally {
            setChecking(false);
        }
    };

    if (loading || !progress) {
        return (
            <Card className={compact ? "" : "h-full"}>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const xpPercentage = (progress.current_level_xp / progress.xp_to_next_level) * 100;

    if (compact) {
        return (
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <Star className="w-5 h-5 text-white" fill="white" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800">Level {progress.level}</p>
                                <p className="text-xs text-gray-600">{progress.total_xp} XP</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-orange-500" />
                                {progress.streak_days}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Trophy className="w-3 h-3 text-yellow-500" />
                                {progress.achievements_unlocked}
                            </Badge>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Progress value={xpPercentage} className="h-2" />
                        <p className="text-xs text-gray-600 text-center">
                            {progress.current_level_xp} / {progress.xp_to_next_level} XP
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-purple-200">
                <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-purple-600" />
                            Je Voortgang
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowInfoModal(true);
                                }}
                                className="p-1 rounded-full hover:bg-purple-100 text-purple-400 hover:text-purple-600 transition-colors"
                                title="Uitleg"
                            >
                                <HelpCircle className="w-4 h-4" />
                            </button>
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                        </Button>
                    </div>
                </CardHeader>

                {/* COLLAPSED VIEW - Alleen niveau en XP bar */}
                {!isExpanded && (
                    <CardContent className="space-y-4 pb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                    <Star className="w-7 h-7 text-white" fill="white" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">Level {progress.level}</p>
                                    <p className="text-sm text-gray-600">{progress.total_xp} totaal XP</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-orange-500" />
                                    {progress.streak_days}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-yellow-500" />
                                    {progress.achievements_unlocked}
                                </Badge>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Naar Level {progress.level + 1}</span>
                                <span>{progress.current_level_xp} / {progress.xp_to_next_level} XP</span>
                            </div>
                            <Progress value={xpPercentage} className="h-3" />
                        </div>
                    </CardContent>
                )}

                {/* EXPANDED VIEW - Volledige details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CardContent className="space-y-6">
                                {/* Level & XP */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                                                <Star className="w-7 h-7 text-white" fill="white" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-gray-800">Level {progress.level}</p>
                                                <p className="text-sm text-gray-600">{progress.total_xp} totaal XP</p>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={checkAchievements} 
                                            disabled={checking}
                                            variant="outline"
                                            size="sm"
                                        >
                                            {checking ? '⏳' : '🔄'} Check
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Naar Level {progress.level + 1}</span>
                                            <span>{progress.current_level_xp} / {progress.xp_to_next_level} XP</span>
                                        </div>
                                        <Progress value={xpPercentage} className="h-3" />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-3 border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Zap className="w-4 h-4 text-orange-500" />
                                            <span className="text-xs text-gray-600">Streak</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800">{progress.streak_days}</p>
                                        <p className="text-xs text-gray-500">dagen 🔥</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Award className="w-4 h-4 text-yellow-500" />
                                            <span className="text-xs text-gray-600">Prestaties</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800">{progress.achievements_unlocked}</p>
                                        <p className="text-xs text-gray-500">behaald 🏆</p>
                                    </div>
                                </div>

                                {/* Weekly Challenge */}
                                {weeklyChallenge && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-yellow-500" />
                                            Uitdaging van de Week
                                        </h4>
                                        <motion.div
                                            whileHover={{ scale: 1.02 }}
                                            className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-300"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <span className="text-3xl">{weeklyChallenge.icon}</span>
                                                <div className="flex-1">
                                                    <h5 className="font-bold text-gray-900">{weeklyChallenge.title}</h5>
                                                    <p className="text-sm text-gray-600 mt-1">{weeklyChallenge.description}</p>
                                                </div>
                                                <Badge className="bg-yellow-500 text-white">
                                                    +{weeklyChallenge.xp_reward} XP
                                                </Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Voortgang</span>
                                                    <span className="font-semibold text-gray-800">
                                                        {weeklyChallenge.current_value} / {weeklyChallenge.target_value}
                                                    </span>
                                                </div>
                                                <Progress 
                                                    value={(weeklyChallenge.current_value / weeklyChallenge.target_value) * 100} 
                                                    className="h-2 bg-yellow-100"
                                                />
                                                <p className="text-xs text-gray-500 text-right">
                                                    Eindigt {new Date(weeklyChallenge.end_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                                {/* Recent Achievements */}
                                {recentAchievements.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Behaald</h4>
                                        <div className="space-y-2">
                                            {recentAchievements.map((achievement) => (
                                                <motion.div
                                                    key={achievement.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow"
                                                >
                                                    <span className="text-2xl">{achievement.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">
                                                            {achievement.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 truncate">
                                                            {achievement.description}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" />
                                                        +{achievement.xp_reward}
                                                    </Badge>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Longest Streak Info */}
                                {progress.longest_streak > 0 && (
                                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
                                        <p className="text-xs text-orange-800 font-medium mb-1">🔥 Beste Streak</p>
                                        <p className="text-lg font-bold text-orange-900">{progress.longest_streak} dagen</p>
                                    </div>
                                )}

                                {/* View All Button */}
                                {onViewAll && (
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewAll();
                                        }}
                                        variant="outline"
                                        className="w-full"
                                        size="sm"
                                    >
                                        <Trophy className="w-4 h-4 mr-2" />
                                        Bekijk alle prestaties
                                    </Button>
                                )}
                            </CardContent>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            {/* Celebration Animation */}
            <AnimatePresence>
                {showCelebration && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="text-9xl">🎉</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Info Modal */}
            <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-purple-600" />
                            Hoe werkt Voortgang?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                            <p className="text-sm text-purple-800">
                                🎮 Verdien punten (XP) door goed met je geld om te gaan en stijg in level!
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Star className="w-4 h-4 text-yellow-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">Levels & XP</h4>
                                    <p className="text-xs text-gray-600">Hoe meer XP je verdient, hoe hoger je level wordt.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">Streak</h4>
                                    <p className="text-xs text-gray-600">Log elke dag in om je streak te behouden. Hoe langer, hoe beter!</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Award className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">Prestaties</h4>
                                    <p className="text-xs text-gray-600">Behaal mijlpalen en unlock badges voor extra XP.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs text-green-800">
                                💡 <strong>XP verdienen:</strong> Check-ins, betalingen doen, schulden aflossen en potjes vullen levert allemaal XP op!
                            </p>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">🎁</span>
                                <h4 className="font-semibold text-amber-900 text-sm">Wat kun je met punten doen?</h4>
                            </div>
                            <p className="text-xs text-amber-800">
                                Dit is nog een verrassing! We werken aan leuke beloningen die je kunt unlocken met je XP. Blijf punten verzamelen... 👀✨
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}