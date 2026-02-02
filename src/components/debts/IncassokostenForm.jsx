import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ArrowLeft, ChevronDown, User as UserIcon, Building, FileText, Info } from 'lucide-react';
import { User } from '@/api/entities';
import { formatCurrency } from "@/components/utils/formatters";

export default function IncassokostenForm({ debt, onGenerateLetter, onBack }) {
    const [user, setUser] = useState(null);
    const [userSectionOpen, setUserSectionOpen] = useState(true);
    const [creditorSectionOpen, setCreditorSectionOpen] = useState(true);
    const [detailsSectionOpen, setDetailsSectionOpen] = useState(true);

    const [formData, setFormData] = useState({
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
        document_type: 'rekening', // 'rekening' | 'herinneringsbrief'
        product_name: '',
        incasso_amount: '',
        // Reden bezwaar (A, B, C, D)
        reason: '',
        // Reden B specifiek - wat klopt niet
        reason_b_issues: [],
        // Reden C specifiek
        reason_c_payment_date: '',
        reason_c_payment_reference: '',
        // Reden D specifiek
        reason_d_max_amount: '',
        // Status originele rekening
        original_payment_status: 'unpaid', // 'unpaid' | 'paid'
        original_paid_date: '',
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

                setFormData(prev => ({
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
                // Keep details section OPEN - user needs to fill incasso_amount
                // setDetailsSectionOpen stays true (default)
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };
        loadUser();
    }, [debt]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleReasonBIssue = (issue) => {
        setFormData(prev => ({
            ...prev,
            reason_b_issues: prev.reason_b_issues.includes(issue)
                ? prev.reason_b_issues.filter(i => i !== issue)
                : [...prev.reason_b_issues, issue]
        }));
    };

    const isFormValid = () => {
        if (!formData.received_letter_date || !formData.reason || !formData.incasso_amount) return false;
        if (formData.reason === 'B' && formData.reason_b_issues.length === 0) return false;
        if (formData.reason === 'C' && !formData.reason_c_payment_date) return false;
        if (formData.reason === 'D' && !formData.reason_d_max_amount) return false;
        return true;
    };

    const reasons = [
        { id: 'A', label: 'Geen betalingsherinnering ontvangen', description: 'De schuldeiser heeft u niet eerst een herinnering gestuurd.' },
        { id: 'B', label: 'Herinneringsbrief klopt niet', description: 'De brief bevat fouten (verkeerde termijn, geen info over kosten, etc.)' },
        { id: 'C', label: 'Al betaald na herinnering', description: 'U heeft de rekening al op tijd betaald na de herinnering.' },
        { id: 'D', label: 'Incassokosten zijn te hoog', description: 'Het bedrag dat in rekening is gebracht is hoger dan wettelijk toegestaan.' },
    ];

    const reasonBOptions = [
        'een verkeerde betalingstermijn',
        'geen betalingstermijn',
        'verkeerde informatie over de incassokosten',
        'geen informatie over de incassokosten',
    ];

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={onBack} className="mb-2 -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar keuze
            </Button>

            <div>
                <h3 className="text-lg font-semibold">💰 Bezwaar Incassokosten</h3>
                <p className="text-sm text-muted-foreground">Vul de gegevens in volgens het Juridisch Loket template.</p>
            </div>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-semibold mb-1">Let op: Incassokosten regels</p>
                        <p>Een schuldeiser moet eerst een correcte betalingsherinnering sturen voordat incassokosten in rekening gebracht mogen worden. Met deze brief maakt u bezwaar tegen onterechte incassokosten.</p>
                    </div>
                </CardContent>
            </Card>

            {/* JOUW GEGEVENS */}
            <Collapsible open={userSectionOpen} onOpenChange={setUserSectionOpen}>
                <Card>
                    <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <UserIcon className="w-4 h-4" />
                                    Jouw Gegevens
                                    {!userSectionOpen && formData.user_name && (
                                        <span className="text-xs font-normal text-green-600 dark:text-green-400">✓ Ingevuld</span>
                                    )}
                                </h4>
                                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${userSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {!userSectionOpen && formData.user_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{formData.user_name} — {formData.user_address}, {formData.user_postcode} {formData.user_city}</p>
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label htmlFor="ik_user_name">Naam</Label>
                                <Input id="ik_user_name" value={formData.user_name} onChange={e => handleChange('user_name', e.target.value)} placeholder="Voornaam Achternaam" />
                            </div>
                            <div>
                                <Label htmlFor="ik_user_address">Adres</Label>
                                <Input id="ik_user_address" value={formData.user_address} onChange={e => handleChange('user_address', e.target.value)} placeholder="Straatnaam 123" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="ik_user_postcode">Postcode</Label>
                                    <Input id="ik_user_postcode" value={formData.user_postcode} onChange={e => handleChange('user_postcode', e.target.value)} placeholder="1234 AB" />
                                </div>
                                <div>
                                    <Label htmlFor="ik_user_city">Woonplaats</Label>
                                    <Input id="ik_user_city" value={formData.user_city} onChange={e => handleChange('user_city', e.target.value)} placeholder="Amsterdam" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="ik_user_email">E-mail</Label>
                                <Input id="ik_user_email" type="email" value={formData.user_email} onChange={e => handleChange('user_email', e.target.value)} placeholder="jouw@email.nl" />
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
                                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${creditorSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {!creditorSectionOpen && debt?.creditor_name && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{debt.creditor_name}</p>
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label>Naam schuldeiser</Label>
                                <Input value={debt?.creditor_name || ''} disabled className="bg-gray-50 dark:bg-[#2a2a2a]" />
                            </div>
                            <div>
                                <Label htmlFor="ik_creditor_department">Afdeling (optioneel)</Label>
                                <Input id="ik_creditor_department" value={formData.creditor_department} onChange={e => handleChange('creditor_department', e.target.value)} placeholder="Bijv. Incasso afdeling" />
                            </div>
                            <div>
                                <Label htmlFor="ik_creditor_address">Adres (optioneel)</Label>
                                <Input id="ik_creditor_address" value={formData.creditor_address} onChange={e => handleChange('creditor_address', e.target.value)} placeholder="Straatnaam 456" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="ik_creditor_postcode">Postcode (optioneel)</Label>
                                    <Input id="ik_creditor_postcode" value={formData.creditor_postcode} onChange={e => handleChange('creditor_postcode', e.target.value)} placeholder="5678 CD" />
                                </div>
                                <div>
                                    <Label htmlFor="ik_creditor_city">Plaats (optioneel)</Label>
                                    <Input id="ik_creditor_city" value={formData.creditor_city} onChange={e => handleChange('creditor_city', e.target.value)} placeholder="Rotterdam" />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="ik_contact_person_name">Naam contactpersoon (optioneel)</Label>
                                <Input id="ik_contact_person_name" value={formData.contact_person_name} onChange={e => handleChange('contact_person_name', e.target.value)} placeholder="Voor persoonlijke aanhef" />
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
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    Brief Details
                                    {!detailsSectionOpen && debt?.amount && (
                                        <span className="text-xs font-normal text-green-600 dark:text-green-400">✓ Ingevuld</span>
                                    )}
                                </h4>
                                <ChevronDown className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${detailsSectionOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {!detailsSectionOpen && debt?.amount && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-left">{formatCurrency(debt.amount)} — {debt.case_number || 'Geen dossiernummer'}</p>
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3">
                            <div>
                                <Label>Schuldbedrag</Label>
                                <Input value={formatCurrency(debt?.amount || 0)} disabled className="bg-gray-50 dark:bg-[#2a2a2a]" />
                            </div>
                            <div>
                                <Label>Dossiernummer</Label>
                                <Input value={debt?.case_number || 'Niet ingevuld'} disabled className="bg-gray-50 dark:bg-[#2a2a2a]" />
                            </div>
                            <div>
                                <Label htmlFor="ik_received_date">Datum ontvangst brief *</Label>
                                <Input id="ik_received_date" type="date" value={formData.received_letter_date} onChange={e => handleChange('received_letter_date', e.target.value)} />
                            </div>
                            <div>
                                <Label>Type document ontvangen</Label>
                                <div className="flex gap-2 mt-1">
                                    <Button
                                        type="button"
                                        variant={formData.document_type === 'rekening' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleChange('document_type', 'rekening')}
                                        className={formData.document_type === 'rekening' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    >
                                        Rekening
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.document_type === 'herinneringsbrief' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleChange('document_type', 'herinneringsbrief')}
                                        className={formData.document_type === 'herinneringsbrief' ? 'bg-green-600 hover:bg-green-700' : ''}
                                    >
                                        Herinneringsbrief
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="ik_product_name">Naam product of dienst</Label>
                                <Input id="ik_product_name" value={formData.product_name} onChange={e => handleChange('product_name', e.target.value)} placeholder="Bijv. telefoonabonnement" />
                            </div>
                            <div>
                                <Label htmlFor="ik_incasso_amount">Incassokosten bedrag (dat zij rekenen) *</Label>
                                <Input id="ik_incasso_amount" type="number" step="0.01" value={formData.incasso_amount} onChange={e => handleChange('incasso_amount', e.target.value)} placeholder="Bijv. 40.00" />
                            </div>
                        </CollapsibleContent>
                    </CardContent>
                </Card>
            </Collapsible>

            {/* REDEN BEZWAAR */}
            <Card>
                <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Reden bezwaar *
                    </h4>
                    <div className="space-y-2">
                        {reasons.map(r => (
                            <div
                                key={r.id}
                                onClick={() => handleChange('reason', r.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    formData.reason === r.id
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        formData.reason === r.id ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
                                    }`}>
                                        {formData.reason === r.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{r.id}. {r.label}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Reden B: Wat klopt niet */}
                    {formData.reason === 'B' && (
                        <div className="mt-4 pl-7 space-y-2">
                            <Label className="text-sm font-medium">Wat klopt er niet aan de herinneringsbrief? *</Label>
                            {reasonBOptions.map(option => (
                                <label key={option} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.reason_b_issues.includes(option)}
                                        onChange={() => toggleReasonBIssue(option)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Reden C: Betaaldatum */}
                    {formData.reason === 'C' && (
                        <div className="mt-4 pl-7 space-y-3">
                            <div>
                                <Label htmlFor="ik_reason_c_date">Datum van betaling *</Label>
                                <Input id="ik_reason_c_date" type="date" value={formData.reason_c_payment_date} onChange={e => handleChange('reason_c_payment_date', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="ik_reason_c_ref">Betalingskenmerk (optioneel)</Label>
                                <Input id="ik_reason_c_ref" value={formData.reason_c_payment_reference} onChange={e => handleChange('reason_c_payment_reference', e.target.value)} placeholder="Bijv. NL12ABCD3456789" />
                            </div>
                        </div>
                    )}

                    {/* Reden D: Max bedrag */}
                    {formData.reason === 'D' && (
                        <div className="mt-4 pl-7">
                            <Label htmlFor="ik_reason_d_max">Maximaal toegestaan bedrag volgens de wet *</Label>
                            <Input id="ik_reason_d_max" type="number" step="0.01" value={formData.reason_d_max_amount} onChange={e => handleChange('reason_d_max_amount', e.target.value)} placeholder="Bijv. 40.00" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Tip: Kijk op juridischloket.nl voor de wettelijke maxima.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* STATUS ORIGINELE REKENING */}
            <Card>
                <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3">Status originele rekening</h4>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={formData.original_payment_status === 'unpaid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleChange('original_payment_status', 'unpaid')}
                            className={formData.original_payment_status === 'unpaid' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                        >
                            Nog niet betaald
                        </Button>
                        <Button
                            type="button"
                            variant={formData.original_payment_status === 'paid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleChange('original_payment_status', 'paid')}
                            className={formData.original_payment_status === 'paid' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            Al betaald
                        </Button>
                    </div>
                    {formData.original_payment_status === 'paid' && (
                        <div className="mt-3">
                            <Label htmlFor="ik_original_paid_date">Datum van betaling</Label>
                            <Input id="ik_original_paid_date" type="date" value={formData.original_paid_date} onChange={e => handleChange('original_paid_date', e.target.value)} />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-semibold mb-1">Tip van het Juridisch Loket</p>
                            <p>U heeft 7 dagen de tijd om bezwaar te maken. Stuur deze brief aangetekend en bewaar een kopie voor uw administratie.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onBack}>Vorige</Button>
                <Button onClick={() => onGenerateLetter(formData)} disabled={!isFormValid()} className="bg-green-600 hover:bg-green-700">
                    Genereer brief
                </Button>
            </div>
        </div>
    );
}
