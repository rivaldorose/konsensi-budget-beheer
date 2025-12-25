
import React, { useEffect, useState, useCallback } from "react";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/components/utils/LanguageContext";
import { createPageUrl } from "@/utils";

export default function BankConnected() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');
  const { t } = useTranslation();

  const handleCallback = useCallback(async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(t('bank.connectionFailed'));
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage(t('bank.noCodeReceived'));
        return;
      }

      const user = await User.me();

      // Call backend to process the callback
      const response = await fetch('/api/tink/handle-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code,
          user_id: user.id 
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(t('bank.connectionSuccess', { count: data.accounts_count }));
        
        // Redirect to bank connections page after 2 seconds
        setTimeout(() => {
          window.location.href = createPageUrl('BankConnections');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || t('bank.connectionFailed'));
      }
    } catch (error) {
      console.error("Error handling callback:", error);
      setStatus('error');
      setMessage(t('bank.connectionFailed'));
    }
  }, [t]); // Added t as a dependency for useCallback

  useEffect(() => {
    handleCallback();
  }, [handleCallback]); // Added handleCallback as a dependency for useEffect

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 text-[#4CAF50] mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('bank.connecting')}
              </h2>
              <p className="text-gray-600">
                {t('bank.pleaseWait')}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('bank.connected')}
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <Button
                onClick={() => window.location.href = createPageUrl('BankConnections')}
                className="bg-[#4CAF50] hover:bg-[#2D6A31]"
              >
                {t('bank.goToAccounts')}
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('bank.connectionFailed')}
              </h2>
              <p className="text-gray-600 mb-6">
                {message}
              </p>
              <Button
                onClick={() => window.location.href = createPageUrl('BankConnections')}
                variant="outline"
              >
                {t('common.tryAgain')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
