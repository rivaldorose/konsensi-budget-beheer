import React, { useState, useEffect } from 'react';
import { ResearchQuestion } from '@/api/entities';
import { UserResponse } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, BarChart3, Eye, EyeOff, Trash2, Download, Users } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function AdminResearch() {
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newQuestion, setNewQuestion] = useState({
    title: '',
    question: '',
    question_type: 'open',
    options: [],
    target_audience: 'iedereen',
    is_active: true,
    show_on_pages: [],
    max_responses: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [questionsData, responsesData] = await Promise.all([
        ResearchQuestion.list('-created_date', 100),
        UserResponse.list('-created_date', 500)
      ]);
      setQuestions(questionsData);
      setResponses(responsesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    if (!newQuestion.title || !newQuestion.question) {
      toast({
        title: '❌ Vul alle verplichte velden in',
        variant: 'destructive'
      });
      return;
    }

    try {
      await ResearchQuestion.create({
        ...newQuestion,
        response_count: 0
      });

      toast({ title: '✅ Vraag aangemaakt!' });
      setShowCreateModal(false);
      setNewQuestion({
        title: '',
        question: '',
        question_type: 'open',
        options: [],
        target_audience: 'iedereen',
        is_active: true,
        show_on_pages: [],
        max_responses: null
      });
      loadData();
    } catch (error) {
      console.error('Error creating question:', error);
      toast({ title: '❌ Fout bij aanmaken', variant: 'destructive' });
    }
  };

  const toggleQuestionStatus = async (questionId, currentStatus) => {
    try {
      await ResearchQuestion.update(questionId, { is_active: !currentStatus });
      loadData();
      toast({ title: currentStatus ? '⏸️ Vraag gepauzeerd' : '▶️ Vraag geactiveerd' });
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!confirm('Weet je zeker dat je deze vraag wilt verwijderen?')) return;

    try {
      await ResearchQuestion.delete(questionId);
      loadData();
      toast({ title: '✅ Vraag verwijderd' });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({ title: '❌ Fout bij verwijderen', variant: 'destructive' });
    }
  };

  const exportResponses = (questionId) => {
    const questionResponses = responses.filter(r => r.question_id === questionId);
    const dataStr = JSON.stringify(questionResponses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-responses-${questionId}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getQuestionResponses = (questionId) => {
    return responses.filter(r => r.question_id === questionId);
  };

  if (loading) {
    return <div className="p-6">Laden...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Onderzoek & Feedback</h1>
          <p className="text-gray-600">Stel vragen aan gebruikers en analyseer de antwoorden</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Vraag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totaal Vragen</p>
                <p className="text-3xl font-bold text-blue-600">{questions.length}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actieve Vragen</p>
                <p className="text-3xl font-bold text-green-600">
                  {questions.filter(q => q.is_active).length}
                </p>
              </div>
              <Eye className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totaal Responses</p>
                <p className="text-3xl font-bold text-purple-600">{responses.length}</p>
              </div>
              <Users className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map(question => {
          const questionResponses = getQuestionResponses(question.id);
          return (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{question.title}</h3>
                      <Badge variant={question.is_active ? 'default' : 'secondary'}>
                        {question.is_active ? '✅ Actief' : '⏸️ Gepauzeerd'}
                      </Badge>
                      <Badge variant="outline">{question.question_type}</Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{question.question}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>🎯 {question.target_audience}</span>
                      <span>📊 {questionResponses.length} responses</span>
                      {question.max_responses && (
                        <span>📈 Max: {question.max_responses}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedQuestion(question)}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Bekijk
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleQuestionStatus(question.id, question.is_active)}
                    >
                      {question.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportResponses(question.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {question.question_type === 'multiple_choice' && question.options?.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Opties:</p>
                    <div className="flex flex-wrap gap-2">
                      {question.options.map((opt, idx) => (
                        <Badge key={idx} variant="secondary">{opt}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {questions.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Nog geen onderzoeksvragen aangemaakt</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
                variant="outline"
              >
                Maak je eerste vraag
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Nieuwe Onderzoeksvraag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titel *</Label>
                  <Input
                    value={newQuestion.title}
                    onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                    placeholder="Korte titel voor intern gebruik"
                  />
                </div>

                <div>
                  <Label>Vraag *</Label>
                  <Textarea
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    placeholder="De vraag die gebruikers te zien krijgen"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Type Vraag</Label>
                  <Select
                    value={newQuestion.question_type}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, question_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open vraag</SelectItem>
                      <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                      <SelectItem value="rating">Rating (1-5)</SelectItem>
                      <SelectItem value="yes_no">Ja/Nee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newQuestion.question_type === 'multiple_choice' && (
                  <div>
                    <Label>Opties (1 per regel)</Label>
                    <Textarea
                      placeholder="Optie 1&#10;Optie 2&#10;Optie 3"
                      rows={4}
                      onChange={(e) => setNewQuestion({
                        ...newQuestion,
                        options: e.target.value.split('\n').filter(o => o.trim())
                      })}
                    />
                  </div>
                )}

                <div>
                  <Label>Doelgroep</Label>
                  <Select
                    value={newQuestion.target_audience}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, target_audience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iedereen">Iedereen</SelectItem>
                      <SelectItem value="met_schulden">Alleen met schulden</SelectItem>
                      <SelectItem value="zonder_schulden">Zonder schulden</SelectItem>
                      <SelectItem value="studenten">Studenten</SelectItem>
                      <SelectItem value="uitkering">Met uitkering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Max aantal responses (optioneel)</Label>
                  <Input
                    type="number"
                    value={newQuestion.max_responses || ''}
                    onChange={(e) => setNewQuestion({
                      ...newQuestion,
                      max_responses: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="Leeg = onbeperkt"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={newQuestion.is_active}
                    onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, is_active: checked })}
                  />
                  <Label>Direct activeren</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={createQuestion}
                    className="flex-1 bg-[var(--konsensi-primary)] hover:bg-[var(--konsensi-primary-dark)]"
                  >
                    Aanmaken
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuleren
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Response Detail Modal */}
      {selectedQuestion && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedQuestion(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{selectedQuestion.title}</CardTitle>
                <p className="text-sm text-gray-600">{selectedQuestion.question}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getQuestionResponses(selectedQuestion.id).map((response, idx) => (
                    <Card key={response.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm text-gray-500">
                            #{idx + 1} • {format(new Date(response.created_date), 'dd MMM yyyy HH:mm', { locale: nl })}
                          </p>
                          <Badge variant="outline">{response.created_by}</Badge>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{response.response}</p>
                        {response.user_context && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            Context: {JSON.stringify(response.user_context)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {getQuestionResponses(selectedQuestion.id).length === 0 && (
                    <p className="text-center text-gray-500 py-8">Nog geen responses ontvangen</p>
                  )}
                </div>

                <Button
                  onClick={() => setSelectedQuestion(null)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  Sluiten
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}