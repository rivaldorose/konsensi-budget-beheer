/**
 * VTLB Service - Vrij Te Laten Bedrag Berekening
 *
 * Gebaseerd op officiële WSNP/VTLB normen
 * https://www.rechtspraak.nl/Onderwerpen/Schulden/Paginas/Berekening-vtlb.aspx
 */

// VTLB Basis normbedragen per maand (2024/2025)
export const VTLB_NORMEN = {
  // Basis bedragen per leefsituatie
  basis: {
    alleenstaand: 1235,
    alleenstaande_ouder: 1550,
    samenwonend_beiden: 1765,  // beiden hebben inkomen
    samenwonend_een: 1705,     // 1 inkomen
  },

  // Kinderen toeslagen (bovenop basis)
  kinderen: {
    kind_1: 315,
    kind_2: 280,
    kind_3: 245,
    kind_4_plus: 210, // per extra kind
  },

  // Vaste correcties
  correcties: {
    eigen_risico: 32.08,      // €385/12 per maand
    arbeidstoeslag: 90,       // als werkend
    reservering: 25,          // vaste reservering
  },

  // Woonkosten
  woonkosten: {
    huurtoeslag_grens: 879.66, // max grens
    verhoging_factor: 0.90,    // 90% van verschil boven grens
  },

  // Reiskosten
  reiskosten: {
    minimum_afstand: 10,       // km enkele reis
    vergoeding_per_km: 0.23,   // € per km
    werkdagen_per_maand: 22,   // gemiddeld
  },

  // Overige factoren
  overig: {
    kinderopvang_factor: 0.70, // 70% vergoed
    max_vtlb_percentage: 0.95, // 95% regel
  }
};

/**
 * Bereken de VTLB conform officiële WSNP methodiek
 * @param {Object} profiel - Gebruikersprofiel met alle VTLB velden
 * @returns {Object} Complete VTLB berekening
 */
