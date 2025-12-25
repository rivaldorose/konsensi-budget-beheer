import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Calendar, X } from "lucide-react";
import { formatCurrency } from "@/components/utils/formatters";
// Native date helpers - no date-fns
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function PostponedPaymentTracker() {
  const [overdueItems, setOverdueItems] = useState([]);
  const [showTracker, setShowTracker] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: paymentStatuses = [] } = useQuery({
    queryKey: ['paymentStatuses', user?.email],
    queryFn: () => base44.entities.PaymentStatus.filter({ created_by: user.email }),
    enabled: !!user,
    staleTime: 1 * 60 * 1000,
  });

  // Check voor uitgestelde betalingen waarvan de nieuwe datum is bereikt/gepasseerd
  useEffect(() => {
    if (!paymentStatuses.length) return;

    const postponedAndOverdue = paymentStatuses.filter(status => {
      if (status.is_paid || !status.postponed_to_date) return false;
      
      try {
        const postponedDate = new Date(status.postponed_to_date);
        if (isNaN(postponedDate.getTime())) return false;
        
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const postponedStart = new Date(postponedDate.getFullYear(), postponedDate.getMonth(), postponedDate.getDate());
        
        return postponedStart <= todayStart;
      } catch (e) {
        console.error('Error parsing date:', e);
        return false;
      }
    });

    setOverdueItems(postponedAndOverdue);
    setShowTracker(postponedAndOverdue.length > 0);
  }, [paymentStatuses, today]);

  const markAsPaidMutation = useMutation({
    mutationFn: async (statusId) => {
      const todayStr = today.toISOString().split('T')[0];
      return await base44.entities.PaymentStatus.update(statusId, {
        is_paid: true,
        postponed_to_date: null,
        notes: `Betaald op ${todayStr} (na uitstel)`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
      toast({
        title: "✅ Gemarkeerd als betaald",
        description: "Goed gedaan! Je hebt je afspraak nagekomen.",
      });
    },
    onError: (error) => {
      console.error('Error marking as paid:', error);
      toast({
        title: "❌ Fout",
        description: "Kon status niet bijwerken",
        variant: "destructive"
      });
    }
  });

  const postponeAgainMutation = useMutation({
    mutationFn: async ({ statusId, newDate }) => {
      const existingStatus = paymentStatuses.find(s => s.id === statusId);
      const timesPostponed = (existingStatus.notes?.match(/keer uitgesteld/g) || []).length + 1;
      
      const newDateStr = newDate.toISOString().split('T')[0];
      const formatter = new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'short' });
      const formattedDate = formatter.format(newDate);

      return await base44.entities.PaymentStatus.update(statusId, {
        postponed_to_date: newDateStr,
        notes: `${existingStatus.notes || ''} | Opnieuw uitgesteld naar ${formattedDate} (${timesPostponed}e keer uitgesteld)`
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paymentStatuses'] });
      
      const timesPostponed = (data.notes?.match(/keer uitgesteld/g) || []).length;
      const formatter = new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long' });
      
      if (timesPostponed >= 3) {
        toast({
          title: "⚠️ Let op!",
          description: "Je hebt deze betaling al meerdere keren uitgesteld. Probeer hulp te zoeken als het blijft lukken.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "📅 Opnieuw uitgesteld",
          description: `Nieuwe betaaldatum: ${formatter.format(variables.newDate)}`,
        });
      }
    },
    onError: (error) => {
      console.error('Error postponing:', error);
      toast({
        title: "❌ Fout",
        description: "Kon datum niet bijwerken",
        variant: "destructive"
      });
    }
  });

  const handlePostponeAgain = (statusId) => {
    // Stel standaard 1 week uit
    const newDate = new Date(today);
    newDate.setDate(newDate.getDate() + 7);
    
    postponeAgainMutation.mutate({ statusId, newDate });
  };

  const dismissReminder = async (statusId) => {
    try {
      const todayStr = today.toISOString().split('T')[0];
      await base44.entities.PaymentStatus.update(statusId, {
        notes: `Herinnering genegeerd op ${todayStr}`
      });
      
      setOverdueItems(prev => prev.filter(item => item.id !== statusId));
      
      if (overdueItems.length === 1) {
        setShowTracker(false);
      }
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  if (!showTracker || overdueItems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40"
      >
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300 shadow-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">
                  📅 Uitgestelde betaling{overdueItems.length > 1 ? 'en' : ''} - Check-in
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Je had afgesproken om {overdueItems.length === 1 ? 'deze betaling' : 'deze betalingen'} vandaag te doen. Heb je inmiddels betaald?
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {overdueItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{item.cost_name}</p>
                      <p className="text-sm text-gray-600">{formatCurrency(item.cost_amount)}</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Nieuwe datum was: {(() => {
                          try {
                            const date = new Date(item.postponed_to_date);
                            if (isNaN(date.getTime())) return 'Onbekend';
                            return new Intl.DateTimeFormat('nl', { day: 'numeric', month: 'long' }).format(date);
                          } catch (e) {
                            return 'Onbekend';
                          }
                        })()}
                      </p>
                    </div>
                    <button
                      onClick={() => dismissReminder(item.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => markAsPaidMutation.mutate(item.id)}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={markAsPaidMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Ja, betaald
                    </Button>
                    <Button
                      onClick={() => handlePostponeAgain(item.id)}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-orange-300 text-orange-700"
                      disabled={postponeAgainMutation.isPending}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Nog niet
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}