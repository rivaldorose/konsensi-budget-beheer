import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Download, ArrowLeft, ChevronDown, User as UserIcon, Building, FileText } from 'lucide-react';
import { User } from '@/api/entities';

export default function AlreadyPaidForm({ debt, onGenerateLetter, onBack }) {
    const [user, setUser] = useState(null);
    const [userSectionOpen, setUserSectionOpen] = useState(true);
    const [creditorSectionOpen, setCreditorSectionOpen] = useState(true);
    const [detailsSectionOpen, setDetailsSectionOpen] = useState(true);
    
    const [paymentData, setPaymentData] = useState({
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
        // Betaling details
        payment_date: '',
        payment_amount: debt?.amount || '',
        payment_account: '',
        payment_recipient: debt?.creditor_name || '',
        payment_reference: debt?.case_number || '',
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await User.me();
                setUser(userData);

                // Parse user name from voornaam/achternaam or full_name
                const fullName = [userData.voornaam, userData.achternaam].filter(Boolean).join(' ') || userData.full_name || '';

                // Parse adres field: may contain "Straat 123, 1234AB Plaats"
                let parsedAddress = userData.adres || userData.address || '';
                let parsedPostcode = userData.postal_code || '';
                let parsedCity = userData.city || '';

                if (parsedAddress && (!parsedPostcode || !parsedCity)) {
                    const addressParts = parsedAddress.split(',').map(s => s.trim());
                    if (addressParts.length >= 2) {
                        parsedAddress = addressParts[0];
                        const postcodeMatch = addressParts[1].match(/^(\d{4}\s?[A-Za-z]{2})\s+(.+)$/);
                        if (postcodeMatch) {
                            parsedPostcode = parsedPostcode || postcodeMatch[1];
                            parsedCity = parsedCity || postcodeMatch[2];
                        }
                    }
                }

                setPaymentData(prev => ({
                    ...prev,
                    user_name: fullName,
                    user_address: parsedAddress,
                    user_postcode: parsedPostcode,
                    user_city: parsedCity,
                    user_email: userData.email || '',
                    // Auto-fill creditor data from debt
                    creditor_address: debt?.creditor_address || prev.creditor_address || '',
                    creditor_postcode: debt?.creditor_postcode || prev.creditor_postcode || '',
                    creditor_city: debt?.creditor_city || prev.creditor_city || '',
                }));
                // Auto-collapse sections when user data is filled
                if (fullName && parsedAddress) {
                    setUserSectionOpen(false);
                }
                // Collapse creditor section - name is always known
                if (debt?.creditor_name) {
                    setCreditorSectionOpen(false);
                }
                // Details section stays open since user needs to fill payment details
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUser();
    }, [debt]);

    const handleChange = (field, value) => {
        setPaymentData(prev => ({ ...prev, [field]: value }));
    };

    const isFormValid = () => {
        return paymentData.payment_date && paymentData.payment_amount && paymentData.payment_reference;
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={onBack} className="mb-2 -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar keuze
            </Button>
            
            <div>
                <h3 className="text-lg font-semibold">📄 Ik heb dit al betaald</h3>
                <p className="text-sm text-muted-foreground">Vul de gegevens in volgens het Juridisch Loket template.</p>
            </div>

            {/* JOUW GEGEVENS */}
            <Collapsible open={userSectionOpen} onOpenChange={setUserSectionOpen}>
                <Card>
                    <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    Jouw Gegevens
                                    {!userSectionOpen && paymentData.user_name && (
                                        <span className="text-xs font-normal text-green-600 dark:text-green-400">✓ Ingevuld</span>
                                    )}
                                </h4>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${userSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {!userSectionOpen && paymentData.user_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{paymentData.user_name} — {paymentData.user_address}, {paymentData.user_postcode} {paymentData.user_city}</p>
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label htmlFor="user_name">Naam</Label>
                                <Input id="user_name" value={paymentData.user_name} onChange={e => handleChange('user_name', e.target.value)} placeholder="Voornaam Achternaam" />
                            </div>
                            <div>
                                <Label htmlFor="user_address">Adres</Label>
                                <Input id="user_address" value={paymentData.user_address} onChange={e => handleChange('user_address', e.target.value)} placeholder="Straatnaam 123" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="user_postcode">Postcode</Label>
                                    <Input id="user_postcode" value={paymentData.user_postcode} onChange={e => handleChange('user_postcode', e.target.value)} placeholder="1234 AB" />
                                </div>
                                <div>
                                    <Label htmlFor="user_city">Woonplaats</Label>
                                    <Input id="user_city" value={paymentData.user_city} onChange={e => handleChange('user_city', e.target.value)} placeholder="Amsterdam" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="user_email">E-mail</Label>
                                <Input id="user_email" type="email" value={paymentData.user_email} onChange={e => handleChange('user_email', e.target.value)} placeholder="jouw@email.nl" />
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
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    Schuldeiser Gegevens
                                    {!creditorSectionOpen && debt?.creditor_name && (
                                        <span className="text-xs font-normal text-green-600 dark:text-green-400">✓ Ingevuld</span>
                                    )}
                                </h4>
                                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${creditorSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {!creditorSectionOpen && debt?.creditor_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{debt.creditor_name}</p>
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label>Naam schuldeiser</Label>
                                <Input value={debt?.creditor_name || ''} disabled className="bg-gray-50" />
                            </div>
                            <div>
                                <Label htmlFor="creditor_department">Afdeling (optioneel)</Label>
                                <Input id="creditor_department" value={paymentData.creditor_department} onChange={e => handleChange('creditor_department', e.target.value)} placeholder="Bijv. Incasso afdeling" />
                            </div>
                            <div>
                                <Label htmlFor="creditor_address">Adres (optioneel)</Label>
                                <Input id="creditor_address" value={paymentData.creditor_address} onChange={e => handleChange('creditor_address', e.target.value)} placeholder="Straatnaam 456" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="creditor_postcode">Postcode (optioneel)</Label>
                                    <Input id="creditor_postcode" value={paymentData.creditor_postcode} onChange={e => handleChange('creditor_postcode', e.target.value)} placeholder="5678 CD" />
                                </div>
                                <div>
                                    <Label htmlFor="creditor_city">Plaats (optioneel)</Label>
                                    <Input id="creditor_city" value={paymentData.creditor_city} onChange={e => handleChange('creditor_city', e.target.value)} placeholder="Rotterdam" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="contact_person_name">Naam contactpersoon (optioneel)</Label>
                                <Input id="contact_person_name" value={paymentData.contact_person_name} onChange={e => handleChange('contact_person_name', e.target.value)} placeholder="Voor persoonlijke aanhef" />
                            </div>
                        </CollapsibleContent>
                    </CardContent>
                </Card>
            </Collapsible>

            {/* BRIEF & BETALING DETAILS */}
            <Collapsible open={detailsSectionOpen} onOpenChange={setDetailsSectionOpen}>
                <Card>
                    <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Brief & Betaling Details
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
                                <Label htmlFor="received_letter_date">Datum ontvangst brief schuldeiser</Label>
                                <Input id="received_letter_date" type="date" value={paymentData.received_letter_date} onChange={e => handleChange('received_letter_date', e.target.value)} />
                            </div>
                            
                            <div className="border-t pt-3 mt-3">
                                <h5 className="font-semibold text-sm mb-3">Betalingsgegevens *</h5>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="payment_date">Betaaldatum *</Label>
                                        <Input id="payment_date" type="date" value={paymentData.payment_date} onChange={e => handleChange('payment_date', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="payment_amount">Betaald bedrag *</Label>
                                        <Input id="payment_amount" type="number" step="0.01" value={paymentData.payment_amount} onChange={e => handleChange('payment_amount', e.target.value)} placeholder="0.00" required />
                                    </div>
                                    <div>
                                        <Label htmlFor="payment_account">Naar welk rekeningnummer? (IBAN)</Label>
                                        <Input id="payment_account" value={paymentData.payment_account} onChange={e => handleChange('payment_account', e.target.value)} placeholder="NL00BANK0000000000" />
                                    </div>
                                    <div>
                                        <Label htmlFor="payment_recipient">Ten name van</Label>
                                        <Input id="payment_recipient" value={paymentData.payment_recipient} onChange={e => handleChange('payment_recipient', e.target.value)} placeholder="Naam van de ontvanger" />
                                    </div>
                                    <div>
                                        <Label htmlFor="payment_reference">Betalingskenmerk / omschrijving *</Label>
                                        <Input id="payment_reference" value={paymentData.payment_reference} onChange={e => handleChange('payment_reference', e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </CardContent>
                </Card>
            </Collapsible>

            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="h-8 w-8 text-amber-600 flex-shrink-0" />
                    <div>
                        <h4 className="font-bold text-amber-900">BELANGRIJK: Bewijs toevoegen!</h4>
                        <p className="text-sm text-amber-800 mt-1">
                            Voeg je bankafschrift als bijlage toe aan de e-mail. Zonder bewijs zal de schuldeiser je melding waarschijnlijk negeren.
                        </p>
                         <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-amber-900">
                           <Download className="w-3 h-3 mr-1"/> Hoe download ik een afschrift?
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onBack}>Vorige</Button>
                <Button onClick={() => onGenerateLetter(paymentData)} disabled={!isFormValid()} className="bg-green-600 hover:bg-green-700">
                    Genereer brief
                </Button>
            </div>
        </div>
    );
}