export function berekenVTLB(profiel) {
  const breakdown = {};
  let vtlb = 0;

  // STAP 1: Basis VTLB op basis van leefsituatie
  const leefsituatie = profiel.leefsituatie || 'alleenstaand';
  const basisBedrag = VTLB_NORMEN.basis[leefsituatie] || VTLB_NORMEN.basis.alleenstaand;
  breakdown.basisBedrag = basisBedrag;
  vtlb += basisBedrag;

  // STAP 2: Kinderen toeslag
  const aantalKinderen = parseInt(profiel.aantalKinderen) || 0;
  let kinderToeslag = 0;
  for (let i = 0; i < aantalKinderen; i++) {
    if (i === 0) kinderToeslag += VTLB_NORMEN.kinderen.kind_1;
    else if (i === 1) kinderToeslag += VTLB_NORMEN.kinderen.kind_2;
    else if (i === 2) kinderToeslag += VTLB_NORMEN.kinderen.kind_3;
    else kinderToeslag += VTLB_NORMEN.kinderen.kind_4_plus;
  }
  breakdown.kinderToeslag = kinderToeslag;
  vtlb += kinderToeslag;

  // STAP 3: Woonkosten verhoging
  const woonlasten = parseFloat(profiel.woonlasten) || 0;
  let woonkostenCorrectie = 0;
  if (woonlasten > VTLB_NORMEN.woonkosten.huurtoeslag_grens) {
    woonkostenCorrectie = (woonlasten - VTLB_NORMEN.woonkosten.huurtoeslag_grens) * VTLB_NORMEN.woonkosten.verhoging_factor;
  }
  breakdown.woonkostenCorrectie = woonkostenCorrectie;
  vtlb += woonkostenCorrectie;

  // STAP 4: Vaste correcties
  // Eigen risico zorgverzekering
  const eigenRisico = VTLB_NORMEN.correcties.eigen_risico;
  breakdown.eigenRisico = eigenRisico;
  vtlb += eigenRisico;

  // Reservering
  const reservering = VTLB_NORMEN.correcties.reservering;
  breakdown.reservering = reservering;
  vtlb += reservering;

  // Arbeidstoeslag (als werkend)
  const werkend = ['vast', 'tijdelijk', 'zzp'].includes(profiel.werksituatie);
  const arbeidsToeslag = werkend ? VTLB_NORMEN.correcties.arbeidstoeslag : 0;
  breakdown.arbeidsToeslag = arbeidsToeslag;
  breakdown.isWerkend = werkend;
  vtlb += arbeidsToeslag;

  // STAP 5: Individuele lasten
  let individueleLasten = 0;

  // Reiskosten (als afstand > 10km en werkend)
  const afstandWerk = parseFloat(profiel.afstandWerk) || 0;
  const werkdagen = parseInt(profiel.werkdagen) || 5;
  let reiskosten = 0;
  if (afstandWerk > VTLB_NORMEN.reiskosten.minimum_afstand && werkend) {
    reiskosten = afstandWerk * 2 * werkdagen * 4.33 * VTLB_NORMEN.reiskosten.vergoeding_per_km;
  }
  breakdown.reiskosten = reiskosten;
  individueleLasten += reiskosten;

  // Alimentatie betalen
  const alimentatie = parseFloat(profiel.alimentatie) || 0;
  breakdown.alimentatie = alimentatie;
  individueleLasten += alimentatie;

  // Kinderopvang (70% vergoed)
  const kinderopvangKosten = parseFloat(profiel.kinderopvangKosten) || 0;
  const kinderopvangCorrectie = kinderopvangKosten * VTLB_NORMEN.overig.kinderopvang_factor;
  breakdown.kinderopvangCorrectie = kinderopvangCorrectie;
  individueleLasten += kinderopvangCorrectie;

  // Gemeentebelasting (per maand)
  const gemeentebelasting = parseFloat(profiel.gemeentebelasting) || 0;
  const gemeentebelastingPerMaand = gemeentebelasting / 12;
  breakdown.gemeentebelastingPerMaand = gemeentebelastingPerMaand;
  individueleLasten += gemeentebelastingPerMaand;

  // Studiekosten
  const studiekosten = parseFloat(profiel.studiekosten) || 0;
  breakdown.studiekosten = studiekosten;
  individueleLasten += studiekosten;

  // Vakbondscontributie
  const vakbond = parseFloat(profiel.vakbond) || 0;
  breakdown.vakbond = vakbond;
  individueleLasten += vakbond;

  // Medicijnkosten (bij chronische ziekte)
  const medicijnkosten = profiel.chronischeZiekte ? (parseFloat(profiel.medicijnkosten) || 0) : 0;
  breakdown.medicijnkosten = medicijnkosten;
  individueleLasten += medicijnkosten;

  breakdown.individueleLasten = individueleLasten;
  vtlb += individueleLasten;

  // STAP 6: 95% regel toepassen
  const nettoInkomen = parseFloat(profiel.nettoInkomen) || 0;
  const maxVTLB = nettoInkomen * VTLB_NORMEN.overig.max_vtlb_percentage;
  const is95ProcentRegel = vtlb > maxVTLB && nettoInkomen > 0;
  const vtlbVoorRegel = vtlb;

  if (is95ProcentRegel) {
    vtlb = maxVTLB;
  }

  breakdown.vtlbVoorRegel = vtlbVoorRegel;
  breakdown.maxVTLB = maxVTLB;
  breakdown.is95ProcentRegel = is95ProcentRegel;

  // STAP 7: Afloscapaciteit berekenen
  const bestaandeRegelingen = parseFloat(profiel.bestaandeRegelingen) || 0;
  const afloscapaciteit = Math.max(0, nettoInkomen - vtlb - bestaandeRegelingen);

  // Status bepaling
  let status;
  let statusLabel;
  let statusColor;

  if (afloscapaciteit < 25) {
    status = 'niet_haalbaar';
    statusLabel = 'Geen ruimte voor aflosing';
    statusColor = 'red';
  } else if (afloscapaciteit <= 50) {
    status = 'grensgevallen';
    statusLabel = 'Beperkte afloscapaciteit';
    statusColor = 'orange';
  } else {
    status = 'haalbaar';
    statusLabel = 'Afloscapaciteit beschikbaar';
    statusColor = 'green';
  }

  return {
    // Samenvatting
    vtlbTotaal: Math.round(vtlb * 100) / 100,
    nettoInkomen: nettoInkomen,
    bestaandeRegelingen: bestaandeRegelingen,
    afloscapaciteit: Math.round(afloscapaciteit * 100) / 100,

    // Status
    status: status,
    statusLabel: statusLabel,
    statusColor: statusColor,

    // Breakdown voor weergave
    breakdown: {
      basisBedrag: breakdown.basisBedrag,
      kinderToeslag: breakdown.kinderToeslag,
      woonkostenCorrectie: Math.round(breakdown.woonkostenCorrectie * 100) / 100,
      eigenRisico: breakdown.eigenRisico,
      reservering: breakdown.reservering,
      arbeidsToeslag: breakdown.arbeidsToeslag,
      reiskosten: Math.round(breakdown.reiskosten * 100) / 100,
      alimentatie: breakdown.alimentatie,
      kinderopvangCorrectie: Math.round(breakdown.kinderopvangCorrectie * 100) / 100,
      gemeentebelastingPerMaand: Math.round(breakdown.gemeentebelastingPerMaand * 100) / 100,
      studiekosten: breakdown.studiekosten,
      vakbond: breakdown.vakbond,
      medicijnkosten: breakdown.medicijnkosten,
      individueleLasten: Math.round(breakdown.individueleLasten * 100) / 100,
    },

    // 95% regel info
    is95ProcentRegel: breakdown.is95ProcentRegel,
    vtlbVoorRegel: Math.round(breakdown.vtlbVoorRegel * 100) / 100,
    maxVTLB: Math.round(breakdown.maxVTLB * 100) / 100,

    // Profiel info
    leefsituatie: leefsituatie,
    aantalKinderen: aantalKinderen,
    isWerkend: breakdown.isWerkend,

    // Timestamp
    berekendOp: new Date().toISOString(),
  };
}

