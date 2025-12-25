
import React, { useState, useEffect, useCallback } from "react";
import { FAQ } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { Plus, Edit2, Trash2, Save, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' } // Added Arabic
];

const categories = [
  { value: 'algemeen', label: 'Algemeen' },
  { value: 'schulden', label: 'Schulden' },
  { value: 'budget', label: 'Budget' },
  { value: 'technisch', label: 'Technisch' },
  { value: 'beveiliging', label: 'Beveiliging' },
];

export default function FAQManager() {
  const [faqs, setFaqs] = useState([]);
  const [editingFaq, setEditingFaq] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    vraag_nl: '', antwoord_nl: '',
    vraag_en: '', antwoord_en: '',
    vraag_es: '', antwoord_es: '',
    vraag_pl: '', antwoord_pl: '',
    vraag_de: '', antwoord_de: '',
    vraag_fr: '', antwoord_fr: '',
    vraag_tr: '', antwoord_tr: '',
    vraag_ar: '', antwoord_ar: '', // Added Arabic fields
    categorie: 'algemeen',
    volgorde: 0
  });

  const loadFAQs = useCallback(async () => {
    try {
      const data = await FAQ.list('volgorde');
      setFaqs(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading FAQs:", error);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      toast({
        title: "Fout",
        description: "Fout bij laden van FAQs.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFAQs();
  }, [loadFAQs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingFaq) {
        await FAQ.update(editingFaq.id, formData); // Fixed typo: editingFag -> editingFaq
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        toast({
          title: "Succes!",
          description: "FAQ bijgewerkt!",
        });
      } else {
        await FAQ.create(formData);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        toast({
          title: "Succes!",
          description: "FAQ toegevoegd!",
        });
      }
      
      resetForm();
      loadFAQs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      toast({
        title: "Fout",
        description: "Fout bij opslaan.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      vraag_nl: faq.vraag_nl || faq.vraag || '',
      antwoord_nl: faq.antwoord_nl || faq.antwoord || '',
      vraag_en: faq.vraag_en || '',
      antwoord_en: faq.antwoord_en || '',
      vraag_es: faq.vraag_es || '',
      antwoord_es: faq.antwoord_es || '',
      vraag_pl: faq.vraag_pl || '',
      antwoord_pl: faq.antwoord_pl || '',
      vraag_de: faq.vraag_de || '',
      antwoord_de: faq.antwoord_de || '',
      vraag_fr: faq.vraag_fr || '',
      antwoord_fr: faq.antwoord_fr || '',
      vraag_tr: faq.vraag_tr || '',
      antwoord_tr: faq.antwoord_tr || '',
      vraag_ar: faq.vraag_ar || '',    // Added Arabic fields for edit
      antwoord_ar: faq.antwoord_ar || '', // Added Arabic fields for edit
      categorie: faq.categorie || 'algemeen',
      volgorde: faq.volgorde || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Weet je zeker dat je deze FAQ wilt verwijderen?")) return;
    
    try {
      await FAQ.delete(id);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      toast({
        title: "Succes!",
        description: "FAQ verwijderd!",
      });
      loadFAQs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      toast({
        title: "Fout",
        description: "Fout bij verwijderen.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      vraag_nl: '', antwoord_nl: '',
      vraag_en: '', antwoord_en: '',
      vraag_es: '', antwoord_es: '',
      vraag_pl: '', antwoord_pl: '',
      vraag_de: '', antwoord_de: '',
      vraag_fr: '', antwoord_fr: '',
      vraag_tr: '', antwoord_tr: '',
      vraag_ar: '', antwoord_ar: '', // Added Arabic fields for reset
      categorie: 'algemeen',
      volgorde: 0
    });
    setEditingFaq(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">FAQ Beheer</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#4CAF50] hover:bg-[#2D6A31]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe FAQ
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {editingFaq ? 'FAQ Bewerken' : 'Nieuwe FAQ Toevoegen'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category-select">Categorie</Label>
                      <Select
                        value={formData.categorie}
                        onValueChange={(value) => setFormData({ ...formData, categorie: value })}
                      >
                        <SelectTrigger id="category-select">
                          <SelectValue placeholder="Selecteer een categorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="volgorde-input">Volgorde</Label>
                      <Input
                        id="volgorde-input"
                        type="number"
                        value={formData.volgorde}
                        onChange={(e) => setFormData({ ...formData, volgorde: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <Tabs defaultValue="nl" className="w-full">
                    <TabsList className="grid w-full grid-cols-7 lg:grid-cols-8"> {/* Adjusted grid-cols for 8 languages */}
                      {languages.map(lang => (
                        <TabsTrigger key={lang.code} value={lang.code}>
                          <span className="text-xl mr-1">{lang.flag}</span>
                          {lang.code.toUpperCase()}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {languages.map(lang => (
                      <TabsContent key={lang.code} value={lang.code} className="space-y-4">
                        <div>
                          <Label htmlFor={`vraag-${lang.code}`}>Vraag ({lang.name})</Label>
                          <Input
                            id={`vraag-${lang.code}`}
                            value={formData[`vraag_${lang.code}`]}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              [`vraag_${lang.code}`]: e.target.value 
                            })}
                            placeholder={`Vraag in ${lang.name}`}
                            dir={lang.code === 'ar' ? 'rtl' : 'ltr'} // RTL support for Arabic input
                            className={lang.code === 'ar' ? 'text-right' : ''} // Optional: visual alignment
                          />
                        </div>
                        <div>
                          <Label htmlFor={`antwoord-${lang.code}`}>Antwoord ({lang.name})</Label>
                          <Textarea
                            id={`antwoord-${lang.code}`}
                            value={formData[`antwoord_${lang.code}`]}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              [`antwoord_${lang.code}`]: e.target.value 
                            })}
                            placeholder={`Antwoord in ${lang.name}`}
                            rows={6}
                            dir={lang.code === 'ar' ? 'rtl' : 'ltr'} // RTL support for Arabic textarea
                            className={lang.code === 'ar' ? 'text-right' : ''} // Optional: visual alignment
                          />
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Annuleren
                    </Button>
                    <Button type="submit" className="bg-[#4CAF50] hover:bg-[#2D6A31]">
                      <Save className="w-4 h-4 mr-2" />
                      Opslaan
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-[#4CAF50] text-white px-2 py-1 rounded">
                      {faq.categorie}
                    </span>
                    <span className="text-xs text-gray-500">#{faq.volgorde}</span>
                  </div>
                  <h3 className="font-semibold mb-1">
                    {faq.vraag_nl || faq.vraag || 'Geen vraag'}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {faq.antwoord_nl || faq.antwoord || 'Geen antwoord'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {languages.map(lang => (
                      <span 
                        key={lang.code}
                        className={`text-xs ${
                          faq[`vraag_${lang.code}`] ? 'opacity-100' : 'opacity-30'
                        }`}
                        title={lang.name}
                      >
                        {lang.flag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(faq)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(faq.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
