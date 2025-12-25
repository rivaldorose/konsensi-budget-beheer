export const berekenMaxIncasso = (hoofdsom) => {
  if (isNaN(hoofdsom) || hoofdsom < 0) {
    return 0;
  }

  let max;
  
  if (hoofdsom <= 2500) {
    max = hoofdsom * 0.15;
  } else if (hoofdsom <= 5000) {
    max = 375 + ((hoofdsom - 2500) * 0.10);
  } else if (hoofdsom <= 10000) {
    max = 625 + ((hoofdsom - 5000) * 0.05);
  } else if (hoofdsom <= 200000) {
    max = 875 + ((hoofdsom - 10000) * 0.01);
  } else {
    max = 2775 + ((hoofdsom - 200000) * 0.005);
  }
  
  // De uitkomst wordt afgerond op hele euro's in het voordeel van de schuldenaar
  // en is minimaal 40 euro.
  return Math.max(40, Math.round(max));
}