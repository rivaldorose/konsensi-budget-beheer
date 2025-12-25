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