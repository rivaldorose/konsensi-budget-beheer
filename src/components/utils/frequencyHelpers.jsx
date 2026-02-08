export const paymentFrequencies = [
  {
    value: "one_time",
    label: "Eenmalig",
    label_short: "1x",
    times_per_year: 1,
    monthly_multiplier: 0.083, // 1/12
    icon: "📅"
  },
  {
    value: "daily",
    label: "Dagelijks",
    label_short: "Dagelijks",
    times_per_year: 365,
    monthly_multiplier: 30,
    icon: "☀️"
  },
  {
    value: "weekly",
    label: "Wekelijks",
    label_short: "1x/week",
    times_per_year: 52,
    monthly_multiplier: 4.33, // 52/12
    icon: "📆"
  },
  {
    value: "biweekly",
    label: "Tweewekelijks",
    label_short: "1x/2 weken",
    times_per_year: 26,
    monthly_multiplier: 2.17, // 26/12
    icon: "📆"
  },
  {
    value: "four_weekly",
    label: "Vierwekelijks",
    label_short: "1x/4 weken",
    times_per_year: 13,
    monthly_multiplier: 1.08, // 13/12
    icon: "📆"
  },
  {
    value: "monthly",
    label: "Maandelijks",
    label_short: "1x/maand",
    times_per_year: 12,
    monthly_multiplier: 1,
    icon: "📅"
  },
  {
    value: "quarterly",
    label: "Per kwartaal",
    label_short: "1x/kwartaal",
    times_per_year: 4,
    monthly_multiplier: 0.33, // 4/12
    icon: "📊"
  },
  {
    value: "yearly",
    label: "Jaarlijks",
    label_short: "1x/jaar",
    times_per_year: 1,
    monthly_multiplier: 0.083, // 1/12
    icon: "📆"
  }
];

export const incomeCategories = [
  { value: "salaris", label: "Salaris", icon: "💼", color: "bg-blue-100 text-blue-700" },
  { value: "freelance", label: "Freelance", icon: "💻", color: "bg-purple-100 text-purple-700" },
  { value: "gift", label: "Cadeau/Gift", icon: "🎁", color: "bg-pink-100 text-pink-700" },
  { value: "investment", label: "Investment", icon: "📈", color: "bg-green-100 text-green-700" },
  { value: "benefits", label: "Uitkering", icon: "🏛️", color: "bg-yellow-100 text-yellow-700" },
  { value: "overig", label: "Overig", icon: "💰", color: "bg-gray-100 text-gray-700" }
];

export const daysOfWeek = [
  { value: 0, label: "Zondag" },
  { value: 1, label: "Maandag" },
  { value: 2, label: "Dinsdag" },
  { value: 3, label: "Woensdag" },
  { value: 4, label: "Donderdag" },
  { value: 5, label: "Vrijdag" },
  { value: 6, label: "Zaterdag" }
];

export function calculateMonthlyEquivalent(amount, frequency) {
  const freq = paymentFrequencies.find(f => f.value === frequency);
  if (!freq) return amount;
  return amount * freq.monthly_multiplier;
}

export function getFrequencyLabel(frequency, short = false) {
  const freq = paymentFrequencies.find(f => f.value === frequency);
  if (!freq) return frequency;
  return short ? freq.label_short : freq.label;
}

export function getCategoryInfo(category) {
  return incomeCategories.find(c => c.value === category) || incomeCategories[incomeCategories.length - 1];
}

export function needsDayOfWeek(frequency) {
  return ['weekly', 'biweekly', 'four_weekly'].includes(frequency);
}

export function needsDayOfMonth(frequency) {
  return ['monthly', 'quarterly', 'yearly'].includes(frequency);
}

/**
 * Bepaalt of een frequentie een laatste betaaldatum nodig heeft voor berekening
 * Dit is relevant voor wekelijks, tweewekelijks en vierwekelijks inkomen
 */
export function needsLastPaymentDate(frequency) {
  return ['weekly', 'biweekly', 'four_weekly'].includes(frequency);
}

/**
 * Bereken de volgende betaaldatum op basis van de laatste betaaldatum en frequentie
 *
 * @param {string|Date} lastPaymentDate - De laatste betaaldatum
 * @param {string} frequency - De frequentie (weekly, biweekly, four_weekly, monthly, etc)
 * @param {number} dayOfWeek - Dag van de week (0=zondag, 1=maandag, etc) voor wekelijkse frequenties
 * @param {number} dayOfMonth - Dag van de maand voor maandelijkse frequenties
 * @returns {Date} - De berekende volgende betaaldatum
 */
