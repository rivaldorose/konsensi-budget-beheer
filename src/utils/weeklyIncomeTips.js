// Weekly income tips for Konsensi Budget Beheer
// Each week of the year gets a unique tip based on the week number

const weeklyIncomeTips = [
  "Vraag je werkgever om je salaris eerder uit te betalen als je grote uitgaven verwacht deze maand.",
  "Check of je recht hebt op toeslagen via de website van de Belastingdienst - dit kan honderden euro's per maand schelen.",
  "Houd je loonstrook goed bij en controleer of alle uren correct zijn uitbetaald.",
  "Vraag bij je werkgever naar mogelijkheden voor een salarisverhoging of extra uren.",
  "Overweeg een bijbaan of freelance werk in je vrije tijd om extra inkomen te genereren.",
  "Zorg dat je werkgever je vakantiegeld en eindejaarsuitkering op tijd uitbetaalt.",
  "Check of je in aanmerking komt voor zorgtoeslag - dit kan tot €150 per maand opleveren.",
  "Vraag je werkgever naar secondaire arbeidsvoorwaarden zoals reiskostenvergoeding of thuiswerkvergoeding.",
  "Overweeg om een deel van je salaris automatisch over te laten maken naar een spaarrekening.",
  "Houd je cao-afspraken in de gaten - mogelijk heb je recht op een periodieke loonsverhoging.",
  "Vraag bij je werkgever naar cursussen of opleidingen die je carrière kunnen verbeteren.",
  "Check of je recht hebt op huurtoeslag via de website van de Belastingdienst.",
  "Vraag je werkgever om je arbeidscontract te evalueren en te kijken naar doorgroeimogelijkheden.",
  "Overweeg om spullen die je niet meer gebruikt te verkopen via Marktplaats of Vinted.",
  "Check of je in aanmerking komt voor kinderopvangtoeslag als je kinderen hebt.",
  "Vraag je werkgever naar de mogelijkheid voor overwerk of ploegentoeslagen.",
  "Zorg dat je belastingaangifte op tijd doet - mogelijk krijg je geld terug van de Belastingdienst.",
  "Vraag bij je werkgever naar een fietsplan of andere fiscaal voordelige regelingen.",
  "Overweeg om je hobby tot een bijverdienste te maken - denk aan fotografie, schrijven of ontwerpen.",
  "Check of je recht hebt op kinderbijslag via de Sociale Verzekeringsbank.",
  "Vraag je werkgever naar de mogelijkheid voor een bonusregeling of winstdeling.",
  "Houd je uren goed bij als je flexibel werkt - zo voorkom je dat je te weinig uitbetaald krijgt.",
  "Overweeg om te investeren in jezelf via cursussen die je inkomsten kunnen verhogen.",
  "Check of je in aanmerking komt voor een energietoeslag via je gemeente.",
  "Vraag je werkgever om je pensioenregeling door te nemen en te kijken naar optimalisaties.",
  "Overweeg om babysitten, hondenuitlaten of boodschappen doen aan te bieden als bijverdienste.",
  "Check of je recht hebt op een tegemoetkoming voor chronisch zieken en gehandicapten.",
  "Vraag bij je werkgever naar de mogelijkheid voor thuiswerken om reiskosten te besparen.",
  "Overweeg om online enquêtes in te vullen of producten te testen voor extra inkomsten.",
  "Check of je in aanmerking komt voor een gemeentelijke bijzondere bijstand.",
  "Vraag je werkgever naar de mogelijkheid voor een 13e maand of kerstbonus.",
  "Houd je verlofuren in de gaten - mogelijk kun je deze uitbetalen in plaats van opnemen.",
  "Overweeg om les te geven in een vak waar je goed in bent via bijles platforms.",
  "Check of je recht hebt op een tegemoetkoming studiekosten voor jezelf of je kinderen.",
  "Vraag bij je werkgever naar de mogelijkheid voor een loopbaanbudget of ontwikkelbudget.",
  "Overweeg om seizoenswerk te doen tijdens piekperiodes zoals de feestdagen.",
  "Check of je in aanmerking komt voor een korting op je ziektekostenverzekering via je werkgever.",
  "Vraag je werkgever om je arbeidsvoorwaarden jaarlijks te indexeren aan de inflatie.",
  "Overweeg om je garage, zolder of parkeerplaats te verhuren voor extra inkomsten.",
  "Check of je recht hebt op een tegemoetkoming voor ouders met schoolgaande kinderen.",
  "Vraag bij je werkgever naar de mogelijkheid voor een persoonlijk leasebudget.",
  "Overweeg om freelance opdrachten aan te nemen via platforms zoals Fiverr of Upwork.",
  "Check of je in aanmerking komt voor een compensatie chronisch zieken en gehandicapten.",
  "Vraag je werkgever naar de mogelijkheid voor flexibele werktijden om efficiënter te werken.",
  "Overweeg om kamers in je huis te verhuren via platforms zoals Airbnb of Booking.com.",
  "Check of je recht hebt op een tegemoetkoming voor alleenstaande ouders.",
  "Vraag bij je werkgever naar de mogelijkheid voor een cafetariaregeling voor fiscaal voordeel.",
  "Overweeg om een online webshop te starten met producten die je zelf maakt.",
  "Check of je in aanmerking komt voor een gemeentelijke kwijtschelding van belastingen.",
  "Vraag je werkgever om je functie te herijken als je taken zijn toegenomen.",
  "Overweeg om coachings- of adviesdiensten aan te bieden in jouw expertisegebied.",
  "Check of je recht hebt op een tegemoetkoming voor mensen met een laag inkomen.",
];

/**
 * Get the tip for the current week
 * @returns {string} The weekly income tip
 */
export function getWeeklyIncomeTip() {
  const today = new Date();

  // Calculate week number (ISO 8601 standard)
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  // Use modulo to cycle through tips (weeks 1-52/53)
  const tipIndex = (weekNumber - 1) % weeklyIncomeTips.length;

  return weeklyIncomeTips[tipIndex];
}

export default weeklyIncomeTips;
