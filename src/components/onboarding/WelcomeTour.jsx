import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Trophy, Star, Target, TrendingUp } from "lucide-react";

export default function WelcomeTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
  {
    title: '🎉 Welkom bij Konsensi!',
    description: 'Start je journey naar money peace',
    content:
    <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-4xl">🚀</span>
                    </div>
                    <p className="text-gray-700 text-lg">Konsensi helpt je je financiën onder controle krijgen,
 zonder oordeel en op jouw tempo
      </p>
                    <p className="text-gray-600">
                        Laten we je laten zien hoe het werkt!
                    </p>
                </div>

  },
  {
    title: '🎮 Gamification',
    description: 'Verdien punten en badges',
    content:
    <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                                <Star className="w-8 h-8 text-white" fill="white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">Level Systeem</h3>
                                <p className="text-sm text-gray-600">Verdien XP en level up!</p>
                            </div>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Prestaties behalen
                            </li>
                            <li className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-500" />
                                Dagelijkse streaks opbouwen
                            </li>
                            <li className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                XP verdienen met elke actie
                            </li>
                        </ul>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Elke stap die je zet wordt beloond met XP en badges. Hoe actiever je bent, hoe sneller je level stijgt!
                    </p>
                </div>

  },
  {
    title: '📊 Dashboard',
    description: 'Je financiële overzicht',
    content:
    <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2">💰 Inkomsten & Uitgaven</h4>
                        <p className="text-sm text-gray-700">
                            Houd je maandelijkse inkomsten en uitgaven bij voor een compleet overzicht.
                        </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-gray-900 mb-2">🏺 Spaarpotjes</h4>
                        <p className="text-sm text-gray-700">
                            Organiseer je geld in verschillende potjes voor specifieke doelen.
                        </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <h4 className="font-semibold text-gray-900 mb-2">💳 Schulden Beheer</h4>
                        <p className="text-sm text-gray-700">
                            Krijg controle over je schulden met strategieën en betalingsplannen.
                        </p>
                    </div>
                </div>

  },
  {
    title: '🤖 AI Assistent',
    description: 'Persoonlijke financiële tips',
    content:
    <div className="space-y-4">
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-6 border-2 border-cyan-200">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl">🤖</span>
                            <div>
                                <h3 className="font-bold text-xl text-gray-900">YO-L Budget Coach</h3>
                                <p className="text-sm text-gray-600">Je persoonlijke assistent</p>
                            </div>
                        </div>
                        <p className="text-gray-700 mb-3">
                            Stel vragen, krijg advies en laat je begeleiden bij financiële beslissingen.
                        </p>
                        <div className="bg-white rounded-lg p-3 border border-cyan-200">
                            <p className="text-sm text-gray-600 italic">
                                "Hoe kan ik €100 per maand besparen?"
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-600 text-sm">
                        De AI-coach analyseert je situatie en geeft gepersonaliseerde tips op basis van jouw data.
                    </p>
                </div>

  },
  {
    title: '🎯 Je Actieplan',
    description: 'Volg deze stappen',
    content:
    <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-300">
                        <h3 className="font-bold text-xl text-gray-900 mb-4">Start vandaag nog! 🚀</h3>
                        <ol className="space-y-3">
                            {[
          { num: 1, text: 'Voeg je inkomen toe', icon: '💰' },
          { num: 2, text: 'Registreer je vaste lasten', icon: '🏠' },
          { num: 3, text: 'Maak je eerste potje', icon: '🏺' },
          { num: 4, text: 'Bekijk je Cent voor Cent rapport', icon: '📊' },
          { num: 5, text: 'Behaal je eerste prestatie!', icon: '🏆' }].
          map((step) =>
          <li key={step.num} className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                        {step.num}
                                    </div>
                                    <span className="text-gray-700">{step.icon} {step.text}</span>
                                </li>
          )}
                        </ol>
                    </div>
                </div>

  }];


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">

                    <X className="h-4 w-4" />
                </button>

                <AnimatePresence mode="wait">
                    <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="pt-6">

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {steps[currentStep].title}
                            </h2>
                            <p className="text-gray-600">{steps[currentStep].description}</p>
                        </div>

                        <div className="mb-6">
                            {steps[currentStep].content}
                        </div>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 mb-6">
                            {steps.map((_, index) =>
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                index === currentStep ?
                'w-8 bg-green-500' :
                'w-2 bg-gray-300'}`
                } />

              )}
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex justify-between items-center gap-4">
                            {currentStep > 0 ? (
                                <Button
                                    variant="outline"
                                    onClick={handlePrev}
                                    className="gap-2">
                                    <ChevronLeft className="w-4 h-4" />
                                    Vorige
                                </Button>
                            ) : (
                                <div></div>
                            )}

                            <span className="text-sm text-gray-500">
                                {currentStep + 1} / {steps.length}
                            </span>

                            <Button
                                onClick={handleNext}
                                className="gap-2 bg-green-500 hover:bg-green-600">
                                {currentStep === steps.length - 1 ? 'Start!' : 'Volgende'}
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </DialogContent>
        </Dialog>);

}