export function calculateNextPaymentDate(lastPaymentDate, frequency, dayOfWeek = null, dayOfMonth = null) {
  if (!lastPaymentDate) return null;

  const lastDate = new Date(lastPaymentDate);
  lastDate.setHours(12, 0, 0, 0); // Normaliseer naar middag om timezone issues te voorkomen

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let nextDate = new Date(lastDate);

  // Bereken interval in dagen gebaseerd op frequentie
  const frequencyDays = {
    'daily': 1,
    'weekly': 7,
    'biweekly': 14,
    'four_weekly': 28,
    'monthly': null, // Speciale behandeling
    'quarterly': null,
    'yearly': null
  };

  const days = frequencyDays[frequency];

  if (days) {
    // Voor dag-gebaseerde frequenties (weekly, biweekly, four_weekly)
    // Voeg het interval toe totdat we in de toekomst zitten
    while (nextDate <= today) {
      nextDate.setDate(nextDate.getDate() + days);
    }
  } else if (frequency === 'monthly') {
    // Voor maandelijks: gebruik de dag van de maand
    const targetDay = dayOfMonth || lastDate.getDate();
    nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), targetDay);

    // Als de dag van de maand niet bestaat (bijv. 31 in een maand met 30 dagen)
    // gebruik dan de laatste dag van die maand
    if (nextDate.getDate() !== targetDay) {
      nextDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
    }

    // Ga naar volgende maanden totdat we in de toekomst zijn
    while (nextDate <= today) {
      const currentMonth = nextDate.getMonth();
      nextDate = new Date(nextDate.getFullYear(), currentMonth + 1, targetDay);
      // Corrigeer voor maanden met minder dagen
      if (nextDate.getDate() !== targetDay && targetDay > 28) {
        nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
      }
    }
  } else if (frequency === 'quarterly') {
    // Voor kwartaal: +3 maanden
    const targetDay = dayOfMonth || lastDate.getDate();
    while (nextDate <= today) {
      nextDate.setMonth(nextDate.getMonth() + 3);
    }
  } else if (frequency === 'yearly') {
    // Voor jaarlijks: +1 jaar
    while (nextDate <= today) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
  }

  return nextDate;
}

/**
 * Controleer of een betaling in een specifieke periode valt
 *
 * @param {Object} income - Het inkomen object met frequentie en datumvelden
 * @param {Date} startDate - Begin van de periode
 * @param {Date} endDate - Einde van de periode
 * @returns {boolean} - True als er een betaling in deze periode valt
 */
export function hasPaymentInPeriod(income, startDate, endDate) {
  if (!income) return false;

  const frequency = income.frequency;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Voor extra inkomen: check de specifieke datum
  if (income.income_type === 'extra' && income.date) {
    const incomeDate = new Date(income.date);
    return incomeDate >= start && incomeDate <= end;
  }

  // Voor vast inkomen zonder last_payment_date: gebruik oude logica
  if (!needsLastPaymentDate(frequency)) {
    // Maandelijks, kwartaal, jaarlijks - check of de betaaldag in de periode valt
    if (income.day_of_month !== null && income.day_of_month !== undefined) {
      const paymentDay = income.day_of_month;
      // Check elke maand in de periode
      let checkDate = new Date(start.getFullYear(), start.getMonth(), paymentDay);
      while (checkDate <= end) {
        if (checkDate >= start && checkDate <= end) {
          return true;
        }
        checkDate.setMonth(checkDate.getMonth() + 1);
      }
    }
    return true; // Default: neem aan dat het in de maand valt
  }

  // Voor weekly/biweekly/four_weekly met last_payment_date
  if (income.last_payment_date) {
    const lastPayment = new Date(income.last_payment_date);
    const nextPayment = calculateNextPaymentDate(
      lastPayment,
      frequency,
      income.day_of_week,
      income.day_of_month
    );

    // Check of de volgende betaling in de periode valt
    if (nextPayment && nextPayment >= start && nextPayment <= end) {
      return true;
    }

    // Check ook betalingen die al voorbij zijn maar nog in de periode vallen
    // (bijv. als je wekelijks wordt betaald, kunnen er meerdere betalingen in een maand zijn)
    const days = { 'weekly': 7, 'biweekly': 14, 'four_weekly': 28 }[frequency] || 7;
    let checkDate = new Date(lastPayment);

    // Ga terug naar net voor de startdatum
    while (checkDate > start) {
      checkDate.setDate(checkDate.getDate() - days);
    }

    // Loop vooruit door alle mogelijke betalingsdatums
    while (checkDate <= end) {
      if (checkDate >= start && checkDate <= end) {
        return true;
      }
      checkDate.setDate(checkDate.getDate() + days);
    }

    return false;
  }

  // Fallback: neem aan dat het actief is
  return true;
}

/**
 * Bereken hoeveel betalingen er in een periode vallen
 *
 * @param {Object} income - Het inkomen object
 * @param {Date} startDate - Begin van de periode
 * @param {Date} endDate - Einde van de periode
 * @returns {number} - Aantal betalingen in de periode
 */
export function countPaymentsInPeriod(income, startDate, endDate) {
  if (!income || !income.frequency) return 0;

  const frequency = income.frequency;
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Voor extra inkomen: 1 als de datum in de periode valt
  if (income.income_type === 'extra' && income.date) {
    const incomeDate = new Date(income.date);
    return (incomeDate >= start && incomeDate <= end) ? 1 : 0;
  }

  // Voor weekly/biweekly/four_weekly
  if (needsLastPaymentDate(frequency) && income.last_payment_date) {
    const days = { 'weekly': 7, 'biweekly': 14, 'four_weekly': 28 }[frequency] || 7;
    let count = 0;
    let checkDate = new Date(income.last_payment_date);

    // Ga terug naar net voor de startdatum
    while (checkDate > start) {
      checkDate.setDate(checkDate.getDate() - days);
    }
    // En dan 1 stap vooruit zodat we in de periode beginnen
    while (checkDate < start) {
      checkDate.setDate(checkDate.getDate() + days);
    }

    // Tel alle betalingen in de periode
    while (checkDate <= end) {
      if (checkDate >= start) {
        count++;
      }
      checkDate.setDate(checkDate.getDate() + days);
    }

    return count;
  }

  // Voor maandelijks
  if (frequency === 'monthly') {
    // Tel het aantal maanden in de periode
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return Math.min(months, 1); // Maximaal 1 voor een maandperiode
  }

  return 1; // Default
}

/**
 * Formatteer een datum naar Nederlands formaat
 */
export function formatDateNL(date) {
  if (!date) return '';
  const d = new Date(date);
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}