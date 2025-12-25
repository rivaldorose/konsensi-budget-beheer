import React, { useState, useEffect } from 'react';
import { WorkDay } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Calendar, Plus, TrendingUp, Clock, Euro, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useTranslation } from '@/components/utils/LanguageContext';
import WorkDayModal from '@/components/workdays/WorkDayModal';
import PayslipScanModal from '@/components/workdays/PayslipScanModal';

export default function WorkSchedule() {
  const [user, setUser] = useState(null);
  const [workDays, setWorkDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [workScheduleName, setWorkScheduleName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [employers, setEmployers] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  // Load work schedule name and employers from user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await User.me();
        setWorkScheduleName(userData.work_schedule_name || '');
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
      await loadDataAndReturn();
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

  const loadDataAndReturn = async () => {
    const currentUser = await User.me();
    setUser(currentUser);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    const allWorkDays = await WorkDay.filter({ created_by: currentUser.email });
    const filtered = allWorkDays.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= monthStart && dayDate <= monthEnd;
    });

    setWorkDays(filtered);
    return filtered;
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
      // Voeg nieuwe werkgever toe aan lijst als deze nog niet bestaat
      if (data.employer && !employers.includes(data.employer)) {
        const newEmployers = [...employers, data.employer];
        await User.updateMyUserData({ employers: newEmployers });
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
      
      // Eerst data laden, dan syncen met verse data
      const freshWorkDays = await loadDataAndReturn();
      await syncToIncomeWithData(freshWorkDays);
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
      const freshWorkDays = await loadDataAndReturn();
      await syncToIncomeWithData(freshWorkDays);
    } catch (error) {
      console.error('Error deleting work day:', error);
      toast({ title: 'Fout', description: 'Kon niet verwijderen', variant: 'destructive' });
    }
  };

  const handleSaveScheduleName = async (name) => {
    try {
      await User.updateMyUserData({ work_schedule_name: name });
      setWorkScheduleName(name);
      setShowNameModal(false);
      toast({ title: '✅ Naam opgeslagen' });
      await syncToIncomeWithData(workDays);
    } catch (error) {
      toast({ title: '❌ Fout bij opslaan', variant: 'destructive' });
    }
  };

  const syncToIncomeWithData = async (freshWorkDays) => {
    try {
      const { Income } = await import('@/api/entities');
      
      // Groepeer werkdagen per werkgever
      const earningsByEmployer = {};
      freshWorkDays.forEach(day => {
        const emp = day.employer || workScheduleName || 'Mijn werk';
        if (!earningsByEmployer[emp]) {
          earningsByEmployer[emp] = 0;
        }
        earningsByEmployer[emp] += parseFloat(day.calculated_amount) || 0;
      });

      // Haal bestaande werkschema inkomsten op
      const existingIncomes = await Income.filter({ 
        is_from_work_schedule: true,
        created_by: user.email 
      });

      // Verwerk per werkgever
      for (const [employer, totalEarned] of Object.entries(earningsByEmployer)) {
        if (totalEarned === 0) continue;
        
        const description = `Gepland (${employer})`;
        const existingForEmployer = existingIncomes.find(i => i.description === description);
        
        if (existingForEmployer) {
          await Income.update(existingForEmployer.id, {
            amount: totalEarned,
            description: description,
            income_type: 'vast',
            monthly_equivalent: totalEarned
          });
        } else {
          await Income.create({
            description: description,
            amount: totalEarned,
            income_type: 'vast',
            monthly_equivalent: totalEarned,
            is_from_work_schedule: true
          });
        }
      }

      // Verwijder inkomsten voor werkgevers zonder werkdagen deze maand
      for (const income of existingIncomes) {
        const employerName = income.description.replace('Gepland (', '').replace(')', '');
        if (!earningsByEmployer[employerName]) {
          await Income.delete(income.id);
        }
      }
    } catch (error) {
      console.error('Error syncing to income:', error);
    }
  };

  // Statistieken berekenen
  const stats = React.useMemo(() => {
    const worked = workDays.filter(d => d.status === 'gewerkt');
    const planned = workDays.filter(d => d.status === 'gepland');
    
    const totalHours = worked.reduce((sum, d) => sum + (d.hours_worked || 0), 0);
    const totalEarned = worked.reduce((sum, d) => sum + (d.calculated_amount || 0), 0);
    const expectedHours = planned.reduce((sum, d) => sum + (d.hours_worked || 0), 0);
    const expectedEarnings = planned.reduce((sum, d) => sum + (d.calculated_amount || 0), 0);

    return {
      daysWorked: worked.length,
      daysPlanned: planned.length,
      totalHours,
      totalEarned,
      expectedHours,
      expectedEarnings,
      totalDays: worked.length + planned.length
    };
  }, [workDays]);

  // Kalender genereren
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { locale: nl });
    const calEnd = endOfWeek(monthEnd, { locale: nl });
    
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const getWorkDayForDate = (date) => {
    return workDays.find(wd => isSameDay(new Date(wd.date), date));
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'gewerkt': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'gepland': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'ziek': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'vrij': return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/income'}
            className="text-gray-600"
          >
            ← Terug naar Inkomen
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Mijn Werkschema
            </h1>
            {workScheduleName && (
              <p className="text-sm text-gray-500 mt-1">
                {workScheduleName} • 
                <button 
                  onClick={() => setShowNameModal(true)}
                  className="ml-1 text-blue-600 hover:underline"
                >
                  wijzig
                </button>
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowPayslipModal(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            📄 Loonstrook
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowNameModal(true)}
            className="text-gray-600"
          >
            Werkgevers ({employers.length})
          </Button>
          <Button onClick={() => handleAddWorkDay()} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Dag Toevoegen
          </Button>
        </div>
      </div>

      {/* Statistieken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gewerkte Dagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysWorked}</div>
            <p className="text-xs text-gray-500">{stats.totalHours.toFixed(1)} uur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Verdiend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{stats.totalEarned.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Deze maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Gepland</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.daysPlanned}</div>
            <p className="text-xs text-gray-500">{stats.expectedHours.toFixed(1)} uur</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Verwacht</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€{stats.expectedEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500">Nog te verdienen</p>
          </CardContent>
        </Card>
      </div>

      {/* Maand navigatie */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          ← Vorige
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: nl })}
        </h2>
        <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          Volgende →
        </Button>
      </div>

      {/* Kalender */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
              <div key={day} className="text-center font-semibold text-sm text-gray-600">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const workDay = getWorkDayForDate(day);
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isTodayDate = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => workDay ? handleEditWorkDay(workDay) : handleAddWorkDay(day)}
                  className={`
                    aspect-square p-2 rounded-lg text-sm transition-all
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isTodayDate ? 'ring-2 ring-green-500' : ''}
                    ${workDay ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                    ${workDay?.status === 'gewerkt' ? 'bg-green-50 hover:bg-green-100' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className={`font-medium ${isTodayDate ? 'text-green-600' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {workDay && (
                      <div className="mt-1 flex flex-col items-center gap-0.5">
                        {getStatusIcon(workDay.status)}
                        <span className="text-xs font-semibold">
                          {workDay.hours_worked}u
                        </span>
                        {workDay.employer && employers.length > 1 && (
                          <span className="text-[10px] text-gray-500 truncate max-w-full">
                            {workDay.employer.substring(0, 6)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Gewerkt</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Gepland</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span>Ziek</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span>Vrij</span>
        </div>
      </div>

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
        defaultEmployer={employers[0] || workScheduleName || ''}
      />

      <PayslipScanModal
        isOpen={showPayslipModal}
        onClose={() => setShowPayslipModal(false)}
        employers={employers}
        onPayslipProcessed={(payslip, newEmployer) => {
          // Voeg werkgever toe aan lokale state als deze nieuw is
          if (newEmployer && !employers.includes(newEmployer)) {
            setEmployers(prev => [...prev, newEmployer]);
          }
          loadData();
          setShowPayslipModal(false);
        }}
      />

      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Mijn Werkgevers</h3>
            
            {/* Bestaande werkgevers */}
            {employers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Opgeslagen werkgevers:</p>
                <div className="space-y-2">
                  {employers.map((emp, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="font-medium">{emp}</span>
                      <button
                        onClick={async () => {
                          const newList = employers.filter((_, i) => i !== idx);
                          await User.updateMyUserData({ employers: newList });
                          setEmployers(newList);
                          toast({ title: '✅ Werkgever verwijderd' });
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Verwijder
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Nieuwe werkgever toevoegen */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600 mb-2">Nieuwe werkgever toevoegen:</p>
              <input
                type="text"
                value={workScheduleName}
                onChange={(e) => setWorkScheduleName(e.target.value)}
                placeholder="Bijv. Binck, Albert Heijn, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNameModal(false);
                  setWorkScheduleName('');
                }}
              >
                Sluiten
              </Button>
              <Button
                onClick={async () => {
                  if (workScheduleName.trim() && !employers.includes(workScheduleName.trim())) {
                    const newList = [...employers, workScheduleName.trim()];
                    await User.updateMyUserData({ employers: newList });
                    setEmployers(newList);
                    setWorkScheduleName('');
                    toast({ title: '✅ Werkgever toegevoegd' });
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
                disabled={!workScheduleName.trim()}
              >
                Toevoegen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}