/**
 * KONSENSI INTELLIGENTE BETALINGSREGELING ENGINE
 *
 * Automatisch genereren van betalingsregelingsvoorstellen op basis van:
 * - Officiële VTLB berekening (WSNP normen)
 * - Incassobureau acceptatie criteria
 * - Nederlandse juridische kaders
 *
 * GEEN email verzending, GEEN tracking, GEEN ML
 * Alleen slimme berekening en UI data
 */

import { berekenVTLB, vtlbSettingsToProfiel, verdeelAfloscapaciteit } from './vtlbService';

// ============================================
// INCASSOBUREAU ACCEPTATIE PARAMETERS
// (Gebaseerd op Nederlandse praktijk research)
// ============================================

const ACCEPTATIE_CRITERIA = {
  // Minimum maandbedragen per situatie
  minimum: {
    standaard: 25,        // €25 minimum voor meeste bureaus
    student: 15,          // Studenten kunnen lager
    uitkering: 15,        // Uitkering ook lager mogelijk
    werkend: 30,          // Werkenden verwacht minimum €30
  },

  // Ideale percentages van hoofdsom per maand
  percentages: {
    hoog: 0.10,           // 10% = snel geaccepteerd
    standaard: 0.05,      // 5% = normaal acceptabel
    laag: 0.02,           // 2% = met VTLB onderbouwing
  },

  // Maximale looptijden in maanden
  looptijd: {
    ideaal: 24,           // 24 maanden = beste acceptatie
    acceptabel: 36,       // 36 maanden = nog acceptabel
    lang: 60,             // 60 maanden = met sterke onderbouwing
    maximum: 120,         // 10 jaar = uiterste grens
  },

  // Schuldgrootte categorieën
  schuldCategorie: {
    klein: 500,           // < €500
    middel: 2500,         // €500 - €2.500
    groot: 5000,          // €2.500 - €5.000
    zeerGroot: 10000,     // > €5.000
  }
};

// ============================================
// HOOFD FUNCTIES
// ============================================

/**
 * Genereer een optimaal betalingsvoorstel voor één schuld
 *
 * @param {Object} schuld - Schuld object met amount, creditor_name, etc.
 * @param {Object} vtlbData - VTLB berekening resultaat
 * @param {Object} debiteurProfiel - Profiel van de gebruiker
 * @param {string} strategie - 'conservatief', 'standaard', of 'optimistisch'
 * @returns {Object} Voorstel met maandbedrag, looptijd, kans, etc.
 */