/**
 * Converteer opgeslagen vtlb_settings naar profiel object
 * @param {Object} vtlbSettings - Opgeslagen JSONB data uit database
 * @param {number} nettoInkomen - Netto maandinkomen
 * @param {number} bestaandeRegelingen - Som van bestaande betalingsregelingen
 * @returns {Object} Profiel voor berekenVTLB functie
 */
export function vtlbSettingsToProfiel(vtlbSettings, nettoInkomen = 0, bestaandeRegelingen = 0) {
  const settings = vtlbSettings || {};

  return {
    // Huishouden
    leefsituatie: settings.leefsituatie || 'alleenstaand',
    aantalKinderen: settings.aantalKinderen || 0,

    // Woonsituatie
    woonlasten: settings.woonlasten || 0,

    // Werk & Reizen
    werksituatie: settings.werksituatie || 'geen',
    afstandWerk: settings.afstandWerk || 0,
    werkdagen: settings.werkdagen || 5,

    // Zorg & Gezondheid
    chronischeZiekte: settings.chronischeZiekte || false,
    medicijnkosten: settings.medicijnkosten || 0,

    // Verplichtingen
    alimentatie: settings.alimentatie || 0,
    studiekosten: settings.studiekosten || 0,
    kinderopvangKosten: settings.kinderopvangKosten || 0,
    gemeentebelasting: settings.gemeentebelasting || 0,
    vakbond: settings.vakbond || 0,

    // Inkomen (uit andere bron)
    nettoInkomen: nettoInkomen,
    bestaandeRegelingen: bestaandeRegelingen,
  };
}

/**
 * Bereken proportionele verdeling van afloscapaciteit over schulden
 * @param {number} afloscapaciteit - Beschikbare afloscapaciteit per maand
 * @param {Array} schulden - Array van schulden met amount
 * @returns {Array} Schulden met maandelijks aflosbedrag
 */
export function verdeelAfloscapaciteit(afloscapaciteit, schulden) {
  if (!schulden || schulden.length === 0) return [];
  if (afloscapaciteit <= 0) return schulden.map(s => ({ ...s, maandelijkAflos: 0 }));

  const totaalSchuld = schulden.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  if (totaalSchuld <= 0) return schulden.map(s => ({ ...s, maandelijkAflos: 0 }));

  return schulden.map(schuld => {
    const schuldBedrag = parseFloat(schuld.amount) || 0;
    const percentage = schuldBedrag / totaalSchuld;
    let bedrag = Math.round(afloscapaciteit * percentage * 100) / 100;

    // Minimum €10 per schuldeiser (tenzij afloscapaciteit te laag)
    if (bedrag < 10 && afloscapaciteit >= 10 * schulden.length) {
      bedrag = 10;
    }

    return {
      ...schuld,
      maandelijkAflos: bedrag,
      percentageVanTotaal: Math.round(percentage * 100),
      looptijdMaanden: bedrag > 0 ? Math.ceil(schuldBedrag / bedrag) : 0,
    };
  });
}

/**
 * Formatteer leefsituatie voor weergave
 */
export function formatLeefsituatie(leefsituatie) {
  const labels = {
    alleenstaand: 'Alleenstaand',
    alleenstaande_ouder: 'Alleenstaande ouder',
    samenwonend_beiden: 'Samenwonend (beiden werken)',
    samenwonend_een: 'Samenwonend (1 inkomen)',
  };
  return labels[leefsituatie] || 'Alleenstaand';
}

/**
 * Formatteer werksituatie voor weergave
 */
export function formatWerksituatie(werksituatie) {
  const labels = {
    vast: 'Vast contract',
    tijdelijk: 'Tijdelijk contract',
    zzp: 'ZZP / Zelfstandig',
    uitkering: 'Uitkering',
    student: 'Student',
    geen: 'Geen werk',
  };
  return labels[werksituatie] || 'Onbekend';
}

export default {
  VTLB_NORMEN,
  berekenVTLB,
  vtlbSettingsToProfiel,
  verdeelAfloscapaciteit,
  formatLeefsituatie,
  formatWerksituatie,
};
