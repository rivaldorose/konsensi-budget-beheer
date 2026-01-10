import React, { useState, useEffect } from "react";
import { NotificationRule } from "@/api/entities";
import { User } from "@/api/entities";
import { generateNotifications } from "@/api/functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { 
  Plus, 
  Trash2, 
  Bell, 
  Mail, 
  Clock, 
  AlertTriangle,
  Euro,
  Calendar,
  Shield,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ruleTypeConfig = {
  debt_age: {
    icon: Clock,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    label: 'Schuld leeftijd',
    description: 'Notificatie wanneer schuld langer dan X dagen bestaat',
    hasThresholdDays: true,
    hasThresholdAmount: false,
    hasUrgencyLevels: false
  },
  payment_deadline: {
    icon: Calendar,
    color: 'text-red-600',
    bg: 'bg-red-50',
    label: 'Betaaltermijn',
    description: 'Notificatie X dagen voor betalingsdeadline',
    hasThresholdDays: true,
    hasThresholdAmount: false,
    hasUrgencyLevels: false
  },
  debt_amount_threshold: {
    icon: Euro,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    label: 'Bedragdrempel',
    description: 'Notificatie bij schuld boven bepaald bedrag',
    hasThresholdDays: false,
    hasThresholdAmount: true,
    hasUrgencyLevels: false
  },
  debt_escalation: {
    icon: AlertTriangle,
    color: 'text-red-700',
    bg: 'bg-red-100',
    label: 'Escalatie',
    description: 'Notificatie bij status verandering (incasso, deurwaarder, etc.)',
    hasThresholdDays: false,
    hasThresholdAmount: false,
    hasUrgencyLevels: true
  },
  payment_plan_ending: {
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'Regeling bijna afgerond',
    description: 'Motiverende notificatie wanneer betalingsregeling bijna klaar is',
    hasThresholdDays: true,
    hasThresholdAmount: false,
    hasUrgencyLevels: false
  }
};

const urgencyLevels = [
  { value: 'normaal', label: 'Normaal' },
  { value: 'aanmaning', label: 'Aanmaning' },
  { value: 'incasso', label: 'Incasso' },
  { value: 'deurwaarder_dreigt', label: 'Deurwaarder dreigt' },
  { value: 'dagvaarding', label: 'Dagvaarding' },
  { value: 'vonnis', label: 'Vonnis' },
  { value: 'beslag_dreigt', label: 'Beslag dreigt' },
  { value: 'beslag_actief', label: 'Beslag actief' }
];

