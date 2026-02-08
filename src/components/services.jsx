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
        const activeCosts = allCosts.filter(cost => cost.status === 'actief');
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

        // Filter debts that are in betalingsregeling AND have started (start_date is not in the future)
        const activeDebts = allDebts.filter(d => {
            if (d.status !== 'betalingsregeling') return false;

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
        const totalMonthlyCosts = monthlyCostService.getTotal(allCosts);
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
            const profiel = vtlbSettingsToProfiel(
                vtlbSettings,
                fixedIncome,
                activeDebtPayments,
                totalMonthlyCosts  // Vaste lasten meenemen!
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

        // Fallback: Basic calculation without VTLB settings
        // Simply calculate available space from income - costs - arrangements
        const availableSpace = Math.max(0, fixedIncome - totalMonthlyCosts - activeDebtPayments);

        return {
            vastInkomen: fixedIncome,
            vasteLasten: totalMonthlyCosts,
            huidigeRegelingen: activeDebtPayments,
            beschikbaar: availableSpace,
            afloscapaciteit: availableSpace,
            aflosCapaciteit: availableSpace, // Legacy alias

            // No official VTLB calculation
            vtlbTotaal: 0,
            status: availableSpace > 50 ? 'haalbaar' : availableSpace > 25 ? 'grensgevallen' : 'niet_haalbaar',
            statusLabel: availableSpace > 50 ? 'Afloscapaciteit beschikbaar' : availableSpace > 25 ? 'Beperkte afloscapaciteit' : 'Geen ruimte voor aflosing',
            statusColor: availableSpace > 50 ? 'green' : availableSpace > 25 ? 'orange' : 'red',

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