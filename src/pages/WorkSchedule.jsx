import React, { useState, useEffect, useMemo } from 'react';
import { WorkDay } from '@/api/entities';
import { User } from '@/api/entities';
import { useToast } from '@/components/ui/toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import WorkDayModal from '@/components/workdays/WorkDayModal';
import PayslipScanModal from '@/components/workdays/PayslipScanModal';

export default function WorkSchedule() {
  const [user, setUser] = useState(null);
  const [workDays, setWorkDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showEmployersModal, setShowEmployersModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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

      const allWorkDays = await WorkDay.filter({ user_id: currentUser.id });
      const filtered = allWorkDays.filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= monthStart && dayDate <= monthEnd;
      });

      setWorkDays(filtered);
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
        await WorkDay.create(data);
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

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Statistieken berekenen
  const stats = useMemo(() => {
    const worked = workDays.filter(d => d.status === 'gewerkt');
    const planned = workDays.filter(d => d.status === 'gepland');
    
    const totalHours = worked.reduce((sum, d) => sum + (parseFloat(d.hours_worked) || 0), 0);
    const totalEarned = worked.reduce((sum, d) => sum + (parseFloat(d.calculated_amount) || 0), 0);
    const plannedHours = planned.reduce((sum, d) => sum + (parseFloat(d.hours_worked) || 0), 0);
    const avgHourlyRate = totalHours > 0 ? totalEarned / totalHours : 0;

    return {
      totalEarned,
      totalHours,
      plannedHours,
      avgHourlyRate
    };
  }, [workDays]);

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
      case 'gewerkt': return 'bg-status-green/10 border-status-green/20';
      case 'gepland': return 'bg-status-blue/10 border-status-blue/20';
      case 'ziek': return 'bg-status-red/10 border-status-red/20';
      case 'vrij': return 'bg-gray-100 dark:bg-text-secondary/10 border-gray-200 dark:border-text-secondary/10';
      default: return '';
    }
  };

  const getStatusTextColor = (status) => {
    switch(status) {
      case 'gewerkt': return 'text-status-green';
      case 'gepland': return 'text-status-blue';
      case 'ziek': return 'text-status-red';
      default: return 'text-gray-600 dark:text-text-secondary';
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
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 lg:top-8 lg:right-8 z-20">
        <label aria-label="Switch theme" className="relative inline-flex items-center cursor-pointer select-none">
          <input
            className="sr-only"
            id="theme-toggle"
            type="checkbox"
            checked={darkMode}
            onChange={toggleTheme}
          />
          <div className="w-16 h-9 bg-gray-100 dark:bg-gray-800 rounded-full shadow-inner flex items-center justify-between px-1.5 transition-colors duration-300 border border-gray-200 dark:border-gray-700">
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-amber-500'}`}>
              light_mode
            </span>
            <span className={`material-symbols-outlined text-[20px] z-10 transition-colors duration-300 ${darkMode ? 'text-brand-dark' : 'text-gray-400'}`}>
              dark_mode
            </span>
            <div className={`toggle-circle absolute left-1 top-1 bg-white dark:bg-gray-700 w-7 h-7 rounded-full shadow-md transition-transform duration-300 border border-gray-100 dark:border-gray-600 ${darkMode ? 'translate-x-7' : ''}`}></div>
          </div>
        </label>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-10 py-8 flex flex-col gap-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Totaal Verdiend */}
          <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-border-subtle dark:border-border-base shadow-soft dark:shadow-soft-dark flex flex-col gap-3 group hover:border-primary/50 dark:hover:border-border-accent transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-text-secondary text-sm font-semibold uppercase tracking-wide">Totaal Verdiend</p>
              <div className="size-8 rounded-full bg-status-green/10 dark:bg-bg-card-elevated flex items-center justify-center text-status-green">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-text-primary">
              {stats.totalEarned.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Stat 2: Uren Gewerkt */}
          <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-border-subtle dark:border-border-base shadow-soft dark:shadow-soft-dark flex flex-col gap-3 group hover:border-primary/50 dark:hover:border-border-accent transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-text-secondary text-sm font-semibold uppercase tracking-wide">Uren Gewerkt</p>
              <div className="size-8 rounded-full bg-primary/20 dark:bg-bg-card-elevated flex items-center justify-center text-secondary dark:text-konsensi-green">
                <span className="material-symbols-outlined text-[20px]">work_history</span>
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-text-primary">{Math.round(stats.totalHours)}u</p>
          </div>

          {/* Stat 3: Geplande Uren */}
          <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-border-subtle dark:border-border-base shadow-soft dark:shadow-soft-dark flex flex-col gap-3 group hover:border-primary/50 dark:hover:border-border-accent transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-text-secondary text-sm font-semibold uppercase tracking-wide">Geplande Uren</p>
              <div className="size-8 rounded-full bg-status-blue/10 dark:bg-bg-card-elevated flex items-center justify-center text-status-blue dark:text-konsensi-green">
                <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-text-primary">{Math.round(stats.plannedHours)}u</p>
          </div>

          {/* Stat 4: Gemiddeld Uurloon */}
          <div className="bg-white dark:bg-bg-card p-6 rounded-2xl border border-border-subtle dark:border-border-base shadow-soft dark:shadow-soft-dark flex flex-col gap-3 group hover:border-primary/50 dark:hover:border-border-accent transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 dark:text-text-secondary text-sm font-semibold uppercase tracking-wide">Gemiddeld Uurloon</p>
              <div className="size-8 rounded-full bg-status-orange/10 dark:bg-bg-card-elevated flex items-center justify-center text-status-orange dark:text-konsensi-green">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
            </div>
            <p className="font-display font-bold text-3xl text-[#131d0c] dark:text-text-primary">
              {stats.avgHourlyRate.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })}
              <span className="text-base text-gray-400 dark:text-text-tertiary font-medium">/u</span>
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 px-4">
            {/* Legend */}
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-status-green"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-text-secondary">Gewerkt</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-status-blue"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-text-secondary">Gepland</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-status-red"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-text-secondary">Ziek</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-gray-300 dark:bg-text-secondary"></span>
              <span className="text-sm font-medium text-gray-600 dark:text-text-secondary">Vrij</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowEmployersModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] border border-gray-200 dark:border-border-base bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-bg-card text-sm font-bold text-[#131d0c] dark:text-text-primary shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">business_center</span>
              Mijn Werkgevers
            </button>
            <button 
              onClick={() => setShowPayslipModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] border border-gray-200 dark:border-border-base bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-bg-card text-sm font-bold text-[#131d0c] dark:text-text-primary shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Loonstrook
            </button>
            <button 
              onClick={() => handleAddWorkDay()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[24px] bg-primary hover:bg-primary-dark dark:bg-konsensi-green dark:hover:bg-konsensi-green-light text-sm font-bold text-secondary dark:text-bg-base shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Werkdag
            </button>
          </div>
        </div>

        {/* Calendar Container */}
        <div className="bg-white dark:bg-bg-card border border-border-subtle dark:border-border-base rounded-2xl shadow-soft dark:shadow-soft-dark overflow-hidden">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-border-subtle dark:border-border-base bg-gray-50/50 dark:bg-bg-card-elevated/30">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, idx) => (
              <div key={idx} className="py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-text-secondary/60">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] divide-x divide-y divide-border-subtle dark:divide-border-base">
            {calendarDays.map((day, idx) => {
              const workDay = getWorkDayForDate(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isTodayDate = isToday(day);
              const isWeekend = getDay(day) === 0 || getDay(day) === 6;

              if (!isCurrentMonth) {
                return (
                  <div key={idx} className="bg-gray-50/30 dark:opacity-20 p-2">
                    <span className="text-sm font-medium text-gray-300 dark:text-text-tertiary">{format(day, 'd')}</span>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => workDay ? handleEditWorkDay(workDay) : handleAddWorkDay(day)}
                  className={`p-2 relative hover:bg-gray-50 dark:hover:bg-bg-card-elevated/50 transition-colors group cursor-pointer ${
                    workDay ? getStatusColor(workDay.status) : ''
                  } ${isTodayDate ? 'bg-primary/5 dark:bg-konsensi-green/10' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold p-1 ${
                      isTodayDate ? 'text-primary dark:text-konsensi-green bg-primary/30 dark:bg-konsensi-green/20 size-7 flex items-center justify-center rounded-full' : 
                      isWeekend ? 'text-gray-500 dark:text-text-tertiary' : 
                      'text-gray-500 dark:text-text-primary'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {workDay && (
                      <span className="material-symbols-outlined text-[16px] text-gray-400 dark:text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    )}
                  </div>
                  
                  {workDay && (
                    <div className={`mt-2 w-full p-2 rounded-[24px] ${getStatusColor(workDay.status)} flex flex-col gap-0.5 shadow-sm`}>
                      {workDay.employer && (
                        <div className="flex items-center gap-1">
                          <span className={`size-1.5 rounded-full ${
                            workDay.status === 'gewerkt' ? 'bg-status-green' :
                            workDay.status === 'gepland' ? 'bg-status-blue' :
                            workDay.status === 'ziek' ? 'bg-status-red' : 'bg-gray-400'
                          }`}></span>
                          <span className="text-[10px] font-bold text-[#131d0c] dark:text-text-primary uppercase tracking-wide">{workDay.employer}</span>
                        </div>
                      )}
                      {workDay.status === 'gewerkt' && (
                        <>
                          <span className="text-xs font-medium text-gray-600 dark:text-text-secondary">{workDay.hours_worked}u gewerkt</span>
                          <span className={`text-xs font-bold ${getStatusTextColor(workDay.status)}`}>
                            {(workDay.calculated_amount || 0).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })}
                          </span>
                        </>
                      )}
                      {workDay.status === 'gepland' && (
                        <>
                          <span className="text-xs font-bold text-status-blue dark:text-accent-blue">Gepland</span>
                          <span className="text-xs font-medium text-gray-600 dark:text-text-secondary">{workDay.hours_worked}u · {workDay.employer || ''}</span>
                          <span className="text-xs font-bold text-gray-400 dark:text-text-tertiary mt-1">
                            {((parseFloat(workDay.hours_worked) || 0) * (parseFloat(workDay.hourly_rate) || 0)).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })} est.
                          </span>
                        </>
                      )}
                      {workDay.status === 'ziek' && (
                        <>
                          <span className="text-xs font-bold text-status-red dark:text-accent-red">Ziek</span>
                          <span className="text-[10px] text-gray-500 dark:text-text-secondary">Gemeld</span>
                        </>
                      )}
                      {workDay.status === 'vrij' && (
                        <span className="text-xs font-bold text-gray-600 dark:text-text-secondary">Vrij</span>
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
