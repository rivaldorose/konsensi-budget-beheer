
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { BankConnection } from "@/api/entities";
import { BankTransaction } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Link as LinkIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useTranslation } from "@/components/utils/LanguageContext";

export default function BankConnections() {
  const [connections, setConnections] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const loadData = useCallback(async () => {
    try {
      const user = await User.me();
      const connectionsData = await BankConnection.filter({ created_by: user.email }, '-last_synced_at');
      setConnections(connectionsData);

      if (connectionsData.length > 0) {
        const txData = await BankTransaction.filter({ created_by: user.email }, '-date', 50);
        setTransactions(txData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading bank data:", error);
      toast.error(t('bank.errorLoading'));
      setLoading(false);
    }
  }, [toast, t]); // Dependencies for useCallback

  useEffect(() => {
    loadData();
  }, [loadData]); // Dependency for useEffect

  const handleConnectBank = async () => {
    try {
      // This will call backend function to get Tink authorization URL
      const response = await fetch('/api/tink/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: (await User.me()).id })
      });

      const data = await response.json();
      
      if (data.link) {
        // Redirect to Tink authorization
        window.location.href = data.link;
      } else {
        toast.error(t('bank.errorConnecting'));
      }
    } catch (error) {
      console.error("Error connecting bank:", error);
      toast.error(t('bank.errorConnecting'));
    }
  };

  const handleSync = async (connectionId) => {
    setSyncing(true);
    try {
      const response = await fetch('/api/tink/sync-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(t('bank.syncSuccess', { count: data.new_transactions }));
        loadData();
      } else {
        toast.error(t('bank.syncError'));
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast.error(t('bank.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (connection) => {
    if (!confirm(t('bank.confirmDisconnect', { bank: connection.bank_name }))) {
      return;
    }

    try {
      await BankConnection.update(connection.id, { status: 'disconnected' });
      toast.success(t('bank.disconnected'));
      loadData();
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error(t('common.error'));
    }
  };

  const totalBalance = connections
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (c.balance || 0), 0);

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded mb-6 w-48"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('bank.title')}
          </h1>
          <p className="text-gray-600">{t('bank.subtitle')}</p>
        </div>
        <Button
          onClick={handleConnectBank}
          className="bg-[#4CAF50] hover:bg-[#2D6A31]"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('bank.connectBank')}
        </Button>
      </div>

      {/* Total Balance Card */}
      {connections.length > 0 && (
        <Card className="bg-gradient-to-br from-[#4CAF50] to-[#2D6A31] text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">{t('bank.totalBalance')}</p>
                <p className="text-4xl font-bold">
                  {hideBalances ? '€•••••' : `€${totalBalance.toFixed(2)}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHideBalances(!hideBalances)}
                className="text-white hover:bg-white/20"
              >
                {hideBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            <p className="text-white/80 text-sm">
              {connections.filter(c => c.status === 'active').length} {t('bank.activeAccounts')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Connected Banks */}
      <Card>
        <CardHeader>
          <CardTitle>{t('bank.connectedBanks')}</CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('bank.noBanksConnected')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('bank.connectFirstBank')}
              </p>
              <Button
                onClick={handleConnectBank}
                className="bg-[#4CAF50] hover:bg-[#2D6A31]"
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                {t('bank.connectYourBank')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((connection) => (
                <motion.div
                  key={connection.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#4CAF50] rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{connection.bank_name}</h3>
                        <Badge className={
                          connection.status === 'active' ? 'bg-green-100 text-green-700' :
                          connection.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {connection.status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {connection.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {t(`bank.status.${connection.status}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {connection.account_holder_name} • •••• {connection.iban_last_4}
                      </p>
                      {connection.last_synced_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t('bank.lastSync')}: {format(new Date(connection.last_synced_at), 'dd MMM HH:mm', { locale: nl })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {hideBalances ? '€•••' : `€${connection.balance?.toFixed(2) || '0.00'}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(connection.id)}
                        disabled={syncing || connection.status !== 'active'}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                        {t('bank.sync')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(connection)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('bank.recentTransactions')}</CardTitle>
              <Button variant="ghost" size="sm">
                {t('bank.viewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.amount > 0 ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.merchant || tx.description}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(tx.date), 'dd MMM yyyy', { locale: nl })}
                        {tx.category && ` • ${tx.category}`}
                      </p>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {tx.amount > 0 ? '+' : ''}€{Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
