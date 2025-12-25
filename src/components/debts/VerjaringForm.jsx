import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ArrowLeft, ChevronDown, User as UserIcon, Building, FileText } from 'lucide-react';
import { User } from '@/api/entities';

export default function VerjaringForm({ debt, onGenerateLetter, onBack }) {
    const [user, setUser] = useState(null);
    const [userSectionOpen, setUserSectionOpen] = useState(true);
    const [creditorSectionOpen, setCreditorSectionOpen] = useState(true);
    const [detailsSectionOpen, setDetailsSectionOpen] = useState(true);
    
    const [verjaringData, setVerjaringData] = useState({
        // Gebruiker gegevens
        user_name: '',
        user_address: '',
        user_postcode: '',
        user_city: '',
        user_email: '',
        // Schuldeiser gegevens
        creditor_department: '',
        creditor_address: '',
        creditor_postcode: '',
        creditor_city: '',
        contact_person_name: '',
        // Brief details
        received_letter_date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await User.me();
                setUser(userData);
                setVerjaringData(prev => ({
                    ...prev,
                    user_name: userData.full_name || '',
                    user_address: userData.address || '',
                    user_postcode: userData.postal_code || '',
                    user_city: userData.city || '',
                    user_email: userData.email || '',
                }));
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUser();
    }, []);

    const handleChange = (field, value) => {
        setVerjaringData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = () => {
        return verjaringData.received_letter_date;
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={onBack} className="mb-2 -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar keuze
            </Button>
            
            <div>
                <h3 className="text-lg font-semibold">⏰ De schuld is te oud (verjaard)</h3>
                <p className="text-sm text-muted-foreground">Vul de gegevens in volgens het Juridisch Loket template.</p>
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Let op: Verjaring is complex</p>
                        <p>Deze brief is geschikt als je denkt dat de schuld verjaard is. De Juridisch Loket template vraagt de schuldeiser om bewijs als ze denken dat het niet verjaard is.</p>
                    </div>
                </CardContent>
            </Card>

            {/* JOUW GEGEVENS */}
            <Collapsible open={userSectionOpen} onOpenChange={setUserSectionOpen}>
                <Card>
                    <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    Jouw Gegevens
                                </h4>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${userSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label htmlFor="user_name">Naam</Label>
                                <Input id="user_name" value={verjaringData.user_name} onChange={e => handleChange('user_name', e.target.value)} placeholder="Voornaam Achternaam" />
                            </div>
                            <div>
                                <Label htmlFor="user_address">Adres</Label>
                                <Input id="user_address" value={verjaringData.user_address} onChange={e => handleChange('user_address', e.target.value)} placeholder="Straatnaam 123" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="user_postcode">Postcode</Label>
                                    <Input id="user_postcode" value={verjaringData.user_postcode} onChange={e => handleChange('user_postcode', e.target.value)} placeholder="1234 AB" />
                                </div>
                                <div>
                                    <Label htmlFor="user_city">Woonplaats</Label>
                                    <Input id="user_city" value={verjaringData.user_city} onChange={e => handleChange('user_city', e.target.value)} placeholder="Amsterdam" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="user_email">E-mail</Label>
                                <Input id="user_email" type="email" value={verjaringData.user_email} onChange={e => handleChange('user_email', e.target.value)} placeholder="jouw@email.nl" />
                            </div>
                        </CollapsibleContent>
                    </CardContent>
                </Card>
            </Collapsible>

            {/* SCHULDEISER GEGEVENS */}
            <Collapsible open={creditorSectionOpen} onOpenChange={setCreditorSectionOpen}>
                <Card>
                    <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    Schuldeiser Gegevens
                                </h4>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${creditorSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label>Naam schuldeiser</Label>
                                <Input value={debt?.creditor_name || ''} disabled className="bg-gray-50" />
                            </div>
                            <div>
                                <Label htmlFor="creditor_department">Afdeling (optioneel)</Label>
                                <Input id="creditor_department" value={verjaringData.creditor_department} onChange={e => handleChange('creditor_department', e.target.value)} placeholder="Bijv. Incasso afdeling" />
                            </div>
                            <div>
                                <Label htmlFor="creditor_address">Adres (optioneel)</Label>
                                <Input id="creditor_address" value={verjaringData.creditor_address} onChange={e => handleChange('creditor_address', e.target.value)} placeholder="Straatnaam 456" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="creditor_postcode">Postcode (optioneel)</Label>
                                    <Input id="creditor_postcode" value={verjaringData.creditor_postcode} onChange={e => handleChange('creditor_postcode', e.target.value)} placeholder="5678 CD" />
                                </div>
                                <div>
                                    <Label htmlFor="creditor_city">Plaats (optioneel)</Label>
                                    <Input id="creditor_city" value={verjaringData.creditor_city} onChange={e => handleChange('creditor_city', e.target.value)} placeholder="Rotterdam" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="contact_person_name">Naam contactpersoon (optioneel)</Label>
                                <Input id="contact_person_name" value={verjaringData.contact_person_name} onChange={e => handleChange('contact_person_name', e.target.value)} placeholder="Voor persoonlijke aanhef" />
                            </div>
                        </CollapsibleContent>
                    </CardContent>
                </Card>
            </Collapsible>

            {/* BRIEF DETAILS */}
            <Collapsible open={detailsSectionOpen} onOpenChange={setDetailsSectionOpen}>
                <Card>
                    <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Brief Details
                                </h4>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${detailsSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label>Schuldbedrag</Label>
                                <Input value={`€${(debt?.amount || 0).toFixed(2)}`} disabled className="bg-gray-50" />
                            </div>
                            <div>
                                <Label>Dossiernummer</Label>
                                <Input value={debt?.case_number || 'Niet ingevuld'} disabled className="bg-gray-50" />
                            </div>
                            <div>
                                <Label htmlFor="received_letter_date">Datum ontvangst brief schuldeiser *</Label>
                                <Input id="received_letter_date" type="date" value={verjaringData.received_letter_date} onChange={e => handleChange('received_letter_date', e.target.value)} />
                                <p className="text-xs text-gray-500 mt-1">Dit is de datum waarop je de brief van de schuldeiser ontving.</p>
                            </div>
                        </CollapsibleContent>
                    </CardContent>
                </Card>
            </Collapsible>

            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">💡 Tip van het Juridisch Loket</p>
                            <p>Deze brief legt de bewijslast bij de schuldeiser. Als zij niet binnen 14 dagen met bewijs komen dat de schuld NIET verjaard is, mag je ervan uitgaan dat het dossier wordt gesloten.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onBack}>Vorige</Button>
                <Button onClick={() => onGenerateLetter(verjaringData)} disabled={!isFormValid()} className="bg-green-600 hover:bg-green-700">
                    Genereer brief
                </Button>
            </div>
        </div>
    );
}