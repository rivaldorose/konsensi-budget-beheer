
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VtblSetting } from '@/api/entities';
import { User } from '@/api/entities';
import { useToast } from "@/components/ui/toast";
import { Loader2, Plus, Trash2 } from 'lucide-react';

const Section = ({ title, children }) => (
    <div className="border-t pt-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

export default function VtblSettingsModal({ isOpen, onClose }) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settingsId, setSettingsId] = useState(null);
    const [formData, setFormData] = useState({
        household_type: 'single',
        children_ages: [],
        has_chronic_illness: false,
        has_disability: false,
        requires_special_diet: false,
        has_work_travel: false,
        work_travel_km: '',
        work_travel_type: 'public_transport',
        requires_work_clothing: false,
        pays_alimony: false,
        alimony_amount: '',
        is_caregiver: false,
        has_pet: false,
        pet_type: 'small',
        location_type: 'city',
        postal_code: ''
    });

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const user = await User.me();
            const existingSettings = await VtblSetting.filter({ user_id: user.id });
            if (existingSettings.length > 0) {
                const data = existingSettings[0];
                setSettingsId(data.id);
                // Ensure children_ages is an array
                const childrenAges = Array.isArray(data.children_ages) ? data.children_ages : [];
                setFormData(prevData => ({ ...prevData, ...data, children_ages: childrenAges }));
            }
        } catch (error) {
            console.error("Error loading VTBL settings:", error);
            toast({ title: "Fout", description: "Kon bestaande instellingen niet laden.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (isOpen) {
            loadSettings();
        }
    }, [isOpen, loadSettings]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (field) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };
    
    const handleAddChild = () => {
        setFormData(prev => ({
            ...prev,
            children_ages: [...(prev.children_ages || []), { age: '' }]
        }));
    };

    const handleChildAgeChange = (index, age) => {
        const newAges = [...(formData.children_ages || [])];
        newAges[index] = { age: parseInt(age, 10) || 0 };
        setFormData(prev => ({ ...prev, children_ages: newAges }));
    };

    const handleRemoveChild = (index) => {
        const newAges = [...(formData.children_ages || [])];
        newAges.splice(index, 1);
        setFormData(prev => ({ ...prev, children_ages: newAges }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSave = {
                ...formData,
                num_children: formData.children_ages.length,
                work_travel_km: formData.has_work_travel ? parseInt(formData.work_travel_km) || 0 : null,
                alimony_amount: formData.pays_alimony ? parseFloat(formData.alimony_amount) || 0 : null,
            };

            if (settingsId) {
                await VtblSetting.update(settingsId, dataToSave);
            } else {
                await VtblSetting.create(dataToSave);
            }
            toast({ title: "Succes!", description: "Je situatie is opgeslagen." });
            onClose();
        } catch (error) {
            console.error("Error saving VTBL settings:", error);
            toast({ title: "Fout", description: "Kon je situatie niet opslaan.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading && isOpen) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent>
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Jouw Financiële Situatie</DialogTitle>
                    <DialogDescription>
                        Deze gegevens helpen ons een realistische VTBL (Vrij Te Laten Bedrag) berekening te maken. Dit is anoniem en wordt alleen voor jou gebruikt.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <Section title="1. Huishouden">
                        <RadioGroup value={formData.household_type} onValueChange={(v) => handleFieldChange('household_type', v)}>
                            <div className="grid grid-cols-2 gap-2">
                                <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
                                    <RadioGroupItem value="single" /> Alleenstaand
                                </Label>
                                <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
                                    <RadioGroupItem value="couple" /> Samenwonend
                                </Label>
                                <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
                                    <RadioGroupItem value="single_parent" /> Alleenstaande ouder
                                </Label>
                                <Label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
                                    <RadioGroupItem value="student" /> Student
                                </Label>
                            </div>
                        </RadioGroup>
                    </Section>

                    <Section title="2. Kinderen">
                        <p className="text-sm text-gray-600">Voeg per kind de leeftijd toe. Dit is belangrijk voor de berekening.</p>
                        <div className="space-y-2">
                            {(formData.children_ages || []).map((child, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Leeftijd"
                                        value={child.age || ''}
                                        onChange={(e) => handleChildAgeChange(index, e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveChild(index)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" onClick={handleAddChild} className="w-full">
                            <Plus className="w-4 h-4 mr-2" /> Kind toevoegen
                        </Button>
                    </Section>

                    <Accordion type="multiple" className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="font-semibold text-lg text-gray-800">3. Gezondheid</AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="chronic_illness" checked={formData.has_chronic_illness} onCheckedChange={() => handleCheckboxChange('has_chronic_illness')} />
                                    <Label htmlFor="chronic_illness">Ik ben chronisch ziek</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="disability" checked={formData.has_disability} onCheckedChange={() => handleCheckboxChange('has_disability')} />
                                    <Label htmlFor="disability">Ik heb een lichamelijke beperking</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="special_diet" checked={formData.requires_special_diet} onCheckedChange={() => handleCheckboxChange('requires_special_diet')} />
                                    <Label htmlFor="special_diet">Ik heb extra kosten voor een dieet</Label>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger className="font-semibold text-lg text-gray-800">4. Werk & Verplichtingen</AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="work_travel" checked={formData.has_work_travel} onCheckedChange={() => handleCheckboxChange('has_work_travel')} />
                                    <Label htmlFor="work_travel">Ik heb reiskosten voor werk</Label>
                                </div>
                                {formData.has_work_travel && (
                                    <div className="pl-6 space-y-2">
                                        <Input type="number" placeholder="Aantal KM (enkele reis)" value={formData.work_travel_km} onChange={e => handleFieldChange('work_travel_km', e.target.value)} />
                                        <RadioGroup value={formData.work_travel_type} onValueChange={(v) => handleFieldChange('work_travel_type', v)} className="flex gap-4">
                                            <Label><RadioGroupItem value="car" className="mr-2"/>Auto</Label>
                                            <Label><RadioGroupItem value="public_transport" className="mr-2"/>OV</Label>
                                        </RadioGroup>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="work_clothing" checked={formData.requires_work_clothing} onCheckedChange={() => handleCheckboxChange('requires_work_clothing')} />
                                    <Label htmlFor="work_clothing">Ik heb kosten voor werkkleding/gereedschap</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="alimony" checked={formData.pays_alimony} onCheckedChange={() => handleCheckboxChange('pays_alimony')} />
                                    <Label htmlFor="alimony">Ik betaal alimentatie</Label>
                                </div>
                                {formData.pays_alimony && (
                                    <div className="pl-6">
                                        <Input type="number" placeholder="Bedrag per maand" value={formData.alimony_amount} onChange={e => handleFieldChange('alimony_amount', e.target.value)} />
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="caregiver" checked={formData.is_caregiver} onCheckedChange={() => handleCheckboxChange('is_caregiver')} />
                                    <Label htmlFor="caregiver">Ik ben mantelzorger (met extra kosten)</Label>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger className="font-semibold text-lg text-gray-800">5. Overig</AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="pet" checked={formData.has_pet} onCheckedChange={() => handleCheckboxChange('has_pet')} />
                                    <Label htmlFor="pet">Ik heb een huisdier</Label>
                                </div>
                                {formData.has_pet && (
                                    <div className="pl-6">
                                        <RadioGroup value={formData.pet_type} onValueChange={(v) => handleFieldChange('pet_type', v)} className="flex gap-4">
                                            <Label><RadioGroupItem value="dog" className="mr-2"/>Hond</Label>
                                            <Label><RadioGroupItem value="cat" className="mr-2"/>Kat</Label>
                                            <Label><RadioGroupItem value="small" className="mr-2"/>Klein dier</Label>
                                        </RadioGroup>
                                    </div>
                                )}
                                <div>
                                    <Label>Locatie</Label>
                                    <RadioGroup value={formData.location_type} onValueChange={(v) => handleFieldChange('location_type', v)} className="flex gap-4 mt-2">
                                        <Label><RadioGroupItem value="big_city" className="mr-2"/>Grote stad</Label>
                                        <Label><RadioGroupItem value="city" className="mr-2"/>Stad</Label>
                                        <Label><RadioGroupItem value="village" className="mr-2"/>Dorp</Label>
                                    </RadioGroup>
                                </div>
                                <div>
                                    <Label htmlFor="postal_code">Postcode</Label>
                                    <Input id="postal_code" placeholder="Bijv. 1234 AB" value={formData.postal_code} onChange={e => handleFieldChange('postal_code', e.target.value)} />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Annuleren</Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {saving ? 'Opslaan...' : 'Situatie Opslaan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
