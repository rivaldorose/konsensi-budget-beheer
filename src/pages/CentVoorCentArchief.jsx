import React, { useState, useEffect, useMemo } from 'react';
import { User, MonthlyCost, Pot, Debt, DebtPayment, Income as IncomeEntity } from "@/api/entities";
import { formatCurrency } from "@/components/utils/formatters";
import { useNavigate } from 'react-router-dom';

const DUTCH_MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

const EASTER_EGGS = [
  { icon: 'rocket_launch', message: 'Deze maand is nog onderweg... 🚀', color: 'text-purple-400' },
  { icon: 'hourglass_top', message: 'Geduld is een schone zaak! ⏳', color: 'text-amber-400' },
  { icon: 'auto_awesome', message: 'Hier brouwen we iets moois... ✨', color: 'text-cyan-400' },
  { icon: 'psychology', message: 'De toekomst is nog niet geschreven 🔮', color: 'text-indigo-400' },
  { icon: 'music_note', message: 'Even wachten... 🎵', color: 'text-pink-400' },
  { icon: 'spa', message: 'Neem even rust, deze maand komt vanzelf 🧘', color: 'text-teal-400' },
  { icon: 'local_cafe', message: 'Tijd voor een kopje koffie! ☕', color: 'text-orange-400' },
  { icon: 'pets', message: 'Miauw! Deze data bestaat nog niet 🐱', color: 'text-rose-400' },
];

