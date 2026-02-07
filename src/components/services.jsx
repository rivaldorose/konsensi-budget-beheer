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
class VTBLService {
    async calculateVtbl(allIncomes, allCosts, allDebts) {
        // If no data is passed, fetch it automatically
        if (!allIncomes || !allCosts || !allDebts) {
            try {
                const { Income } = await import('@/api/entities');
                const { MonthlyCost } = await import('@/api/entities');
                const { Debt } = await import('@/api/entities');
                const { User } = await import('@/api/entities');
                
                const user = await User.me();
                const email = user.email;

                allIncomes = await Income.filter({ user_id: user.id });
                allCosts = await MonthlyCost.filter({ user_id: user.id });
                allDebts = await Debt.filter({ user_id: user.id });
            } catch (error) {
                console.error('Error fetching data for VTBL calculation:', error);
                return null;
            }
        }
        
        const fixedIncome = incomeService.getFixedIncome(allIncomes);
        const totalMonthlyCosts = monthlyCostService.getTotal(allCosts);
        const activeDebtPaymentsResult = debtService.getActiveArrangementPayments(allDebts);
        const activeDebtPayments = activeDebtPaymentsResult.total;

        const availableSpace = Math.max(0, fixedIncome - totalMonthlyCosts - activeDebtPayments);
        
        let vtlbSettings = null;
        try {
            const { User } = await import('@/api/entities');
            const userData = await User.me();
            vtlbSettings = userData.vtlb_settings;
        } catch (error) {
            console.log('No VTLB settings found, using basic calculation');
        }

        let adjustedSpace = availableSpace;
        let adjustments = [];

        if (vtlbSettings) {
            const aantalKinderen = vtlbSettings.persoonlijkeSituatie?.aantalKinderen || 0;
            if (aantalKinderen > 0) {
                const kinderToeslag = aantalKinderen * 50;
                adjustedSpace += kinderToeslag;
                adjustments.push({ reason: `${aantalKinderen} kinderen`, amount: kinderToeslag });
            }

            const afstand = parseFloat(vtlbSettings.werkReizen?.afstandWoonWerk || 0);
            if (afstand > 30) {
                const reiskosten = Math.min(200, (afstand - 30) * 3);
                adjustedSpace += reiskosten;
                adjustments.push({ reason: 'Lange reisafstand', amount: reiskosten });
            }

            if (vtlbSettings.zorg?.chronischeAandoening) {
                const medicijnkosten = parseFloat(vtlbSettings.zorg.maandelijkseMedicijnkosten || 0);
                if (medicijnkosten > 0) {
                    adjustedSpace += medicijnkosten;
                    adjustments.push({ reason: 'Medicijnkosten', amount: medicijnkosten });
                }
            }

            const toeslagen = vtlbSettings.toeslagen || {};
            ['zorgtoeslag', 'huurtoeslag', 'kinderopvangtoeslag', 'kindgebondenBudget'].forEach(type => {
                if (toeslagen[type]?.actief) {
                    const bedrag = parseFloat(toeslagen[type].bedrag || 0);
                    if (bedrag > 0) {
                        adjustedSpace += bedrag;
                        adjustments.push({ reason: type.replace(/([A-Z])/g, ' $1').toLowerCase(), amount: bedrag });
                    }
                }
            });

            if (vtlbSettings.schulden?.alimentatieBetalen?.actief) {
                const alimentatie = parseFloat(vtlbSettings.schulden.alimentatieBetalen.bedrag || 0);
                adjustedSpace -= alimentatie;
                adjustments.push({ reason: 'Alimentatie betalen', amount: -alimentatie });
            }

            if (vtlbSettings.schulden?.alimentatieOntvangen?.actief) {
                const alimentatie = parseFloat(vtlbSettings.schulden.alimentatieOntvangen.bedrag || 0);
                adjustedSpace += alimentatie;
                adjustments.push({ reason: 'Alimentatie ontvangen', amount: alimentatie });
            }

            const overigeLasten = vtlbSettings.overigeLasten || {};
            ['studiekosten', 'vakbondscontributie', 'verplichteBeroepskosten'].forEach(type => {
                const bedrag = parseFloat(overigeLasten[type] || 0);
                if (bedrag > 0) {
                    adjustedSpace -= bedrag;
                    adjustments.push({ reason: type.replace(/([A-Z])/g, ' $1').toLowerCase(), amount: -bedrag });
                }
            });
        }

        const budgetDistribution = {
            tussenlasten: adjustedSpace * 0.60,
            buffer: adjustedSpace * 0.25,
            aflosCapaciteit: adjustedSpace * 0.15,
        };

        return {
            vastInkomen: fixedIncome,
            vasteLasten: totalMonthlyCosts,
            huidigeRegelingen: activeDebtPayments,
            beschikbaar: availableSpace,
            basisBeschikbaar: availableSpace,
            aangepastBeschikbaar: adjustedSpace,
            adjustments: adjustments,
            hasVtlbSettings: !!vtlbSettings,
            ...budgetDistribution
        };
    }
}

export const incomeService = new IncomeService();
export const monthlyCostService = new MonthlyCostService();
export const debtService = new DebtService();
export const vtblService = new VTBLService();
export const potService = new PotService();