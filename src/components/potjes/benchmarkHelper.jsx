export const getBenchmarkForPot = (potName, availableBudget) => {
    if (availableBudget < 0) availableBudget = 0;

    const vtblDistribution = {
      tussenlasten: availableBudget * 0.60,
      buffer: availableBudget * 0.25,
      leukeDingen: availableBudget * 0.15
    };

    const potBudgets = {
      // Tussenlasten
      boodschappen: vtblDistribution.tussenlasten * 0.50,
      vervoer: vtblDistribution.tussenlasten * 0.20,
      verzorging: vtblDistribution.tussenlasten * 0.15,
      kleding: vtblDistribution.tussenlasten * 0.15,
      
      // Buffer/Sparen
      sparen: vtblDistribution.buffer * 0.60,
      onverwacht: vtblDistribution.buffer * 0.40,
      
      // Leuke dingen
      uitgaan: vtblDistribution.leukeDingen * 0.50,
      entertainment: vtblDistribution.leukeDingen * 0.30,
      vakantie: vtblDistribution.leukeDingen * 0.20,
      
      // Vaste lasten (hebben geen suggestie nodig uit beschikbaar budget)
      huisvesting: 0,
      energie: 0,
      telefoon: 0,
      schulden: 0
    };
    
    const matchingKey = Object.keys(potBudgets).find(key => potName.includes(key));
    
    return matchingKey ? potBudgets[matchingKey] : 0;
};

export const getRecommendation = (availableBudget) => {
    if (availableBudget < 0) availableBudget = 0;

    return {
      tussenlasten: availableBudget * 0.60,
      buffer: availableBudget * 0.25,
      leukeDingen: availableBudget * 0.15
    };
};