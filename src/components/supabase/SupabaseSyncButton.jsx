import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Cloud, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

export default function SupabaseSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('supabaseSync', {
        action: 'sync_all'
      });

      if (response.data.success) {
        toast({
          title: '✅ Sync succesvol',
          description: `Gesynchroniseerd: ${response.data.syncResults.debts} schulden, ${response.data.syncResults.income} inkomsten, ${response.data.syncResults.transactions} transacties`
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: '❌ Sync mislukt',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
    >
      {syncing ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Synchroniseren...
        </>
      ) : (
        <>
          <Cloud className="w-4 h-4 mr-2" />
          Sync naar Supabase
        </>
      )}
    </Button>
  );
}