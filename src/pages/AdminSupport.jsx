import React, { useState, useEffect } from 'react';
import { SupportMessage } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { MessageCircle, Clock, CheckCircle2, AlertCircle, Send, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

const statusColors = {
  nieuw: 'bg-blue-100 text-blue-800',
  in_behandeling: 'bg-yellow-100 text-yellow-800',
  afgehandeld: 'bg-green-100 text-green-800'
};

const priorityColors = {
  laag: 'bg-gray-100 text-gray-800',
  normaal: 'bg-blue-100 text-blue-800',
  hoog: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const subjectIcons = {
  vraag: '❓',
  bug: '🐛',
  feedback: '💡',
  feature_request: '✨',
  hulp_nodig: '🆘'
};

export default function AdminSupport() {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const data = await SupportMessage.list('-created_date', 100);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!response.trim() || !selectedMessage) return;

    setSending(true);
    try {
      // Update het support bericht
      await SupportMessage.update(selectedMessage.id, {
        admin_response: response.trim(),
        responded_at: new Date().toISOString(),
        status: 'afgehandeld'
      });

      // Verstuur e-mail via Resend backend functie
      const emailSubject = `Re: ${selectedMessage.subject === 'bug' ? 'Bug melding' : 
                             selectedMessage.subject === 'vraag' ? 'Je vraag' :
                             selectedMessage.subject === 'feedback' ? 'Je feedback' :
                             selectedMessage.subject === 'feature_request' ? 'Je feature verzoek' :
                             selectedMessage.subject === 'hulp_nodig' ? 'Je hulpvraag' : 'Je bericht'}`;

      const emailResponse = await base44.functions.invoke('sendSupportEmail', {
        to: selectedMessage.user_email,
        subject: emailSubject,
        message: response.trim(),
        originalMessage: selectedMessage.message
      });

      if (emailResponse.data.success) {
        toast({
          title: '✅ Reactie verstuurd',
          description: 'De gebruiker heeft een e-mail ontvangen met jouw reactie vanaf support@konsensi-budgetbeheer.nl',
          variant: 'success'
        });
      } else {
        throw new Error('Email sending failed');
      }

      setResponse('');
      setSelectedMessage(null);
      loadMessages();
    } catch (error) {
      console.error('Error responding:', error);
      toast({
        title: '❌ Fout',
        description: 'Er ging iets mis bij het versturen van de e-mail',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (messageId, newStatus) => {
    try {
      await SupportMessage.update(messageId, { status: newStatus });
      loadMessages();
      toast({ title: '✅ Status bijgewerkt', variant: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredMessages = messages.filter(m => 
    filterStatus === 'all' || m.status === filterStatus
  );

  const stats = {
    nieuw: messages.filter(m => m.status === 'nieuw').length,
    in_behandeling: messages.filter(m => m.status === 'in_behandeling').length,
    afgehandeld: messages.filter(m => m.status === 'afgehandeld').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Support Berichten</h1>
        <p className="text-gray-600">Beheer en beantwoord gebruikersvragen</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nieuw</p>
                <p className="text-3xl font-bold text-blue-600">{stats.nieuw}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">In behandeling</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.in_behandeling}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Afgehandeld</p>
                <p className="text-3xl font-bold text-green-600">{stats.afgehandeld}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter op status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle berichten</SelectItem>
            <SelectItem value="nieuw">Nieuwe berichten</SelectItem>
            <SelectItem value="in_behandeling">In behandeling</SelectItem>
            <SelectItem value="afgehandeld">Afgehandeld</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Geen berichten gevonden</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card 
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedMessage?.id === message.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{subjectIcons[message.subject] || '📧'}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{message.user_email}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(message.created_date), 'dd MMM yyyy - HH:mm', { locale: nl })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={statusColors[message.status]}>
                        {message.status}
                      </Badge>
                      <Badge className={priorityColors[message.priority]}>
                        {message.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{message.message}</p>
                  {message.page_url && (
                    <p className="text-xs text-gray-400 mt-2">📍 {message.page_url}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{subjectIcons[selectedMessage.subject] || '📧'}</span>
                  Bericht Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Van:</p>
                  <p className="font-semibold">{selectedMessage.user_email}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Datum:</p>
                  <p className="font-semibold">
                    {format(new Date(selectedMessage.created_date), 'dd MMMM yyyy - HH:mm', { locale: nl })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Status:</p>
                  <Select 
                    value={selectedMessage.status} 
                    onValueChange={(val) => updateStatus(selectedMessage.id, val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nieuw">Nieuw</SelectItem>
                      <SelectItem value="in_behandeling">In behandeling</SelectItem>
                      <SelectItem value="afgehandeld">Afgehandeld</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Bericht:</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {selectedMessage.admin_response && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Jouw reactie:</p>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                      {selectedMessage.responded_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Verstuurd op {format(new Date(selectedMessage.responded_at), 'dd MMM yyyy - HH:mm', { locale: nl })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedMessage.status !== 'afgehandeld' && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Jouw reactie:</p>
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Typ hier je reactie aan de gebruiker..."
                      rows={6}
                      className="mb-3"
                    />
                    <Button 
                      onClick={handleRespond}
                      disabled={!response.trim() || sending}
                      className="w-full"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Versturen...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Verstuur E-mail
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      E-mail wordt verstuurd vanaf support@konsensi-budgetbeheer.nl
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecteer een bericht om details te bekijken</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}