export default function NotificationRulesManager() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    rule_type: 'payment_deadline',
    is_active: true,
    threshold_days: 7,
    threshold_amount: null,
    urgency_levels: [],
    channels: { in_app: true, email: false },
    custom_message: '',
    frequency: 'once'
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const user = await User.me();
      const data = await NotificationRule.filter({ user_id: user.id });
      setRules(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading rules:', error);
      toast({ title: 'Fout bij laden regels', variant: 'destructive' });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await NotificationRule.update(editingRule.id, formData);
        toast({ title: 'Notificatieregel bijgewerkt!' });
      } else {
        await NotificationRule.create(formData);
        toast({ title: 'Notificatieregel aangemaakt!' });
      }
      setShowAddForm(false);
      setEditingRule(null);
      resetForm();
      loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({ title: 'Fout bij opslaan', variant: 'destructive' });
    }
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Weet je zeker dat je deze regel wilt verwijderen?')) return;
    try {
      await NotificationRule.delete(ruleId);
      toast({ title: 'Notificatieregel verwijderd' });
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({ title: 'Fout bij verwijderen', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await NotificationRule.update(rule.id, { is_active: !rule.is_active });
      loadRules();
      toast({ 
        title: rule.is_active ? 'Regel gedeactiveerd' : 'Regel geactiveerd'
      });
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({ title: 'Fout bij wijzigen', variant: 'destructive' });
    }
  };

  const handleGenerateNow = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateNotifications', {});
      toast({ 
        title: '✅ Notificaties gegenereerd!',
        description: `${result.notifications_created} in-app, ${result.emails_sent} e-mails verstuurd`
      });
    } catch (error) {
      console.error('Error generating notifications:', error);
      toast({ 
        title: 'Fout bij genereren notificaties', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      rule_type: 'payment_deadline',
      is_active: true,
      threshold_days: 7,
      threshold_amount: null,
      urgency_levels: [],
      channels: { in_app: true, email: false },
      custom_message: '',
      frequency: 'once'
    });
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      rule_type: rule.rule_type,
      is_active: rule.is_active,
      threshold_days: rule.threshold_days || null,
      threshold_amount: rule.threshold_amount || null,
      urgency_levels: rule.urgency_levels || [],
      channels: rule.channels || { in_app: true, email: false },
      custom_message: rule.custom_message || '',
      frequency: rule.frequency || 'once'
    });
    setShowAddForm(true);
  };

  const config = ruleTypeConfig[formData.rule_type];

  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-green-600" />
            Notificatieregels
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Stel in wanneer en hoe je notificaties wilt ontvangen over je schulden
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateNow}
            disabled={generating}
            variant="outline"
            className="flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                Genereren...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Test nu
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe regel
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingRule ? 'Regel bewerken' : 'Nieuwe notificatieregel'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Type notificatie</Label>
                    <select
                      value={formData.rule_type}
                      onChange={(e) => setFormData({...formData, rule_type: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      {Object.entries(ruleTypeConfig).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">{config.description}</p>
                  </div>

                  {config.hasThresholdDays && (
                    <div>
                      <Label>Aantal dagen</Label>
                      <Input
                        type="number"
                        value={formData.threshold_days || ''}
                        onChange={(e) => setFormData({...formData, threshold_days: parseInt(e.target.value)})}
                        placeholder="7"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {config.hasThresholdAmount && (
                    <div>
                      <Label>Bedragdrempel (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.threshold_amount || ''}
                        onChange={(e) => setFormData({...formData, threshold_amount: parseFloat(e.target.value)})}
                        placeholder="500.00"
                        className="mt-1"
                      />
                    </div>
                  )}

                  {config.hasUrgencyLevels && (
                    <div>
                      <Label>Urgentieniveaus</Label>
                      <div className="mt-2 space-y-2">
                        {urgencyLevels.map((level) => (
                          <label key={level.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.urgency_levels.includes(level.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    urgency_levels: [...formData.urgency_levels, level.value]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    urgency_levels: formData.urgency_levels.filter(l => l !== level.value)
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{level.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Frequentie</Label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="once">Eenmalig per dag</option>
                      <option value="daily">Dagelijks</option>
                      <option value="weekly">Wekelijks</option>
                    </select>
                  </div>

                  <div>
                    <Label>Kanalen</Label>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={formData.channels.in_app}
                          onCheckedChange={(checked) => 
                            setFormData({
                              ...formData,
                              channels: {...formData.channels, in_app: checked}
                            })
                          }
                        />
                        <Bell className="w-4 h-4" />
                        <span className="text-sm">In-app notificatie</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={formData.channels.email}
                          onCheckedChange={(checked) => 
                            setFormData({
                              ...formData,
                              channels: {...formData.channels, email: checked}
                            })
                          }
                        />
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">E-mail notificatie</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label>Aangepaste boodschap (optioneel)</Label>
                    <Input
                      value={formData.custom_message}
                      onChange={(e) => setFormData({...formData, custom_message: e.target.value})}
                      placeholder="Laat leeg voor standaard boodschap"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingRule(null);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Annuleren
                    </Button>
                    <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
                      {editingRule ? 'Bijwerken' : 'Aanmaken'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nog geen notificatieregels ingesteld</p>
              <p className="text-sm text-gray-500 mt-2">
                Klik op "Nieuwe regel" om te beginnen
              </p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => {
            const config = ruleTypeConfig[rule.rule_type];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={rule.is_active ? '' : 'opacity-50'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{config.label}</h3>
                            <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                              {rule.is_active ? 'Actief' : 'Inactief'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{config.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {rule.threshold_days && (
                              <Badge variant="outline" className="text-xs">
                                📅 {rule.threshold_days} dagen
                              </Badge>
                            )}
                            {rule.threshold_amount && (
                              <Badge variant="outline" className="text-xs">
                                💰 €{rule.threshold_amount}
                              </Badge>
                            )}
                            {rule.urgency_levels?.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                ⚠️ {rule.urgency_levels.length} niveaus
                              </Badge>
                            )}
                            {rule.channels.in_app && (
                              <Badge variant="outline" className="text-xs">
                                <Bell className="w-3 h-3 mr-1" />
                                In-app
                              </Badge>
                            )}
                            {rule.channels.email && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                E-mail
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              🔄 {rule.frequency === 'once' ? 'Eenmalig' : rule.frequency === 'daily' ? 'Dagelijks' : 'Wekelijks'}
                            </Badge>
                          </div>

                          {rule.custom_message && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              "{rule.custom_message}"
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleActive(rule)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          Bewerken
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">AI-gestuurde prioritering</p>
              <p className="text-blue-700">
                Notificaties worden automatisch geprioriteerd op basis van urgentie, betalingstermijnen en jouw financiële situatie. Kritieke notificaties krijgen voorrang.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}