function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const diff = targetDate - now;
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[
        { value: timeLeft.days, label: 'd' },
        { value: timeLeft.hours, label: 'u' },
        { value: timeLeft.minutes, label: 'm' },
        { value: timeLeft.seconds, label: 's' },
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="bg-gray-100 dark:bg-dark-card-elevated rounded-lg px-1.5 py-1 font-mono text-sm font-bold text-text-main dark:text-text-primary tabular-nums">
            {String(item.value || 0).padStart(2, '0')}
          </div>
          <span className="text-[9px] text-text-muted dark:text-text-tertiary uppercase mt-0.5 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CentVoorCentArchief() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [user, setUser] = useState(null);
  const [monthData, setMonthData] = useState({});
  const [easterEggMonth, setEasterEggMonth] = useState(null);
  const [easterEggAnim, setEasterEggAnim] = useState(false);

  const [darkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  const isMonthAvailable = (monthIndex) => {
    if (selectedYear < currentYear) return true;
    if (selectedYear > currentYear) return false;
    // Current month is not yet complete, only past months are available
    return monthIndex < currentMonth;
  };

  const isCurrentMonth = (monthIndex) => {
    return selectedYear === currentYear && monthIndex === currentMonth;
  };

  // Load data for available months
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const userData = await User.me();
        setUser(userData);

        const data = {};
        const regularIncome = userData.monthly_income || 0;

        // Load costs, pots, debts once
        const [costs, pots, debts, allPayments, incomes] = await Promise.all([
          MonthlyCost.filter({ user_id: userData.id }),
          Pot.filter({ user_id: userData.id }),
          Debt.filter({ user_id: userData.id }),
          DebtPayment.filter({ user_id: userData.id }),
          IncomeEntity.filter({ user_id: userData.id }).catch(() => []),
        ]);

        const fixedCosts = (costs || []).reduce((sum, c) => sum + (c.amount || 0), 0);
        const potsBudget = (pots || []).reduce((sum, p) => sum + (p.target_amount || 0), 0);

        // For each available month, calculate totals
        for (let m = 0; m < 12; m++) {
          if (!isMonthAvailable(m) && !isCurrentMonth(m)) continue;

          const monthStart = new Date(selectedYear, m, 1);
          const monthEnd = new Date(selectedYear, m + 1, 0);

          // Filter debt payments for this month
          const monthPayments = (allPayments || []).filter(p => {
            const pDate = new Date(p.payment_date || p.date || p.created_date);
            return pDate >= monthStart && pDate <= monthEnd;
          });
          const debtPaidThisMonth = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

          // Filter extra income for this month
          const monthIncomes = (incomes || []).filter(i => {
            const iDate = new Date(i.date || i.created_date);
            return iDate >= monthStart && iDate <= monthEnd;
          });
          const extraIncome = monthIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

          const totalIncome = regularIncome + extraIncome;
          const totalExpenses = fixedCosts + potsBudget + debtPaidThisMonth;

          data[m] = {
            totalIncome,
            totalExpenses,
            remaining: totalIncome - totalExpenses,
            debtPaid: debtPaidThisMonth,
          };
        }

        setMonthData(data);
      } catch (error) {
        console.error('Error loading archive data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear]);

  const handleMonthClick = (monthIndex) => {
    if (isMonthAvailable(monthIndex)) {
      // Navigate to CentVoorCent with month parameter
      navigate(`/CentVoorCent?year=${selectedYear}&month=${monthIndex}`);
    } else if (!isCurrentMonth(monthIndex)) {
      // Easter egg for locked months
      const randomEgg = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)];
      setEasterEggMonth({ index: monthIndex, ...randomEgg });
      setEasterEggAnim(true);
      setTimeout(() => setEasterEggAnim(false), 300);
      setTimeout(() => setEasterEggMonth(null), 3000);
    }
  };

  const availableYears = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= currentYear - 3; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  const totalYearIncome = Object.values(monthData).reduce((sum, d) => sum + (d?.totalIncome || 0), 0);
  const totalYearExpenses = Object.values(monthData).reduce((sum, d) => sum + (d?.totalExpenses || 0), 0);
  const completedMonths = Object.keys(monthData).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary dark:border-primary-green"></div>
          <p className="text-text-muted dark:text-text-tertiary text-sm font-medium">Archief laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] font-display text-[#1F2937] dark:text-white antialiased">
      <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8">
        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/CentVoorCent')}
                className="p-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#3D6456] dark:text-white tracking-tight">
                Cent voor Cent Archief
              </h1>
            </div>
            <p className="text-text-muted dark:text-text-secondary text-lg ml-14">
              Bekijk je maandelijkse financiële overzichten per maand.
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex mb-8">
          <div className="flex h-12 items-center gap-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-2 text-text-muted dark:text-text-secondary hover:text-primary dark:hover:text-primary-green transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card-elevated"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="flex items-center gap-2 px-4">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    selectedYear === year
                      ? 'bg-primary dark:bg-primary-green text-white dark:text-dark-bg'
                      : 'text-text-muted dark:text-text-secondary hover:text-text-main dark:hover:text-text-primary hover:bg-gray-50 dark:hover:bg-dark-card-elevated'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelectedYear(y => Math.min(y + 1, currentYear))}
              disabled={selectedYear >= currentYear}
              className="p-2 text-text-muted dark:text-text-secondary hover:text-primary dark:hover:text-primary-green transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card-elevated disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Monthly Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-10">
          {Array.from({ length: 12 }, (_, i) => {
            const available = isMonthAvailable(i);
            const isCurrent = isCurrentMonth(i);
            const data = monthData[i];
            const showEasterEgg = easterEggMonth?.index === i;
            const monthDate = new Date(selectedYear, i + 1, 1); // First of next month for countdown

            return (
              <div
                key={i}
                onClick={() => handleMonthClick(i)}
                className={`relative flex flex-col gap-4 p-5 rounded-2xl border transition-all ${
                  available
                    ? 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border hover:border-primary/40 dark:hover:border-primary-green/40 hover:shadow-md cursor-pointer group'
                    : isCurrent
                    ? 'bg-white dark:bg-dark-card border-primary/20 dark:border-primary-green/20 cursor-default'
                    : 'bg-gray-50/50 dark:bg-dark-card/40 border-gray-200/60 dark:border-dark-border/60 opacity-70 cursor-pointer hover:opacity-90'
                } ${showEasterEgg && easterEggAnim ? 'scale-[1.02]' : ''}`}
              >
                {/* Status Badge */}
                <div className="flex justify-between items-start">
                  {available ? (
                    <div className="flex items-center gap-1.5 text-primary dark:text-primary-green">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Beschikbaar</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1.5 text-status-blue dark:text-accent-blue">
                      <span className="material-symbols-outlined text-lg animate-pulse">pending</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Actieve maand</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-text-muted dark:text-text-tertiary">
                      <span className="material-symbols-outlined text-lg">lock</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Wachtend</span>
                    </div>
                  )}
                </div>

                {/* Month Name */}
                <div>
                  <h3 className={`text-xl font-bold mb-0.5 ${
                    available ? 'text-text-main dark:text-text-primary' :
                    isCurrent ? 'text-text-main dark:text-text-primary' :
                    'text-text-muted dark:text-text-tertiary'
                  }`}>
                    {DUTCH_MONTHS[i]} {selectedYear}
                  </h3>
                  {available && data ? (
                    <p className="text-text-muted dark:text-text-secondary text-sm">Financieel rapport</p>
                  ) : isCurrent ? (
                    <p className="text-status-blue/70 dark:text-accent-blue/70 text-sm">Data wordt verzameld...</p>
                  ) : (
                    <p className="text-text-muted/60 dark:text-text-tertiary/60 text-sm italic">Nog niet beschikbaar</p>
                  )}
                </div>

                {/* Data / Timer / Easter Egg */}
                {showEasterEgg ? (
                  <div className="py-3 border-y border-gray-100 dark:border-dark-border/50 text-center transition-all">
                    <span className={`material-symbols-outlined text-3xl ${easterEggMonth.color} mb-1 block animate-bounce`}>
                      {easterEggMonth.icon}
                    </span>
                    <p className={`text-sm font-medium ${easterEggMonth.color}`}>{easterEggMonth.message}</p>
                  </div>
                ) : available && data ? (
                  <div className="py-3 border-y border-gray-100 dark:border-dark-border/50">
                    <p className="text-xs text-text-muted dark:text-text-tertiary mb-1">Totaal Inkomsten</p>
                    <p className="text-primary dark:text-primary-green text-2xl font-extrabold">
                      {formatCurrency(data.totalIncome)}
                    </p>
                  </div>
                ) : isCurrent ? (
                  <div className="py-3 border-y border-gray-100 dark:border-dark-border/50">
                    <p className="text-xs text-text-muted dark:text-text-tertiary mb-1.5">Beschikbaar over</p>
                    <CountdownTimer targetDate={monthDate} />
                  </div>
                ) : (
                  <div className="py-3 border-y border-gray-100/50 dark:border-dark-border/30">
                    <p className="text-xs text-text-muted/50 dark:text-text-tertiary/50 mb-1">Verwachte Inkomsten</p>
                    <p className="text-text-muted dark:text-text-tertiary text-2xl font-extrabold">--</p>
                  </div>
                )}

                {/* Action Button */}
                {available ? (
                  <button className="w-full py-2.5 bg-primary dark:bg-primary-green text-white dark:text-dark-bg font-bold rounded-xl text-sm group-hover:brightness-110 transition-all">
                    Bekijk overzicht
                  </button>
                ) : isCurrent ? (
                  <button className="w-full py-2.5 bg-status-blue/10 dark:bg-accent-blue/10 text-status-blue dark:text-accent-blue font-bold rounded-xl text-sm cursor-default">
                    Wordt verwerkt...
                  </button>
                ) : (
                  <button className="w-full py-2.5 bg-gray-100 dark:bg-dark-card-elevated text-text-muted dark:text-text-tertiary font-bold rounded-xl text-sm" disabled>
                    Nog niet beschikbaar
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Year Summary */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary-green/15 flex items-center justify-center text-primary dark:text-primary-green">
              <span className="material-symbols-outlined text-3xl">insights</span>
            </div>
            <div>
              <p className="text-text-muted dark:text-text-secondary text-sm font-medium">Totaal inkomsten {selectedYear}</p>
              <p className="text-text-main dark:text-text-primary text-3xl font-extrabold">{formatCurrency(totalYearIncome)}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200 dark:bg-dark-border hidden md:block"></div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-status-orange/10 dark:bg-accent-orange/15 flex items-center justify-center text-status-orange dark:text-accent-orange">
              <span className="material-symbols-outlined text-3xl">payments</span>
            </div>
            <div>
              <p className="text-text-muted dark:text-text-secondary text-sm font-medium">Totaal uitgaven {selectedYear}</p>
              <p className="text-status-orange dark:text-accent-orange text-3xl font-extrabold">{formatCurrency(totalYearExpenses)}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200 dark:bg-dark-border hidden md:block"></div>
          <div className="flex flex-col items-center md:items-start">
            <p className="text-text-muted dark:text-text-secondary text-sm font-medium mb-1">Maanden verwerkt</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary dark:bg-primary-green animate-pulse"></span>
              <span className="text-text-main dark:text-text-primary font-bold">{completedMonths} van 12</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-primary/5 dark:bg-primary-green/5 border border-primary/15 dark:border-primary-green/15 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary-green/15 text-primary dark:text-primary-green flex-shrink-0">
              <span className="material-symbols-outlined">info</span>
            </div>
            <div>
              <p className="text-text-main dark:text-text-primary font-bold">Over de maandoverzichten</p>
              <p className="text-text-muted dark:text-text-secondary text-sm mt-1">
                Financiële overzichten worden automatisch gegenereerd aan het einde van elke maand zodra alle transacties zijn verwerkt.
                Klik op een vergrendelde maand voor een verrassing!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
