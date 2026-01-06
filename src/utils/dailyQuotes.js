// Daily motivational quotes for Konsensi Budget Beheer
// Each day of the year gets a unique quote based on the day number

const dailyQuotes = [
  "Kleine stappen leiden tot grote resultaten.",
  "Elke euro die je bespaart, brengt je dichter bij financiële vrijheid.",
  "Financiële discipline is de sleutel tot een zorgeloze toekomst.",
  "Je bent sterker dan je schulden.",
  "Elk bedrag dat je aflost, is een overwinning.",
  "Geduld en doorzettingsvermogen winnen het spel.",
  "Je financiële reis begint met één stap.",
  "Blijf gefocust op je doelen, niet op je schulden.",
  "Vooruitgang is vooruitgang, hoe klein ook.",
  "Jouw toekomst is het waard om voor te vechten.",
  "Elke dag is een nieuwe kans om beter te doen.",
  "Financiële vrijheid is geen droom, het is een keuze.",
  "Je bent de baas over je geld, niet andersom.",
  "Kleine offers nu, grote vrijheid later.",
  "Je bent op de goede weg, blijf doorgaan!",
  "Elk budget is een plan naar succes.",
  "Discipline vandaag, vrijheid morgen.",
  "Je hebt de kracht om je financiën te beheersen.",
  "Vooruitgang, niet perfectie.",
  "Jouw toekomst begint nu.",
  "Elke schuld die je aflost, is een stap naar vrijheid.",
  "Blijf gefocust, blijf gemotiveerd.",
  "Je bent sterker dan je denkt.",
  "Kleine stappen, grote dromen.",
  "Financiële vrijheid is binnen handbereik.",
  "Jouw doelen zijn de moeite waard.",
  "Blijf sparen, blijf dromen.",
  "Je bent op weg naar een betere toekomst.",
  "Elke euro telt.",
  "Discipline is de brug tussen doelen en prestaties.",
  "Je hebt dit onder controle.",
  "Blijf geloven in jezelf.",
  "Jouw financiële toekomst ziet er stralend uit.",
  "Elke dag dichter bij je doel.",
  "Je bent een financiële held in wording.",
  "Blijf doorzetten, het is het waard.",
  "Jouw inspanningen worden beloond.",
  "Financiële vrijheid is een reis, geen bestemming.",
  "Je maakt de juiste keuzes.",
  "Blijf gefocust op wat belangrijk is.",
  "Jouw toekomst dankt je.",
  "Elke stap telt.",
  "Je bent op de goede weg.",
  "Blijf investeren in jezelf.",
  "Jouw financiële doelen zijn haalbaar.",
  "Blijf gemotiveerd, blijf sterk.",
  "Je hebt de tools om te slagen.",
  "Elke dag is een nieuwe kans.",
  "Jouw succes begint hier.",
  "Blijf geloven, blijf groeien.",
  "Je bent een inspiratie.",
  "Financiële wijsheid komt met discipline.",
  "Blijf sparen voor je dromen.",
  "Je hebt de kracht om te veranderen.",
  "Elke euro is een investering in je toekomst.",
  "Blijf gefocust op vooruitgang.",
  "Jouw inspanningen zijn waardevol.",
  "Je bent dichter bij je doel dan gisteren.",
  "Blijf positief, blijf vooruitgaan.",
  "Jouw financiële vrijheid is nabij.",
  "Elke beslissing telt.",
  "Je hebt dit!",
];

/**
 * Get the daily motivational quote based on current date
 * Same quote shows all day, changes at midnight
 * @returns {string} The motivational quote for today
 */
export function getDailyQuote() {
  const today = new Date();
  // Get day of year (1-365/366)
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Use modulo to cycle through quotes
  const quoteIndex = dayOfYear % dailyQuotes.length;

  return dailyQuotes[quoteIndex];
}

export default dailyQuotes;
