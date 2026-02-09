// Native date helpers
const getStartOfMonth = (date) => {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getEndOfMonth = (date) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    d.setHours(23, 59, 59, 999);
    return d;
};

const isWithinInterval = (date, { start, end }) => {
    const time = date.getTime();
    return time >= start.getTime() && time <= end.getTime();
};

// --- INCOME SERVICE ---
class IncomeService {
    processIncomeData(allIncomes, forMonth = new Date()) {
        const targetDate = new Date(forMonth);

        const activeFixedIncomes = allIncomes.filter(income => {
            if (income.income_type !== 'vast') return false;
            
            if (income.start_date) {
                const startDate = new Date(income.start_date);
                const endDate = income.end_date ? new Date(income.end_date) : null;
                
                const isAfterStart = getStartOfMonth(targetDate).getTime() >= getStartOfMonth(startDate).getTime();
                const isBeforeEnd = !endDate || getEndOfMonth(targetDate).getTime() <= getEndOfMonth(endDate).getTime();

                return isAfterStart && isBeforeEnd;
            }
            
            return income.is_active !== false;
        });

        const monthStart = getStartOfMonth(forMonth);
        const monthEnd = getEndOfMonth(forMonth);

        const activeExtraIncomes = allIncomes.filter(income => 
            income.income_type === 'extra' && 
            income.date && 
            isWithinInterval(new Date(income.date), { start: monthStart, end: monthEnd })
        );

        const fixed = activeFixedIncomes.reduce((sum, i) => {
            const monthlyAmount = parseFloat(i.monthly_equivalent || i.amount || 0);
            return sum + monthlyAmount;
        }, 0);
        
        const extra = activeExtraIncomes.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
        
        const total = fixed + extra;

        const activeItemsForDisplay = [...activeFixedIncomes, ...activeExtraIncomes];

        return { fixed, extra, total, items: activeItemsForDisplay };
    }

    getFixedIncome(allIncomes) {
        const data = this.processIncomeData(allIncomes, new Date());
        return data.fixed;
    }
}

// --- MONTHLY COST SERVICE ---
class MonthlyCostService {
    processMonthlyCostsData(allCosts) {
        const activeCosts = allCosts.filter(cost => cost.status === 'actief' || cost.status === 'active' || cost.is_active === true);
        const total = activeCosts.reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

        return { total, items: activeCosts };
    }

    getTotal(allCosts) {
        const data = this.processMonthlyCostsData(allCosts);
        return data.total;
    }
}

// --- DEBT SERVICE ---
class DebtService {
    getActiveArrangementPayments(allDebts, forMonth = new Date()) {
        const targetMonthStart = getStartOfMonth(forMonth);

        // Filter debts that have active payment arrangements:
        // 1. Status is 'betalingsregeling' (explicit arrangement)
        // 2. OR status is 'actief'/'active' AND has monthly_payment > 0 (implicit arrangement)
        const activeDebts = allDebts.filter(d => {
            const hasMonthlyPayment = parseFloat(d.monthly_payment || 0) > 0;
            const isBetalingsregeling = d.status === 'betalingsregeling';
            const isActief = d.status === 'actief' || d.status === 'active';

            // Must be either betalingsregeling OR actief with monthly_payment
            if (!isBetalingsregeling && !(isActief && hasMonthlyPayment)) return false;

            // If there's a start_date, check if it's before or within the target month
            if (d.start_date) {
                const startDate = new Date(d.start_date);
                const startMonthStart = getStartOfMonth(startDate);

                // Only include if the start month is <= target month
                return startMonthStart.getTime() <= targetMonthStart.getTime();
            }

            // No start_date means it's already active
            return true;
        });

        const total = activeDebts.reduce((sum, d) => sum + parseFloat(d.monthly_payment || 0), 0);
        return { total, items: activeDebts };
    }

    getTotalDebt(allDebts) {
        return allDebts
          .filter(d => d.status !== 'afbetaald')
          .reduce((sum, d) => sum + (parseFloat(d.amount || 0) - parseFloat(d.amount_paid || 0)), 0);
    }
}

// --- POT SERVICE ---
class PotService {
    getActivePotsData(allPots) {
        const total = allPots.reduce((sum, pot) => sum + parseFloat(pot.monthly_budget || 0), 0);
        return { total, items: allPots };
    }

    getTotal(allPots) {
        const data = this.getActivePotsData(allPots);
        return data.total;
    }
}

