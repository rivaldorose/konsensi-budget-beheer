import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Lock, TrendingUp, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function AchievementsModal({ isOpen, onClose }) {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (isOpen) {
            loadAchievements();
        }
    }, [isOpen]);

    const loadAchievements = async () => {
        setLoading(true);
        try {
            const user = await base44.auth.me();
            const allAchievements = await base44.entities.Achievement.filter({ 
                created_by: user.email 
            }, '-unlocked_at');
            
            setAchievements(allAchievements);
        } catch (error) {
            console.error('Error loading achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', 'income', 'expenses', 'debts', 'savings', 'pots', 'general'];
    
    const filteredAchievements = filter === 'all' 
        ? achievements 
        : achievements.filter(a => a.category === filter);

    const unlockedCount = achievements.filter(a => a.is_unlocked).length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        Prestaties
                        <Badge variant="secondary" className="ml-2">
                            {unlockedCount} / {achievements.length}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={filter} onValueChange={setFilter}>
                    <TabsList className="grid grid-cols-7 w-full">
                        {categories.map(cat => (
                            <TabsTrigger key={cat} value={cat} className="text-xs">
                                {cat === 'all' ? 'Alles' : cat}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="mt-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-purple-400 mx-auto"></div>
                            </div>
                        ) : filteredAchievements.length === 0 ? (
                            <div className="text-center py-12">
                                <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">Nog geen prestaties in deze categorie</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredAchievements.map((achievement, index) => (
                                    <motion.div
                                        key={achievement.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: achievement.is_unlocked ? 1.03 : 1.01 }}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            achievement.is_unlocked
                                                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 hover:shadow-lg'
                                                : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-80'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="relative">
                                                <div className={`text-4xl ${!achievement.is_unlocked && 'grayscale opacity-40'}`}>
                                                    {achievement.icon}
                                                </div>
                                                {achievement.is_unlocked && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -180 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                                                        className="absolute -top-1 -right-1"
                                                    >
                                                        <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                    </motion.div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="font-bold text-gray-900">{achievement.title}</h4>
                                                    {achievement.is_unlocked && (
                                                        <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            {achievement.xp_reward} XP
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    {achievement.description}
                                                </p>
                                                {achievement.is_unlocked ? (
                                                    <div className="flex items-center gap-2">
                                                        <Trophy className="w-4 h-4 text-yellow-600" />
                                                        <p className="text-xs text-green-600 font-medium">
                                                            Behaald op {new Date(achievement.unlocked_at).toLocaleDateString('nl-NL')}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Lock className="w-3 h-3 text-gray-400" />
                                                        <p className="text-xs text-gray-500">Nog niet behaald</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </Tabs>

                <div className="flex justify-end mt-6">
                    <Button onClick={onClose}>Sluiten</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}