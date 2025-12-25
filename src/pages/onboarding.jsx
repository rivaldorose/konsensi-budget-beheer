
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { createPageUrl } from "@/utils";

const incomeSourceOptions = [
  { value: "vast_salaris", label: "💼 Vast salaris" },
  { value: "freelance", label: "💻 Freelance/Zzp" },
  { value: "stufi", label: "🎓 Studiefinanciering" },
  { value: "meerdere", label: "🤝 Meerdere bronnen" },
  { value: "anders", label: "💰 Anders" }
];

const debtCountRanges = [
  { value: "1-2", label: "1-2 schulden" },
  { value: "3-5", label: "3-5 schulden" },
  { value: "6-10", label: "6-10 schulden" },
  { value: "10+", label: "Meer dan 10" },
  { value: "unknown", label: "Weet ik niet precies" }
];

function OnboardingContent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [userData, setUserData] = useState({
    voornaam: '',
    age: '',
    monthly_income: '',
    income_source: '',
    monthly_expenses: '',
    has_debts: null,
    total_debt_amount: '',
    debt_count_range: ''
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const user = await User.me();
      
      if (user.onboarding_completed) {
        window.location.href = createPageUrl('Dashboard');
        return;
      }

      if (user.onboarding_step) {
        setStep(user.onboarding_step);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error checking onboarding:", error);
      setLoading(false);
    }
  };

  const saveProgress = async (currentStep) => {
    try {
      await User.updateMyUserData({
        onboarding_step: currentStep
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleSkip = async () => {
    const nextStep = getNextStep();
    if (nextStep === 'dashboard') {
      await completeOnboarding();
    } else {
      await saveProgress(nextStep);
      setStep(nextStep);
    }
  };

  const getNextStep = () => {
    if (step === 4) {
      return userData.has_debts === true ? 5 : 'dashboard';
    }
    if (step === 5) {
      return 'dashboard';
    }
    return step + 1;
  };

  const calculateProgress = () => {
    const totalSteps = userData.has_debts === true ? 5 : (userData.has_debts === null ? 5 : 4);
    return (step / totalSteps) * 100;
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      const balance = (parseFloat(userData.monthly_income) || 0) - (parseFloat(userData.monthly_expenses) || 0);
      
      await User.updateMyUserData({
        ...userData,
        monthly_balance: balance,
        onboarding_completed: true,
        onboarding_step: 5
      });

      toast({
        title: "Welkom bij Konsensi! 🎉",
        description: "Je bent klaar om te beginnen!",
      });

      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Fout",
        description: "Er is iets misgegaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStep1Next = async () => {
    if (!userData.voornaam || !userData.age) {
      toast({
        title: "Vul alle velden in",
        description: "We hebben je naam en leeftijd nodig om verder te gaan.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await User.updateMyUserData({
        voornaam: userData.voornaam,
        age: parseInt(userData.age)
      });
      
      await saveProgress(2);
      setStep(2);
    } catch (error) {
      console.error("Error saving step 1:", error);
      toast({
        title: "Fout",
        description: "Er is iets misgegaan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStep2Next = async () => {
    if (!userData.monthly_income || !userData.income_source) {
      toast({
        title: "Vul alle velden in",
        description: "We hebben je inkomen en bron nodig.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await User.updateMyUserData({
        monthly_income: parseFloat(userData.monthly_income),
        income_source: userData.income_source
      });
      
      await saveProgress(3);
      setStep(3);
    } catch (error) {
      console.error("Error saving step 2:", error);
      toast({
        title: "Fout",
        description: "Er is iets misgegaan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStep3Next = async () => {
    if (!userData.monthly_expenses) {
      toast({
        title: "Vul het veld in",
        description: "We hebben je uitgaven nodig.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const balance = (parseFloat(userData.monthly_income) || 0) - parseFloat(userData.monthly_expenses);
      
      await User.updateMyUserData({
        monthly_expenses: parseFloat(userData.monthly_expenses),
        monthly_balance: balance
      });
      
      await saveProgress(4);
      setStep(4);
    } catch (error) {
      console.error("Error saving step 3:", error);
      toast({
        title: "Fout",
        description: "Er is iets misgegaan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStep4Answer = async (answer) => {
    setUserData({ ...userData, has_debts: answer });
    
    setSaving(true);
    try {
      await User.updateMyUserData({
        has_debts: answer
      });

      if (answer === true) {
        await saveProgress(5);
        setStep(5);
      } else {
        await completeOnboarding();
      }
    } catch (error) {
      console.error("Error saving step 4:", error);
      toast({
        title: "Fout",
        description: "Er is iets misgegaan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStep5Complete = async () => {
    if (!userData.total_debt_amount || !userData.debt_count_range) {
      toast({
        title: "Vul alle velden in",
        description: "We hebben het bedrag en aantal schuldeisers nodig.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await User.updateMyUserData({
        total_debt_amount: parseFloat(userData.total_debt_amount),
        debt_count_range: userData.debt_count_range
      });

      await completeOnboarding();
    } catch (error) {
      console.error("Error saving step 5:", error);
      toast({
        title: "Fout",
        description: "Er is iets misgegaan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const balance = (parseFloat(userData.monthly_income) || 0) - (parseFloat(userData.monthly_expenses) || 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#3D7A41' }}>
        <div className="animate-pulse text-white text-xl">laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: '#3D7A41' }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dab075b0ca9b98841bfa1b/6ff20f017_KonsensiBudgetbeheer_Primaire_Beeldmerk3.png" 
              alt="Konsensi Logo" 
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">konsensi</h1>
          <p className="text-white/90 text-sm">het bouwen van vertrouwen</p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-white/80 mb-2">
            <span>Stap {step} van {userData.has_debts === true ? 5 : (userData.has_debts === null ? 5 : 4)}</span>
            <span>{Math.round(calculateProgress())}%</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-xl border-none">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom! Fijn dat je er bent. 💚</h2>
                    <p className="text-gray-600">Laten we beginnen</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="voornaam">Hoe mogen we je noemen?</Label>
                      <Input
                        id="voornaam"
                        type="text"
                        placeholder="Bijv. Rivaldo"
                        value={userData.voornaam}
                        onChange={(e) => setUserData({ ...userData, voornaam: e.target.value })}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="age">Hoe oud ben je?</Label>
                      <Input
                        id="age"
                        type="number"
                        min="18"
                        max="100"
                        placeholder="Bijv. 28"
                        value={userData.age}
                        onChange={(e) => setUserData({ ...userData, age: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleStep1Next}
                    disabled={saving}
                    className="w-full bg-[#4CAF50] hover:bg-[#2D6A31] text-white h-12 text-lg"
                  >
                    {saving ? "Bezig..." : "Volgende →"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={saving}
                    className="w-full text-gray-600 hover:bg-gray-100"
                  >
                    Later invullen ⏭
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-xl border-none">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Hey {userData.voornaam || 'daar'}! 👋</h2>
                    <p className="text-gray-600">Laten we je financiën snappen</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="income">Hoeveel verdien je per maand? 💰</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                        <Input
                          id="income"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={userData.monthly_income}
                          onChange={(e) => setUserData({ ...userData, monthly_income: e.target.value })}
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">(Ongeveer, alle inkomsten samen)</p>
                    </div>

                    <div>
                      <Label htmlFor="source">Waar komt dit vandaan?</Label>
                      <Select 
                        value={userData.income_source} 
                        onValueChange={(value) => setUserData({ ...userData, income_source: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Kies een optie..." />
                        </SelectTrigger>
                        <SelectContent>
                          {incomeSourceOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleStep2Next}
                    disabled={saving}
                    className="w-full bg-[#4CAF50] hover:bg-[#2D6A31] text-white h-12 text-lg"
                  >
                    {saving ? "Bezig..." : "Volgende →"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={saving}
                    className="w-full text-gray-600 hover:bg-gray-100"
                  >
                    Later invullen ⏭
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-xl border-none">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Bijna klaar, {userData.voornaam}! ⚡</h2>
                    <p className="text-gray-600">Wat zijn je vaste lasten per maand?</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="expenses">Hoeveel geef je ongeveer uit? 📊</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                        <Input
                          id="expenses"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={userData.monthly_expenses}
                          onChange={(e) => setUserData({ ...userData, monthly_expenses: e.target.value })}
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">(Huur, energie, eten, etc.)</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        ℹ️ Je kunt dit later preciezer invullen in de app
                      </p>
                    </div>

                    {userData.monthly_income && userData.monthly_expenses && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-[#4CAF50] rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-900 mb-3">💡 SNEL OVERZICHT</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Inkomen:</span>
                            <span className="font-bold">€ {parseFloat(userData.monthly_income).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Uitgaven:</span>
                            <span className="font-bold text-red-600">-€ {parseFloat(userData.monthly_expenses).toFixed(2)}</span>
                          </div>
                          <div className="border-t border-gray-300 my-2"></div>
                          <div className="flex justify-between">
                            <span className="text-gray-900 font-semibold">Over:</span>
                            <span className={`font-bold text-lg ${balance >= 0 ? 'text-[#4CAF50]' : 'text-red-600'}`}>
                              € {balance.toFixed(2)} {balance >= 0 ? '✅' : '⚠️'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleStep3Next}
                    disabled={saving}
                    className="w-full bg-[#4CAF50] hover:bg-[#2D6A31] text-white h-12 text-lg"
                  >
                    {saving ? "Bezig..." : "Volgende →"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={saving}
                    className="w-full text-gray-600 hover:bg-gray-100"
                  >
                    Later invullen ⏭
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-xl border-none">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Nog één vraag, {userData.voornaam} 🙏</h2>
                    <p className="text-gray-600">Heb je op dit moment betaalachterstanden of schulden?</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleStep4Answer(true)}
                      disabled={saving}
                      className="w-full p-5 bg-white border-2 border-gray-200 hover:border-[#4CAF50] hover:bg-green-50 rounded-xl font-semibold text-gray-900 transition-all disabled:opacity-50"
                    >
                      😰 Ja, helaas
                    </button>

                    <button
                      onClick={() => handleStep4Answer(false)}
                      disabled={saving}
                      className="w-full p-5 bg-white border-2 border-gray-200 hover:border-[#4CAF50] hover:bg-green-50 rounded-xl font-semibold text-gray-900 transition-all disabled:opacity-50"
                    >
                      😊 Nee, niet op dit moment
                    </button>

                    <button
                      onClick={() => handleStep4Answer(null)}
                      disabled={saving}
                      className="w-full p-5 bg-white border-2 border-gray-200 hover:border-[#4CAF50] hover:bg-green-50 rounded-xl font-semibold text-gray-900 transition-all disabled:opacity-50"
                    >
                      🤐 Liever niet zeggen
                    </button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      💚 Geen zorgen, we helpen je er samen doorheen
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={saving}
                    className="w-full text-gray-600 hover:bg-gray-100"
                  >
                    Later invullen ⏭
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="shadow-xl border-none">
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Bedankt voor je vertrouwen 💚</h2>
                    <p className="text-gray-600">We gaan dit samen oplossen</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="debt_amount">Ongeveer hoeveel schuld heb je?</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                        <Input
                          id="debt_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={userData.total_debt_amount}
                          onChange={(e) => setUserData({ ...userData, total_debt_amount: e.target.value })}
                          className="pl-8"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">(Totaal, alle schulden samen)</p>
                    </div>

                    <div>
                      <Label htmlFor="debt_count">Bij hoeveel verschillende schuldeisers?</Label>
                      <Select 
                        value={userData.debt_count_range} 
                        onValueChange={(value) => setUserData({ ...userData, debt_count_range: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Kies een optie..." />
                        </SelectTrigger>
                        <SelectContent>
                          {debtCountRanges.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        ℹ️ Je kunt alles gedetailleerd toevoegen in de app
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleStep5Complete}
                    disabled={saving}
                    className="w-full bg-[#4CAF50] hover:bg-[#2D6A31] text-white h-12 text-lg"
                  >
                    {saving ? "Bezig..." : "Klaar! →"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    disabled={saving}
                    className="w-full text-gray-600 hover:bg-gray-100"
                  >
                    Later invullen ⏭
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <ToastProvider>
      <OnboardingContent />
    </ToastProvider>
  );
}
