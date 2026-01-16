import React, { useState, useEffect, useMemo } from 'react';
import { WorkDay, Payslip } from '@/api/entities';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import WorkDayModal from '@/components/workdays/WorkDayModal';
import PayslipScanModal from '@/components/workdays/PayslipScanModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WorkSchedule() {
  const [user, setUser] = useState(null);
  const [workDays, setWorkDays] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showEmployersModal, setShowEmployersModal] = useState(false);
  const { toast } = useToast();

  // Check dark mode from localStorage (managed by Layout component)
  useEffect(() => {
    const checkDarkMode = () => {
      const theme = localStorage.getItem('theme');
      const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    checkDarkMode();
  }, []);

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await User.me();
        setEmployers(userData.employers || []);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const monthStr = format(currentMonth, 'yyyy-MM');

      const allWorkDays = await WorkDay.filter({ user_id: currentUser.id });
      const filtered = allWorkDays.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= monthStart && dayDate <= monthEnd;
      });

      setWorkDays(filtered);

      // Load payslips for this month
      const allPayslips = await Payslip.filter({ user_id: currentUser.id });
      const monthPayslips = allPayslips.filter(p => {
        if (!p.period_start && !p.period_end) return false;
        const payslipMonth = (p.period_end || p.period_start)?.substring(0, 7);
        return payslipMonth === monthStr;
      });
      setPayslips(monthPayslips);
    } catch (error) {
      console.error('Error loading work schedule:', error);
      toast({
        title: 'Fout',
        description: 'Kon werkschema niet laden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkDay = (date = null) => {
    setSelectedDay(date);
    setShowModal(true);
  };

  const handleEditWorkDay = (workDay) => {
    setSelectedDay(workDay);
    setShowModal(true);
  };

  const handleSaveWorkDay = async (data) => {
    try {
      if (data.employer && !employers.includes(data.employer)) {
        const newEmployers = [...employers, data.employer];
        await User.updateMe({ employers: newEmployers });
        setEmployers(newEmployers);
      }

      if (selectedDay && selectedDay.id) {
        await WorkDay.update(selectedDay.id, data);
        toast({ title: '✅ Opgeslagen', description: 'Werkdag bijgewerkt' });
      } else {
        // Add user_id when creating new work day
        await WorkDay.create({ ...data, user_id: user.id });
        toast({ title: '✅ Toegevoegd', description: 'Werkdag toegevoegd' });
      }
      setShowModal(false);
      setSelectedDay(null);
      await loadData();
    } catch (error) {
      console.error('Error saving work day:', error);
      toast({ title: 'Fout', description: 'Kon niet opslaan', variant: 'destructive' });
    }
  };

  const handleDeleteWorkDay = async (id) => {
    if (!window.confirm('Weet je zeker dat je deze werkdag wilt verwijderen?')) return;

    try {
      await WorkDay.delete(id);
      toast({ title: '✅ Verwijderd', description: 'Werkdag verwijderd' });
      await loadData();
    } catch (error) {
      console.error('Error deleting work day:', error);
      toast({ title: 'Fout', description: 'Kon niet verwijderen', variant: 'destructive' });
    }
  };

  // Statistieken berekenen - gebruik payslip data als beschikbaar
  const stats = useMemo(() => {
    const worked = workDays.filter(d => d.status === 'gewerkt');
    const planned = workDays.filter(d => d.status === 'gepland');

    // Bereken totalen van werkdagen
    const workDayHours = worked.reduce((sum, d) => sum + (parseFloat(d.hours_worked) || 0), 0);
    const workDayEarned = worked.reduce((sum, d) => sum + (parseFloat(d.calculated_amount) || 0), 0);
    const plannedHours = planned.reduce((sum, d) => sum + (parseFloat(d.hours_worked) || 0), 0);

    // Bereken totalen van loonstroken voor deze maand
    const payslipEarned = payslips.reduce((sum, p) => sum + (parseFloat(p.netto_loon) || parseFloat(p.amount) || 0), 0);
    const payslipHours = payslips.reduce((sum, p) => sum + (parseFloat(p.uren_gewerkt) || 0), 0);
    const payslipHourlyRate = payslips.length > 0 ? (payslips[0].uurloon || 0) : 0;

    // Gebruik payslip data als beschikbaar, anders werkdagen
    const totalEarned = payslipEarned > 0 ? payslipEarned : workDayEarned;
    const totalHours = payslipHours > 0 ? payslipHours : workDayHours;
    const avgHourlyRate = payslipHourlyRate > 0 ? payslipHourlyRate : (totalHours > 0 ? totalEarned / totalHours : 0);

    return {
      totalEarned,
      totalHours,
      plannedHours,
      avgHourlyRate,
      hasPayslip: payslips.length > 0
    };
  }, [workDays, payslips]);

  // Kalender genereren
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { locale: nl, weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { locale: nl, weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const getWorkDayForDate = (date) => {
    return workDays.find(wd => isSameDay(new Date(wd.date), date));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'gewerkt': return 'bg-[#10b981]/10 dark:bg-[#10b981]/10 border border-[#10b981]/20';
      case 'gepland': return 'bg-[#3b82f6]/10 dark:bg-[#3b82f6]/10 border border-[#3b82f6]/20';
      case 'ziek': return 'bg-[#ef4444]/10 dark:bg-[#ef4444]/10 border border-[#ef4444]/20';
      case 'vrij': return 'bg-gray-100 dark:bg-[#a1a1a1]/10 border border-gray-200 dark:border-[#a1a1a1]/10';
      default: return '';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'gewerkt': return 'text-[#10b981]';
      case 'gepland': return 'text-[#3b82f6]';
      case 'ziek': return 'text-[#ef4444]';
      default: return 'text-gray-600 dark:text-[#a1a1a1]';
    }
  };

  const getStatusDotColor = (status) => {
    switch(status) {
      case 'gewerkt': return 'bg-[#10b981]';
      case 'gepland': return 'bg-[#3b82f6]';
      case 'ziek': return 'bg-[#ef4444]';
      default: return 'bg-gray-400 dark:bg-[#a1a1a1]';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400 dark:border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] dark:bg-[#0a0a0a] text-[#1F2937] dark:text-white font-body antialiased">
      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-10 py-8 flex flex-col gap-8">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Income')}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-border-base bg-white dark:bg-bg-card hover:bg-gray-50 dark:hover:bg-bg-card-elevated transition-all text-sm font-medium text-gray-600 dark:text-text-secondary">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Terug naar Inkomen
            </button>
          </Link>
        </div>

        {/* Header & Month Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-[#131d0c] dark:text-text-primary">Werkrooster & Inkomsten</h2>
            <p className="text-gray-500 dark:text-text-secondary font-medium text-lg">Houd je uren en inkomsten bij.</p>
          </div>
          <div className="flex items-center bg-white dark:bg-bg-card rounded-[24px] shadow-soft dark:shadow-soft-dark p-1 border border-border-subtle dark:border-border-base">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="size-10 flex items-center justify-center rounded-[24px] hover:bg-gray-50 dark:hover:bg-bg-card-elevated text-gray-600 dark:text-text-secondary transition-colors"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="px-6 flex flex-col items-center min-w-[140px]">
              <span className="font-display font-bold text-lg text-[#131d0c] dark:text-text-primary">{format(currentMonth, 'MMMM', { locale: nl })}</span>
              <span className="text-xs font-medium text-gray-400 dark:text-text-secondary">{format(currentMonth, 'yyyy')}</span>
            </div>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="size-10 flex items-center justify-center rounded-[24px] hover:bg-gray-50 dark:hover:bg-bg-card-elevated text-gray-600 dark:text-text-secondary transition-colors"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1: Totaal Verdiend */}
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-[#2a2a2a] shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex flex-col gap-4 group hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-all">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#a1a1a1] text-xs font-bold uppercase tracking-wider">Totaal Verdiend</p>
              <div className="size-10 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center text-primary dark:text-[#10b981] group-hover:bg-primary/10 dark:group-hover:bg-[#10b981]/10 transition-colors">
                <span className="material-symbols-outlined text-[20px]">wallet</span>
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-white">
              {stats.totalEarned.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Stat 2: Uren Gewerkt */}
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-[#2a2a2a] shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex flex-col gap-4 group hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-all">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#a1a1a1] text-xs font-bold uppercase tracking-wider">Uren Gewerkt</p>
              <div className="size-10 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center text-primary dark:text-[#10b981] group-hover:bg-primary/10 dark:group-hover:bg-[#10b981]/10 transition-colors">
                <span className="material-symbols-outlined text-[20px]">work</span>
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-white">{Math.round(stats.totalHours)}u</p>
          </div>

          {/* Stat 3: Geplande Uren */}
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-[#2a2a2a] shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex flex-col gap-4 group hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-all">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#a1a1a1] text-xs font-bold uppercase tracking-wider">Geplande Uren</p>
              <div className="size-10 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center text-primary dark:text-[#10b981] group-hover:bg-primary/10 dark:group-hover:bg-[#10b981]/10 transition-colors">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-white">{Math.round(stats.plannedHours)}u</p>
          </div>

          {/* Stat 4: Gemiddeld Uurloon */}
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-[#2a2a2a] shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex flex-col gap-4 group hover:border-gray-200 dark:hover:border-[#3a3a3a] transition-all">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-[#a1a1a1] text-xs font-bold uppercase tracking-wider">Gemiddeld Uurloon</p>
              <div className="size-10 rounded-xl bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-center text-primary dark:text-[#10b981] group-hover:bg-primary/10 dark:group-hover:bg-[#10b981]/10 transition-colors">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-white">
                {stats.avgHourlyRate.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })}
              </p>
              <span className="text-sm text-gray-400 dark:text-[#6b7280] font-medium">/u</span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 px-2">
            {/* Legend */}
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-[#a1a1a1]">Gewerkt</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-[#a1a1a1]">Gepland</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-[#a1a1a1]">Ziek</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="size-3 rounded-full bg-gray-400 dark:bg-[#a1a1a1] shadow-[0_0_8px_rgba(161,161,161,0.2)]"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-[#a1a1a1]">Vrij</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowEmployersModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-transparent hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#3a3a3a] text-[#131d0c] dark:text-white font-bold text-sm transition-all group"
            >
              <span className="material-symbols-outlined text-[18px] text-gray-500 dark:text-[#a1a1a1] group-hover:text-[#131d0c] dark:group-hover:text-white transition-colors">work</span>
              Mijn Werkgevers
            </button>
            <button
              onClick={() => setShowPayslipModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2a] bg-transparent hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-[#3a3a3a] text-[#131d0c] dark:text-white font-bold text-sm transition-all group"
            >
              <span className="material-symbols-outlined text-[18px] text-gray-500 dark:text-[#a1a1a1] group-hover:text-[#131d0c] dark:group-hover:text-white transition-colors">description</span>
              Loonstrook
            </button>
            <button
              onClick={() => handleAddWorkDay()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary dark:bg-[#10b981] hover:bg-primary-dark dark:hover:bg-[#34d399] active:bg-primary dark:active:bg-[#059669] text-white dark:text-[#0a0a0a] font-bold text-sm shadow-lg dark:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all transform active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px] stroke-[3px]">add</span>
              Werkdag
            </button>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] rounded-3xl shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] overflow-hidden p-6">
          {/* Days Header */}
          <div className="grid grid-cols-7 mb-4">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, idx) => (
              <div key={idx} className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-[#a1a1a1]/60">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-[minmax(140px,auto)] gap-2">
            {calendarDays.map((day, idx) => {
              const workDay = getWorkDayForDate(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isTodayDate = isToday(day);
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;

              if (!isCurrentMonth) {
                return (
                  <div key={idx} className="rounded-xl p-3 opacity-20">
                    <span className="text-sm font-bold text-gray-300 dark:text-white">{format(day, 'd')}</span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => workDay ? handleEditWorkDay(workDay) : handleAddWorkDay(day)}
                  className={`rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]/50 transition-colors cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-[#2a2a2a] ${
                    isTodayDate ? 'bg-primary/5 dark:bg-[#10b981]/10 border-primary/20 dark:border-[#10b981]/20' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold ${
                      isTodayDate ? 'text-primary dark:text-[#10b981]' :
                      isWeekend ? 'text-gray-400 dark:text-[#6b7280]' :
                      'text-[#131d0c] dark:text-white'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {workDay && (
                      <span className="material-symbols-outlined text-[16px] text-gray-400 dark:text-[#a1a1a1] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    )}
                  </div>
                  
                  {workDay && (
                    <div className={`mt-2 w-full p-2 rounded-lg ${getStatusColor(workDay.status)} flex flex-col gap-1`}>
                      {workDay.employer && (
                        <div className="flex items-center gap-1.5">
                          <span className={`size-1.5 rounded-full ${getStatusDotColor(workDay.status)}`}></span>
                          <span className="text-[10px] font-bold text-[#131d0c] dark:text-white uppercase tracking-wide truncate">{workDay.employer}</span>
                        </div>
                      )}
                      {workDay.status === 'gewerkt' && (
                        <>
                          <span className="text-xs font-medium text-gray-600 dark:text-[#a1a1a1]">{workDay.hours_worked}u gewerkt</span>
                          <span className={`text-xs font-bold ${getStatusTextColor(workDay.status)}`}>
                            {(workDay.calculated_amount || 0).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })}
                          </span>
                        </>
                      )}
                      {workDay.status === 'gepland' && (
                        <>
                          <span className="text-xs font-bold text-[#3b82f6]">Gepland</span>
                          <span className="text-xs font-medium text-gray-600 dark:text-[#a1a1a1]">{workDay.hours_worked}u</span>
                          <span className="text-xs font-bold text-gray-400 dark:text-[#6b7280]">
                            {((parseFloat(workDay.hours_worked) || 0) * (parseFloat(workDay.hourly_rate) || 0)).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })} est.
                          </span>
                        </>
                      )}
                      {workDay.status === 'ziek' && (
                        <>
                          <span className="text-xs font-bold text-[#ef4444]">Ziek</span>
                          <span className="text-[10px] text-gray-500 dark:text-[#a1a1a1]">Gemeld</span>
                        </>
                      )}
                      {workDay.status === 'vrij' && (
                        <span className="text-xs font-bold text-gray-600 dark:text-[#a1a1a1]">Vrij</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Modals */}
      <WorkDayModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedDay(null);
        }}
        onSave={handleSaveWorkDay}
        onDelete={selectedDay?.id ? handleDeleteWorkDay : null}
        workDay={selectedDay}
        defaultHourlyRate={user?.hourly_rate}
        employers={employers}
        defaultEmployer={employers[0] || ''}
      />

      <PayslipScanModal
        isOpen={showPayslipModal}
        onClose={() => setShowPayslipModal(false)}
        employers={employers}
        onPayslipProcessed={(payslip, newEmployer) => {
          if (newEmployer && !employers.includes(newEmployer)) {
            setEmployers(prev => [...prev, newEmployer]);
          }
          loadData();
          setShowPayslipModal(false);
        }}
      />

      {/* Employers Modal */}
      {showEmployersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-bg-card rounded-2xl shadow-2xl dark:shadow-modal-dark w-full max-w-[500px] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-border-base flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#131d0c] dark:text-text-primary">Mijn Werkgevers</h3>
              <button 
                onClick={() => setShowEmployersModal(false)}
                className="text-gray-400 dark:text-text-secondary hover:text-gray-600 dark:hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {employers.length > 0 ? (
                <div className="space-y-2">
                  {employers.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-bg-card-elevated px-3 py-2 rounded-[24px]">
                      <span className="font-medium text-[#131d0c] dark:text-text-primary">{emp}</span>
                      <button
                        onClick={async () => {
                          const newList = employers.filter((_, i) => i !== idx);
                          await User.updateMe({ employers: newList });
                          setEmployers(newList);
                          toast({ title: '✅ Werkgever verwijderd' });
                        }}
                        className="text-status-red dark:text-accent-red hover:text-status-red/80 text-sm"
                      >
                        Verwijder
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-text-secondary text-sm">Nog geen werkgevers toegevoegd</p>
              )}
              <div className="border-t border-gray-200 dark:border-border-base pt-4">
                <input
                  type="text"
                  placeholder="Nieuwe werkgever toevoegen..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-border-accent rounded-[24px] bg-white dark:bg-bg-card-elevated text-[#131d0c] dark:text-text-primary"
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newEmployer = e.target.value.trim();
                      if (!employers.includes(newEmployer)) {
                        const newList = [...employers, newEmployer];
                        await User.updateMe({ employers: newList });
                        setEmployers(newList);
                        e.target.value = '';
                        toast({ title: '✅ Werkgever toegevoegd' });
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 dark:border-border-base bg-gray-50/50 dark:bg-bg-card-elevated/20 flex items-center justify-end">
              <button 
                onClick={() => setShowEmployersModal(false)}
                className="bg-primary dark:bg-konsensi-green hover:bg-primary-dark dark:hover:bg-konsensi-green-light text-secondary dark:text-bg-base text-sm font-bold px-6 py-2.5 rounded-[24px] shadow-sm transition-all"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
