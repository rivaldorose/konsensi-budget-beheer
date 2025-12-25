import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { WishlistItem } from "@/api/entities";
import { Plus, ExternalLink, Trash2, Star, CheckCircle2, PiggyBank, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/components/utils/formatters';
import { useToast } from "@/components/ui/use-toast";

const NIBUD_LABELS = {
  'wonen': '🏠 Wonen',
  'eten_drinken': '🍽️ Eten & Drinken',
  'vervoer': '🚗 Vervoer',
  'uitgaan': '🎉 Uitgaan',
  'zorg': '💊 Zorg',
  'energie': '⚡ Energie',
  'telefoon_internet': '📱 Telefoon/Internet',
  'kleding': '👕 Kleding',
  'sparen_buffer': '💰 Sparen/Buffer',
  'overig': '📦 Overig'
};

export default function WishlistManager({ userEmail }) {
  const [wishlists, setWishlists] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [isCollapsed, setIsCollapsed] = useState(true);

  const [formData, setFormData] = useState({
    list_name: '',
    item_name: '',
    target_amount: '',
    current_amount: 0,
    product_link: '',
    category: 'overig',
    priority: 3,
    notes: ''
  });

  useEffect(() => {
    if (userEmail) {
      loadWishlists();
    }
  }, [userEmail]);

  const loadWishlists = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const items = await WishlistItem.filter({ created_by: userEmail });
      setWishlists(items);

      // Groepeer items per list_name
      const grouped = items.reduce((acc, item) => {
        if (!acc[item.list_name]) {
          acc[item.list_name] = [];
        }
        acc[item.list_name].push(item);
        return acc;
      }, {});

      setGroupedItems(grouped);
    } catch (error) {
      console.error('Error loading wishlists:', error);
      toast({ title: 'Fout', description: 'Kon verlanglijsten niet laden', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.list_name || !formData.item_name || !formData.target_amount) {
      toast({ title: 'Fout', description: 'Vul alle verplichte velden in', variant: 'destructive' });
      return;
    }

    try {
      const data = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || 0),
        priority: parseInt(formData.priority)
      };

      if (editingItem) {
        await WishlistItem.update(editingItem.id, data);
        toast({ title: 'Gelukt', description: 'Item bijgewerkt' });
      } else {
        await WishlistItem.create(data);
        toast({ title: 'Gelukt', description: 'Item toegevoegd aan verlanglijst' });
      }

      setShowAddModal(false);
      setEditingItem(null);
      setFormData({
        list_name: '',
        item_name: '',
        target_amount: '',
        current_amount: 0,
        product_link: '',
        category: 'overig',
        priority: 3,
        notes: ''
      });
      loadWishlists();
    } catch (error) {
      console.error('Error saving wishlist item:', error);
      toast({ title: 'Fout', description: 'Kon item niet opslaan', variant: 'destructive' });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      list_name: item.list_name,
      item_name: item.item_name,
      target_amount: item.target_amount,
      current_amount: item.current_amount || 0,
      product_link: item.product_link || '',
      category: item.category || 'overig',
      priority: item.priority || 3,
      notes: item.notes || ''
      });
    setShowAddModal(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;
    
    try {
      await WishlistItem.delete(itemId);
      toast({ title: 'Gelukt', description: 'Item verwijderd' });
      loadWishlists();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: 'Fout', description: 'Kon item niet verwijderen', variant: 'destructive' });
    }
  };

  const handleAddToSavings = async (item) => {
    const amount = parseFloat(prompt(`Hoeveel wil je toevoegen aan "${item.item_name}"?`, '0'));
    if (isNaN(amount) || amount <= 0) return;

    try {
      const newAmount = (item.current_amount || 0) + amount;
      const isCompleted = newAmount >= item.target_amount;

      await WishlistItem.update(item.id, {
        current_amount: newAmount,
        is_completed: isCompleted,
        completed_date: isCompleted ? new Date().toISOString().split('T')[0] : null
      });

      toast({ 
        title: isCompleted ? '🎉 Doel behaald!' : 'Gelukt', 
        description: isCompleted 
          ? `Je hebt ${formatCurrency(newAmount)} gespaard voor ${item.item_name}!`
          : `${formatCurrency(amount)} toegevoegd aan ${item.item_name}`
      });
      loadWishlists();
    } catch (error) {
      console.error('Error adding to savings:', error);
      toast({ title: 'Fout', description: 'Kon niet toevoegen', variant: 'destructive' });
    }
  };

  if (!userEmail || loading) {
    return <div className="text-center py-8">Verlanglijsten laden...</div>;
  }

  return (
    <>
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowAddModal(true)} 
          variant="outline"
          className="border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          <Plus className="w-4 h-4 mr-2" />
          Toevoegen
        </Button>
      </div>

      {Object.keys(groupedItems).length > 0 && (
        <Card className="border-purple-200 mt-6">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">🎁 Verlanglijsten</h2>
                <span className="text-sm text-gray-500">({Object.values(groupedItems).flat().length} items)</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
                {Object.entries(groupedItems).map(([listName, items]) => {
                  const totalTarget = items.reduce((sum, item) => sum + (item.target_amount || 0), 0);
                  const totalSaved = items.reduce((sum, item) => sum + (item.current_amount || 0), 0);
                  const listProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

                  return (
                    <div key={listName} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-purple-900">{listName}</h3>
                          <p className="text-xs text-gray-500">{items.length} item(s)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setFormData({ ...formData, list_name: listName });
                              setShowAddModal(true);
                            }}
                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-700">
                              {formatCurrency(totalSaved)}
                            </p>
                            <p className="text-xs text-gray-500">van {formatCurrency(totalTarget)}</p>
                          </div>
                        </div>
                      </div>
                      <Progress value={Math.min(listProgress, 100)} className="h-2 mb-3" />
                      <div className="space-y-3">
                        {items.sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(item => {
                    const progress = item.target_amount > 0 
                      ? ((item.current_amount || 0) / item.target_amount) * 100 
                      : 0;

                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 rounded-lg border ${item.is_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{item.item_name}</h4>
                              {item.is_completed && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                              {item.priority >= 4 && !item.is_completed && (
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            
                            {item.category && (
                              <p className="text-xs text-gray-500 mb-2">
                                {NIBUD_LABELS[item.category] || item.category}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-sm mb-2">
                              <span className="font-medium text-purple-700">
                                {formatCurrency(item.current_amount || 0)}
                              </span>
                              <span className="text-gray-400">/</span>
                              <span className="text-gray-600">{formatCurrency(item.target_amount)}</span>
                            </div>

                            <Progress value={Math.min(progress, 100)} className="h-1.5 mb-2" />
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              {item.product_link && (
                                <a
                                  href={item.product_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Bekijk product
                                </a>
                              )}
                              
                              {!item.is_completed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddToSavings(item)}
                                  className="text-xs h-7"
                                >
                                  <PiggyBank className="w-3 h-3 mr-1" />
                                  Storten
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                                className="text-xs h-7"
                              >
                                Bewerken
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                className="text-xs h-7 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>

                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">{item.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        setShowAddModal(open);
        if (!open) {
          setEditingItem(null);
          setFormData({
            list_name: '',
            item_name: '',
            target_amount: '',
            current_amount: 0,
            product_link: '',
            category: 'overig',
            priority: 3,
            notes: ''
          });
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Item Bewerken' : 'Nieuw Verlanglijst Item'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="list_name">Naam van de lijst *</Label>
                <Input
                  id="list_name"
                  value={formData.list_name}
                  onChange={(e) => setFormData({ ...formData, list_name: e.target.value })}
                  placeholder="bijv. Vakantie 2026"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Items met dezelfde lijstnaam worden gegroepeerd</p>
              </div>

              <div>
                <Label htmlFor="item_name">Naam van het item *</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="bijv. Nieuwe laptop"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_amount">Bedrag (€) *</Label>
                <Input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="current_amount">Al gespaard (€)</Label>
                <Input
                  id="current_amount"
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="product_link">Link naar artikel</Label>
              <div className="flex gap-2">
                <Input
                  id="product_link"
                  type="url"
                  value={formData.product_link}
                  onChange={(e) => setFormData({ ...formData, product_link: e.target.value })}
                  placeholder="https://..."
                  className="flex-1"
                />
                {!editingItem && (
                  <Button
                    type="button"
                    size="icon"
                    className="bg-purple-600 hover:bg-purple-700 h-10 w-10"
                    onClick={async () => {
                      if (!formData.list_name || !formData.item_name || !formData.target_amount) {
                        toast({ title: 'Fout', description: 'Vul alle verplichte velden in', variant: 'destructive' });
                        return;
                      }
                      try {
                        await WishlistItem.create({
                          ...formData,
                          target_amount: parseFloat(formData.target_amount),
                          current_amount: parseFloat(formData.current_amount || 0),
                          priority: parseInt(formData.priority)
                        });
                        toast({ title: 'Gelukt', description: 'Item toegevoegd' });
                        setFormData({
                          ...formData,
                          item_name: '',
                          target_amount: '',
                          current_amount: 0,
                          product_link: '',
                          priority: 3,
                          notes: ''
                        });
                        loadWishlists();
                      } catch (error) {
                        toast({ title: 'Fout', description: 'Kon item niet opslaan', variant: 'destructive' });
                      }
                    }}
                    title="Toevoegen en nog een"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NIBUD_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioriteit (1-5)</Label>
                <Select
                  value={String(formData.priority)}
                  onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Laag</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3 - Gemiddeld</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5 - Hoog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Extra info over dit item..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                {editingItem ? 'Bijwerken' : 'Opslaan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}