// --- VTBL SERVICE ---
// Uses official WSNP/VTLB calculation from vtlbService
class VTBLService {
    async calculateVtbl(allIncomes, allCosts, allDebts) {
        // Import the official VTLB calculator
        const { berekenVTLB, vtlbSettingsToProfiel } = await import('@/services/vtlbService');

        // If no data is passed, fetch it automatically
        if (!allIncomes || !allCosts || !allDebts) {
            try {
                const { Income } = await import('@/api/entities');
                const { MonthlyCost } = await import('@/api/entities');
                const { Debt } = await import('@/api/entities');
                const { User } = await import('@/api/entities');

                const user = await User.me();
                allIncomes = await Income.filter({ user_id: user.id });
                allCosts = await MonthlyCost.filter({ user_id: user.id });
                allDebts = await Debt.filter({ user_id: user.id });
            } catch (error) {
                console.error('Error fetching data for VTBL calculation:', error);
                return null;
            }
        }

        // Get basic financial data
        const fixedIncome = incomeService.getFixedIncome(allIncomes);

        // Bereken vaste lasten EXCLUSIEF VTLB-specifieke categorieën
        // Deze worden apart meegenomen in de VTLB berekening via vtlb_settings
        const vtlbSpecifiekeCategorieen = ['huur', 'hypotheek', 'kinderopvang', 'alimentatie', 'vakbond', 'studiekosten', 'gemeentebelasting', 'zorgkosten'];
        const vasteLastenExclWonen = allCosts
            .filter(c => c.status === 'actief' || c.status === 'active' || c.is_active === true)
            .filter(c =>
                !vtlbSpecifiekeCategorieen.includes(c.category) &&
                !c.name?.toLowerCase().includes('huur') &&
                !c.name?.toLowerCase().includes('hypotheek') &&
                !c.name?.toLowerCase().includes('kinderopvang') &&
                !c.name?.toLowerCase().includes('alimentatie') &&
                !c.name?.toLowerCase().includes('vakbond') &&
                !c.name?.toLowerCase().includes('studie') &&
                !c.name?.toLowerCase().includes('gemeentebelasting')
            )
            .reduce((sum, cost) => sum + parseFloat(cost.amount || 0), 0);

        const totalMonthlyCosts = monthlyCostService.getTotal(allCosts); // Voor legacy compatibility
        const activeDebtPaymentsResult = debtService.getActiveArrangementPayments(allDebts);
        const activeDebtPayments = activeDebtPaymentsResult.total;

        // Get VTLB settings from user profile
        let vtlbSettings = null;
        try {
            const { User } = await import('@/api/entities');
            const userData = await User.me();
            vtlbSettings = userData.vtlb_settings;
        } catch (error) {
            console.log('No VTLB settings found, using basic calculation');
        }

        // If user has VTLB settings, use the official WSNP calculation
        if (vtlbSettings && Object.keys(vtlbSettings).length > 0) {
            // Convert saved settings to profile format for calculation
            // Include vaste lasten (monthly costs) in the calculation
            // Let op: EXCLUSIEF huur/hypotheek want die zit al in vtlbSettings.woonlasten
            const profiel = vtlbSettingsToProfiel(
                vtlbSettings,
                fixedIncome,
                activeDebtPayments,
                vasteLastenExclWonen  // Vaste lasten ZONDER huur/hypotheek!
            );

            // Calculate VTLB using official WSNP formulas
            const vtlbResult = berekenVTLB(profiel);

            // Return result in compatible format with legacy code
            return {
                vastInkomen: fixedIncome,
                vasteLasten: totalMonthlyCosts,
                huidigeRegelingen: activeDebtPayments,
                beschikbaar: vtlbResult.afloscapaciteit,

                // Official VTLB data
                vtlbTotaal: vtlbResult.vtlbTotaal,
                afloscapaciteit: vtlbResult.afloscapaciteit,
                aflosCapaciteit: vtlbResult.afloscapaciteit, // Legacy alias

                // Vaste lasten nu meegenomen in berekening
                vasteLastenMeegenomen: true,

                // Status info
                status: vtlbResult.status,
                statusLabel: vtlbResult.statusLabel,
                statusColor: vtlbResult.statusColor,

                // Breakdown for display
                breakdown: vtlbResult.breakdown,
                is95ProcentRegel: vtlbResult.is95ProcentRegel,

                // Profile info
                leefsituatie: vtlbResult.leefsituatie,
                aantalKinderen: vtlbResult.aantalKinderen,
                isWerkend: vtlbResult.isWerkend,

                // Flag indicating we used official calculation
                hasVtlbSettings: true,
                usedOfficialCalculation: true,
            };
        }

        // Fallback: Standaard VTLB berekening met default profiel (alleenstaand)
        // Zo krijgt elke gebruiker altijd een VTLB schatting, ook zonder settings
        const defaultSettings = {
            leefsituatie: 'alleenstaand',
            aantalKinderen: 0,
            typeWoning: 'huur_sociaal',
            woonlasten: 0,
            werksituatie: 'geen',
            afstandWerk: 0,
            werkdagen: 5,
            chronischeZiekte: false,
            medicijnkosten: 0,
            alimentatie: 0,
            studiekosten: 0,
            kinderopvangKosten: 0,
            gemeentebelasting: 0,
            vakbond: 0,
        };

        const defaultProfiel = vtlbSettingsToProfiel(
            defaultSettings,
            fixedIncome,
            activeDebtPayments,
            vasteLastenExclWonen
        );
        const defaultVtlbResult = berekenVTLB(defaultProfiel);

        return {
            vastInkomen: fixedIncome,
            vasteLasten: totalMonthlyCosts,
            huidigeRegelingen: activeDebtPayments,
            beschikbaar: defaultVtlbResult.afloscapaciteit,
            afloscapaciteit: defaultVtlbResult.afloscapaciteit,
            aflosCapaciteit: defaultVtlbResult.afloscapaciteit, // Legacy alias

            // Standaard VTLB berekening (alleenstaand profiel)
            vtlbTotaal: defaultVtlbResult.vtlbTotaal,
            status: defaultVtlbResult.status,
            statusLabel: defaultVtlbResult.statusLabel,
            statusColor: defaultVtlbResult.statusColor,

            // Breakdown voor display
            breakdown: defaultVtlbResult.breakdown,
            is95ProcentRegel: defaultVtlbResult.is95ProcentRegel,
            leefsituatie: defaultVtlbResult.leefsituatie,
            aantalKinderen: defaultVtlbResult.aantalKinderen,
            isWerkend: defaultVtlbResult.isWerkend,

            hasVtlbSettings: false,
            usedOfficialCalculation: false,
        };
    }
}

export const incomeService = new IncomeService();
export const monthlyCostService = new MonthlyCostService();
export const debtService = new DebtService();
export const vtblService = new VTBLService();
export const potService = new PotService();