export function genereerVoorstel(schuld, vtlbData, debiteurProfiel = {}, strategie = 'standaard') {
  const schuldBedrag = parseFloat(schuld.amount) || 0;
  const reedsBetaald = parseFloat(schuld.amount_paid) || 0;
  const resterend = schuldBedrag - reedsBetaald;

  if (resterend <= 0) {
    return {
      status: 'afbetaald',
      maandBedrag: 0,
      looptijdMaanden: 0,
      successKans: 100,
      bericht: 'Deze schuld is volledig afbetaald'
    };
  }

  // Haal beschikbare ruimte uit VTLB data
  const beschikbaar = vtlbData?.afloscapaciteit || vtlbData?.aflosCapaciteit || vtlbData?.beschikbaar || 0;
  const bestaandeRegelingen = vtlbData?.huidigeRegelingen || vtlbData?.bestaandeRegelingen || 0;

  // Bereken ruimte voor nieuwe regelingen
  const ruimteVoorNieuw = Math.max(0, beschikbaar);

  // Bepaal debiteur type
  const debiteurType = bepaalDebiteurType(debiteurProfiel);
  const minimumBedrag = ACCEPTATIE_CRITERIA.minimum[debiteurType] || ACCEPTATIE_CRITERIA.minimum.standaard;

  // Bereken optimaal maandbedrag
  let maandBedrag = berekenOptimaalBedrag(resterend, ruimteVoorNieuw, debiteurType, strategie);

  // Check of we genoeg ruimte hebben
  if (ruimteVoorNieuw < minimumBedrag) {
    return {
      status: 'onvoldoende_ruimte',
      maandBedrag: ruimteVoorNieuw,
      looptijdMaanden: ruimteVoorNieuw > 0 ? Math.ceil(resterend / ruimteVoorNieuw) : Infinity,
      successKans: berekenSuccessKans(ruimteVoorNieuw, resterend, debiteurType, Infinity),
      beschikbareRuimte: ruimteVoorNieuw,
      minimumVereist: minimumBedrag,
      bericht: `Beschikbare ruimte (€${ruimteVoorNieuw.toFixed(2)}) is lager dan minimum (€${minimumBedrag}). VTLB onderbouwing sterk nodig.`,
      advies: 'Overweeg om eerst andere lasten te verlagen of contact op te nemen met schuldhulpverlening.'
    };
  }

  // Bereken looptijd
  const looptijdMaanden = Math.ceil(resterend / maandBedrag);

  // Bereken success kans
  const successKans = berekenSuccessKans(maandBedrag, resterend, debiteurType, looptijdMaanden);

  // Bepaal status
  const status = bepaalVoorstelStatus(successKans, looptijdMaanden);

  return {
    status,
    schuld: {
      id: schuld.id,
      naam: schuld.creditor_name || schuld.name || 'Onbekend',
      totaalBedrag: schuldBedrag,
      resterend: resterend,
      reedsBetaald: reedsBetaald
    },
    voorstel: {
      maandBedrag: Math.round(maandBedrag * 100) / 100,
      looptijdMaanden: looptijdMaanden,
      totaalAfTeLossen: Math.round(maandBedrag * looptijdMaanden * 100) / 100,
      percentagePerMaand: Math.round((maandBedrag / resterend) * 1000) / 10, // 1 decimal
    },
    kansen: {
      successKans: Math.round(successKans),
      niveau: successKans >= 80 ? 'hoog' : successKans >= 60 ? 'gemiddeld' : 'laag',
      kleur: successKans >= 80 ? 'green' : successKans >= 60 ? 'orange' : 'red'
    },
    vtlb: {
      beschikbaar: ruimteVoorNieuw,
      bestaandeRegelingen: bestaandeRegelingen,
      gebruiktVoorDit: maandBedrag
    },
    debiteurType,
    strategie,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Genereer voorstellen voor alle schulden van een gebruiker
 * Verdeelt de beschikbare afloscapaciteit proportioneel
 *
 * @param {Array} schulden - Array van schuld objecten
 * @param {Object} vtlbData - VTLB berekening resultaat
 * @param {Object} debiteurProfiel - Profiel van de gebruiker
 * @param {string} strategie - 'conservatief', 'standaard', of 'optimistisch'
 * @returns {Object} Batch resultaat met alle voorstellen
 */
export function genereerBatchVoorstellen(schulden, vtlbData, debiteurProfiel = {}, strategie = 'standaard') {
  // Filter actieve schulden (niet afbetaald)
  const actieveSchulden = schulden.filter(s => {
    const resterend = (parseFloat(s.amount) || 0) - (parseFloat(s.amount_paid) || 0);
    return resterend > 0 && s.status !== 'afbetaald';
  });

  if (actieveSchulden.length === 0) {
    return {
      success: true,
      voorstellen: [],
      totaal: {
        maandBedrag: 0,
        beschikbaar: vtlbData?.afloscapaciteit || 0,
        aantalSchulden: 0
      },
      bericht: 'Geen actieve schulden om regelingen voor te genereren'
    };
  }

  const beschikbaar = vtlbData?.afloscapaciteit || vtlbData?.aflosCapaciteit || vtlbData?.beschikbaar || 0;

  // Verdeel de afloscapaciteit proportioneel over alle schulden
  const verdeling = verdeelAfloscapaciteitOverSchulden(actieveSchulden, beschikbaar);

  // Genereer voorstel voor elke schuld met het toegewezen bedrag
  const voorstellen = actieveSchulden.map((schuld, index) => {
    const toegewezenBedrag = verdeling.perSchuld[index]?.maandBedrag || 0;

    // Maak aangepaste vtlbData met het toegewezen bedrag
    const aangepasteVtlb = {
      ...vtlbData,
      afloscapaciteit: toegewezenBedrag,
      aflosCapaciteit: toegewezenBedrag,
      beschikbaar: toegewezenBedrag
    };

    return genereerVoorstel(schuld, aangepasteVtlb, debiteurProfiel, strategie);
  });

  // Bereken totalen
  const totaalMaandBedrag = voorstellen.reduce((sum, v) => sum + (v.voorstel?.maandBedrag || 0), 0);
  const gemiddeldeKans = voorstellen.reduce((sum, v) => sum + (v.kansen?.successKans || 0), 0) / voorstellen.length;

  return {
    success: true,
    voorstellen,
    totaal: {
      maandBedrag: Math.round(totaalMaandBedrag * 100) / 100,
      beschikbaar: beschikbaar,
      gebruiktPercentage: beschikbaar > 0 ? Math.round((totaalMaandBedrag / beschikbaar) * 100) : 0,
      aantalSchulden: actieveSchulden.length,
      gemiddeldeSuccessKans: Math.round(gemiddeldeKans)
    },
    verdeling: verdeling,
    generatedAt: new Date().toISOString()
  };
}

// ============================================
// HELPER FUNCTIES
// ============================================

/**
 * Bepaal debiteur type op basis van profiel
 */
function bepaalDebiteurType(profiel) {
  if (!profiel) return 'standaard';

  const status = profiel.werksituatie || profiel.status || '';

  if (status === 'student') return 'student';
  if (status === 'uitkering') return 'uitkering';
  if (['vast', 'tijdelijk', 'zzp'].includes(status)) return 'werkend';

  return 'standaard';
}

/**
 * Bereken optimaal maandbedrag
 */
function berekenOptimaalBedrag(schuldBedrag, beschikbaar, debiteurType, strategie) {
  const minimum = ACCEPTATIE_CRITERIA.minimum[debiteurType] || ACCEPTATIE_CRITERIA.minimum.standaard;

  // Begin met beschikbare ruimte
  let bedrag = beschikbaar;

  // Pas aan op basis van strategie
  switch (strategie) {
    case 'conservatief':
      bedrag = Math.floor(bedrag * 0.85); // 15% buffer
      break;
    case 'optimistisch':
      bedrag = Math.ceil(bedrag * 1.05); // 5% hoger (risico)
      break;
    default: // standaard
      bedrag = Math.floor(bedrag * 0.95); // 5% buffer
  }

  // Zorg dat we minimaal het minimum bedrag gebruiken
  bedrag = Math.max(bedrag, minimum);

  // Maar niet meer dan beschikbaar (tenzij optimistisch)
  if (strategie !== 'optimistisch') {
    bedrag = Math.min(bedrag, beschikbaar);
  }

  // Check of we niet meer betalen dan de schuld zelf
  bedrag = Math.min(bedrag, schuldBedrag);

  return bedrag;
}

/**
 * Bereken success kans (0-100%)
 */
function berekenSuccessKans(maandBedrag, schuldBedrag, debiteurType, looptijdMaanden) {
  let kans = 70; // Base 70%

  // BEDRAG IMPACT
  if (maandBedrag >= 50) {
    kans += 15; // €50+ = +15%
  } else if (maandBedrag >= 25) {
    kans += 5;  // €25-50 = +5%
  } else if (maandBedrag < 15) {
    kans -= 20; // <€15 = -20%
  } else if (maandBedrag < 25) {
    kans -= 10; // €15-25 = -10%
  }

  // PERCENTAGE VAN SCHULD IMPACT
  const percentagePerMaand = (maandBedrag / schuldBedrag) * 100;
  if (percentagePerMaand >= 8) {
    kans += 10; // 8%+ per maand = +10%
  } else if (percentagePerMaand >= 5) {
    kans += 5;  // 5-8% = +5%
  } else if (percentagePerMaand < 2) {
    kans -= 15; // <2% = -15%
  }

  // LOOPTIJD IMPACT
  if (looptijdMaanden <= 24) {
    kans += 10; // ≤2 jaar = +10%
  } else if (looptijdMaanden <= 36) {
    kans += 0;  // 2-3 jaar = neutraal
  } else if (looptijdMaanden <= 60) {
    kans -= 5;  // 3-5 jaar = -5%
  } else {
    kans -= 15; // 5+ jaar = -15%
  }

  // DEBITEUR TYPE IMPACT
  switch (debiteurType) {
    case 'student':
      kans -= 5; // Lage verwachtingen, maar ook lage acceptatie
      break;
    case 'werkend':
      kans += 5; // Hogere verwachtingen = makkelijker geaccepteerd
      break;
    case 'uitkering':
      kans -= 3; // Iets lagere acceptatie
      break;
  }

  // Begrens tussen 20% en 95%
  return Math.max(20, Math.min(95, kans));
}

/**
 * Bepaal voorstel status op basis van success kans
 */
function bepaalVoorstelStatus(successKans, looptijdMaanden) {
  if (successKans >= 80) return 'zeer_haalbaar';
  if (successKans >= 60) return 'haalbaar';
  if (successKans >= 40) return 'mogelijk';
  return 'risicovol';
}

/**
 * Verdeel afloscapaciteit proportioneel over schulden
 */
function verdeelAfloscapaciteitOverSchulden(schulden, totaalBeschikbaar) {
  const totaleSchuld = schulden.reduce((sum, s) => {
    const resterend = (parseFloat(s.amount) || 0) - (parseFloat(s.amount_paid) || 0);
    return sum + Math.max(0, resterend);
  }, 0);

  if (totaleSchuld === 0) {
    return {
      totaalSchuld: 0,
      totaalBeschikbaar,
      perSchuld: []
    };
  }

  const perSchuld = schulden.map(schuld => {
    const resterend = Math.max(0, (parseFloat(schuld.amount) || 0) - (parseFloat(schuld.amount_paid) || 0));
    const proportie = resterend / totaleSchuld;
    const maandBedrag = Math.round(totaalBeschikbaar * proportie * 100) / 100;

    return {
      schuldId: schuld.id,
      naam: schuld.creditor_name || schuld.name || 'Onbekend',
      resterend,
      proportie: Math.round(proportie * 1000) / 10, // percentage met 1 decimal
      maandBedrag
    };
  });

  return {
    totaalSchuld,
    totaalBeschikbaar,
    perSchuld
  };
}

// ============================================
// UI HELPER FUNCTIES
// ============================================

/**
 * Formatteer voorstel voor UI weergave
 */
export function formatVoorstelVoorUI(voorstel) {
  if (!voorstel || voorstel.status === 'afbetaald') {
    return null;
  }

  return {
    id: voorstel.schuld?.id,
    creditor: voorstel.schuld?.naam || 'Onbekend',
    bedrag: voorstel.schuld?.resterend || 0,

    // Voorstel details
    maandBedrag: voorstel.voorstel?.maandBedrag || 0,
    looptijd: voorstel.voorstel?.looptijdMaanden || 0,
    looptijdTekst: formatLooptijd(voorstel.voorstel?.looptijdMaanden),

    // Success indicator
    kans: voorstel.kansen?.successKans || 0,
    kansNiveau: voorstel.kansen?.niveau || 'laag',
    kansKleur: voorstel.kansen?.kleur || 'red',

    // Status
    status: voorstel.status,
    statusTekst: getStatusTekst(voorstel.status),

    // Ready state
    isReady: voorstel.status === 'zeer_haalbaar' || voorstel.status === 'haalbaar',

    // Extra info
    percentagePerMaand: voorstel.voorstel?.percentagePerMaand || 0
  };
}

/**
 * Format looptijd voor weergave
 */
function formatLooptijd(maanden) {
  if (!maanden || maanden === Infinity) return 'onbekend';
  if (maanden <= 1) return '1 maand';
  if (maanden < 12) return `${maanden} maanden`;

  const jaren = Math.floor(maanden / 12);
  const restMaanden = maanden % 12;

  if (restMaanden === 0) {
    return jaren === 1 ? '1 jaar' : `${jaren} jaar`;
  }

  return `${jaren} jaar en ${restMaanden} mnd`;
}

/**
 * Get status tekst
 */
function getStatusTekst(status) {
  const teksten = {
    'zeer_haalbaar': 'Zeer haalbaar',
    'haalbaar': 'Haalbaar',
    'mogelijk': 'Mogelijk',
    'risicovol': 'Risicovol',
    'onvoldoende_ruimte': 'Onvoldoende ruimte',
    'afbetaald': 'Afbetaald'
  };
  return teksten[status] || status;
}

/**
 * Get status icon
 */
export function getStatusIcon(status) {
  const icons = {
    'zeer_haalbaar': 'check_circle',
    'haalbaar': 'thumb_up',
    'mogelijk': 'help',
    'risicovol': 'warning',
    'onvoldoende_ruimte': 'error',
    'afbetaald': 'done_all'
  };
  return icons[status] || 'info';
}
