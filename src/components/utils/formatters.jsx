export const formatCurrency = (amount, options = {}) => {
  const {
    showCurrency = true,
    decimals = 2,
    locale = 'nl-NL' // Standaard Nederlands formaat
  } = options;

  // Zorg ervoor dat het een nummer is, met 0 als fallback
  const num = parseFloat(amount || 0);

  // Formatteer met duizendtallen scheidingsteken
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true // Dit voegt de komma's/punten toe
  }).format(num);

  return showCurrency ? `€${formatted}` : formatted;
};