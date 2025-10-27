import { useCallback } from 'react';
import { SimulationInput, MonthlyResult, SimulationResult } from '../types';
import { INSS_PRO_LABORE_COST } from '../constants';

// Helper function to determine the current month index (1-indexed)
const getCurrentMonthIndex = (startDateStr: string): number => {
    // Ensure date string is parsed correctly (YYYY-MM-DD)
    const start = new Date(startDateStr + 'T00:00:00');
    const now = new Date();
    
    // Calculate difference in months
    const diffYears = now.getFullYear() - start.getFullYear();
    const diffMonths = now.getMonth() - start.getMonth();
    
    // If today is before the start date, month index is 1.
    if (diffYears < 0 || (diffYears === 0 && diffMonths < 0)) {
        return 1;
    }
    
    // Month index is 1-based.
    return (diffYears * 12) + diffMonths + 1;
};


export const useFinancialSimulator = () => {
    const calculateSimulation = useCallback((
        inputs: SimulationInput, 
        duration: number, 
        actualData: Record<number, Partial<MonthlyResult>> = {} // NOVO ARGUMENTO
    ): SimulationResult => {
        
        const currentMonthIndex = getCurrentMonthIndex(inputs.startDate); // Determina o mês atual para lógica R/P
        
        const monthlyData: MonthlyResult[] = [];
        let accumulatedCashFlow = inputs.initialCash;
        let accumulatedRentalContracts = 0;

        // Reset totals for recalculation
        let totalGrossSales = 0, totalGrossRental1st = 0, totalGrossRentalAdmin = 0, totalGrossRegularization = 0, totalGrossRevenue = 0;
        let totalTax = 0, totalCommVarSaleS = 0, totalCommVarSaleC = 0, totalCommVarRent1stS = 0, totalCommVarRent1stI = 0;
        let totalNetRevenueForFixedCosts = 0, totalFixedCosts = 0, totalPropertyPayments = 0;
        let totalSalesCount = 0, totalRentalsCount = 0, totalVgv = 0;
        
        const NUMBER_OF_PARTNERS = 3; 

        const baseFixedCosts = inputs.custoContabilidade + inputs.custoCRM + inputs.custoInternetTel + inputs.custoAguaLuz + inputs.custoOutrosFixos + inputs.custoAluguelCondominio + inputs.salarioAdministrativo;

        for (let month = 1; month <= duration; month++) {
            
            // Verifica se há dados reais para este mês
            const actual = actualData[month];
            const isActualMonth = !!actual && month < currentMonthIndex; // Só consideramos 'real' se o mês já passou
            
            // --- Determine Projected Values (P) ---
            
            const isSlowMonth = month <= inputs.slowStartMonths;
            const isExpansionActive = month >= inputs.expansionStartMonth;

            const salesTargetPerPartner = isSlowMonth ? inputs.salesTargetPartnersSlow : inputs.salesTargetPartnersFull;
            const projectedSalesCountPartners = salesTargetPerPartner * NUMBER_OF_PARTNERS;
            
            let projectedSalesCountBrokers = 0;
            const fullBrokerTarget = inputs.numberOfBrokers * inputs.salesTargetBrokersFull;
            if (isExpansionActive && inputs.numberOfBrokers > 0 && fullBrokerTarget > 0) {
                const expansionMonthIndex = month - inputs.expansionStartMonth;
                if (expansionMonthIndex === 0) projectedSalesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes1 / 100));
                else if (expansionMonthIndex === 1) projectedSalesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes2 / 100));
                else projectedSalesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes3 / 100));
            }

            const projectedRentalsCount = isSlowMonth ? inputs.rentalsTargetSlow : inputs.rentalsTargetFull;
            
            // --- Use Actual (A) or Projected (P) Counts ---
            
            const projectedSalesCountTotal = projectedSalesCountPartners + projectedSalesCountBrokers;
            
            // Se houver dado real de vendas, usamos ele. Caso contrário, usamos a projeção.
            const salesCount = isActualMonth && actual.actualSalesCount !== null ? actual.actualSalesCount : projectedSalesCountTotal;
            
            // Se usamos o total real, distribuímos proporcionalmente entre sócios e corretores (mantendo a proporção projetada)
            const salesCountPartners = isActualMonth && actual.actualSalesCount !== null 
                ? Math.round(salesCount * (projectedSalesCountPartners / (projectedSalesCountTotal || 1))) 
                : projectedSalesCountPartners;
                
            const salesCountBrokers = isActualMonth && actual.actualSalesCount !== null 
                ? salesCount - salesCountPartners 
                : projectedSalesCountBrokers;
                
            const rentalsCount = isActualMonth && actual.actualRentalsCount !== null ? actual.actualRentalsCount : projectedRentalsCount;
            
            const vgv = salesCount * inputs.avgSaleValue;

            // --- Fixed Costs (P/A) ---
            const projectedMarketingCost = isExpansionActive ? inputs.marketingExpandedCost : inputs.marketingBaseCost;
            const projectedInternCostTotal = isExpansionActive ? inputs.numberOfInterns * inputs.internCost : 0;
            
            let projectedProLaboreCost = 0;
            let projectedINSSCost = 0;
            if (month >= inputs.proLaboreStartMonth) {
                projectedProLaboreCost = inputs.proLaboreAlessandro + inputs.proLaboreTamires + inputs.proLaboreMoisez;
                projectedINSSCost = INSS_PRO_LABORE_COST;
            }

            const projectedFixedCosts = baseFixedCosts + projectedProLaboreCost + projectedINSSCost + projectedMarketingCost + projectedInternCostTotal;
            
            // --- Property Payments (P/A) ---
            let projectedPropertyPayment = 0;
            if (month === 1) projectedPropertyPayment += inputs.custoSetupInicial;
            if (month === inputs.propertyPayment1Month) projectedPropertyPayment += inputs.propertyPayment1Amount;
            if (month === inputs.propertyPayment2Month) {
                const correction = inputs.propertyPayment2Amount * (inputs.taxaSelicEstimadaAnual / 100);
                projectedPropertyPayment += inputs.propertyPayment2Amount + correction;
            }
            if (month === inputs.propertyPayment3Month) {
                projectedPropertyPayment += inputs.propertyPayment3Amount;
            }
            
            // Usa o valor real se fornecido, caso contrário, usa a projeção
            const currentFixedCosts = isActualMonth && actual.actualCurrentFixedCosts !== null ? actual.actualCurrentFixedCosts : projectedFixedCosts;
            const currentPropertyPayment = isActualMonth && actual.actualPropertyPayment !== null ? actual.actualPropertyPayment : projectedPropertyPayment;
            
            // --- Revenue Calculation (P/A) ---
            
            // 1. Cálculo da Receita Bruta (Total de comissão da imobiliária)
            const grossRevenueSalesPartners = salesCountPartners * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSalesBrokers = salesCountBrokers * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSales = grossRevenueSalesPartners + grossRevenueSalesBrokers;
            
            const grossRevenueRental1st = rentalsCount * inputs.avgRentalValue;
            
            // Accumulated contracts must be based on actual rentals if available for previous months
            // accumulatedRentalContracts já carrega o valor do mês anterior.
            
            const grossRevenueRentalAdmin = accumulatedRentalContracts * inputs.avgRentalValue * (inputs.commissionRateRentalAdmin / 100);
            const grossRevenueRegularization = inputs.avgRegularizationsPerMonth * inputs.avgRegularizationValue;
            
            const projectedGrossRevenueTotal = grossRevenueSales + grossRevenueRental1st + grossRevenueRentalAdmin + grossRevenueRegularization;
            
            // Usa Receita Bruta Total Real se fornecida, caso contrário usa a calculada
            const grossRevenueTotal = isActualMonth && actual.actualGrossRevenueTotal !== null ? actual.actualGrossRevenueTotal : projectedGrossRevenueTotal;

            // 2. Cálculo da Comissão Variável dos Corretores Externos (Custo que não é faturamento da empresa)
            let commissionVarSalesBrokersPaid = 0;
            if (salesCountBrokers > 0 && inputs.avgSaleValue > 0) {
                const salesBrokerInternalListing = Math.round(salesCountBrokers * (inputs.brokerInternalListingRatio / 100));
                const salesBrokerExternalListing = salesCountBrokers - salesBrokerInternalListing;
                const commissionPerSaleInternal = inputs.avgSaleValue * (inputs.brokerCommissionSale / 100);
                const commissionPerSaleExternal = inputs.avgSaleValue * ((inputs.brokerCommissionSale + inputs.brokerCommissionListing) / 100);
                commissionVarSalesBrokersPaid = (salesBrokerInternalListing * commissionPerSaleInternal) + (salesBrokerExternalListing * commissionPerSaleExternal);
            }
            
            // 3. Faturamento Tributável (Base de Cálculo para Imposto e Índices)
            const taxableGrossRevenue = grossRevenueTotal - commissionVarSalesBrokersPaid;

            // 4. Cálculo do Imposto sobre o Faturamento Tributável
            const taxAmount = taxableGrossRevenue * (inputs.taxRate / 100);

            // 5. Outros Custos Variáveis (sobre o Faturamento Bruto Total)
            const otherVariableCosts = grossRevenueTotal * (inputs.outrosCustosVarPercentFatBruto / 100);

            // 6. Comissões Variáveis dos Sócios
            const commissionVarSalesPartners = grossRevenueSalesPartners * (inputs.partnerCommissionVarSale / 100);
            const commissionVarRental1stPartners = grossRevenueRental1st * (inputs.partnerCommissionVarRental1st / 100);
            
            // 7. Comissões Variáveis de Aluguel para Corretores (se aplicável)
            const brokerRental1stComm = isExpansionActive ? grossRevenueRental1st * (inputs.brokerCommissionRental1stPercent / 100) : 0;
            const brokerRentalAdminComm = isExpansionActive ? grossRevenueRentalAdmin * (inputs.brokerCommissionRentalAdminPercent / 100) : 0;
            
            // 8. Comissões Variáveis de Aluguel para Estagiários (NOVO)
            let commissionVarRental1stInterns = 0;
            if (isExpansionActive && inputs.numberOfInterns > 0) {
                // Calcula a porção de novos aluguéis atribuída a estagiários
                const internRentalPortion = grossRevenueRental1st * (inputs.internRentalRatio / 100);
                // Calcula a comissão sobre essa porção
                commissionVarRental1stInterns = internRentalPortion * (inputs.internCommissionRental1stPercent / 100);
            }

            // 9. Receita Líquida para Custos Fixos (Net Revenue)
            const netRevenueForFixedCosts = taxableGrossRevenue 
                - taxAmount 
                - commissionVarSalesPartners 
                - commissionVarRental1stPartners 
                - otherVariableCosts 
                - brokerRental1stComm 
                - brokerRentalAdminComm
                - commissionVarRental1stInterns; // Subtrai comissão de estagiários
            
            // 10. Monthly Cash Flow
            const projectedMonthlyCashFlow = netRevenueForFixedCosts - currentFixedCosts - currentPropertyPayment;
            
            // Usa Fluxo de Caixa Mensal Real se fornecido, caso contrário usa a projeção
            const monthlyCashFlow = isActualMonth && actual.actualMonthlyCashFlow !== null ? actual.actualMonthlyCashFlow : projectedMonthlyCashFlow;
            
            // 11. Accumulated Cash Flow
            accumulatedCashFlow += monthlyCashFlow;
            
            // 12. Update Accumulated Rental Contracts
            accumulatedRentalContracts += rentalsCount;

            // Calculation of Contribution Margin, Operating Profitability, and Break-Even Point
            const contributionMarginPercent = taxableGrossRevenue > 0 ? (netRevenueForFixedCosts / taxableGrossRevenue) * 100 : 0;
            
            const operatingProfitabilityPercent = netRevenueForFixedCosts > 0 ? (monthlyCashFlow / netRevenueForFixedCosts) * 100 : 0;
            
            const breakEvenPoint = contributionMarginPercent > 0 ? currentFixedCosts / (contributionMarginPercent / 100) : 0;

            // --- Store Results ---
            
            const resultRow: MonthlyResult = {
                month,
                grossRevenueSales,
                grossRevenueRental1st,
                grossRevenueRentalAdmin,
                grossRevenueRegularization,
                grossRevenueTotal,
                taxAmount,
                commissionVarSalesPartners,
                commissionVarSalesBrokersPaid,
                commissionVarRental1stPartners,
                commissionVarRental1stInterns, // NOVO
                netRevenueForFixedCosts,
                currentFixedCosts,
                currentPropertyPayment,
                monthlyCashFlow,
                accumulatedCashFlow,
                salesCount,
                salesCountPartners, 
                salesCountBrokers,  
                rentalsCount,
                contributionMarginPercent,
                operatingProfitabilityPercent,
                breakEvenPoint,
                vgv,
                
                // Armazena os inputs reais para display/comparação
                actualSalesCount: actual?.actualSalesCount ?? null,
                actualRentalsCount: actual?.actualRentalsCount ?? null,
                actualGrossRevenueTotal: actual?.actualGrossRevenueTotal ?? null,
                actualCurrentFixedCosts: actual?.actualCurrentFixedCosts ?? null,
                actualPropertyPayment: actual?.actualPropertyPayment ?? null,
                actualMonthlyCashFlow: actual?.actualMonthlyCashFlow ?? null,
            };
            
            monthlyData.push(resultRow);

            // --- Update Totals (using the calculated values for the month) ---
            totalGrossSales += grossRevenueSales;
            totalGrossRental1st += grossRevenueRental1st;
            totalGrossRentalAdmin += grossRevenueRentalAdmin;
            totalGrossRegularization += grossRevenueRegularization;
            totalGrossRevenue += grossRevenueTotal;
            totalTax += taxAmount;
            totalCommVarSaleS += commissionVarSalesPartners;
            totalCommVarSaleC += commissionVarSalesBrokersPaid;
            totalCommVarRent1stS += commissionVarRental1stPartners;
            totalCommVarRent1stI += commissionVarRental1stInterns; // NOVO
            totalNetRevenueForFixedCosts += netRevenueForFixedCosts;
            totalFixedCosts += currentFixedCosts;
            totalPropertyPayments += currentPropertyPayment;
            totalSalesCount += salesCount;
            totalRentalsCount += rentalsCount;
            totalVgv += vgv;
        }
        
        // Recalculando o Faturamento Tributável Total para os Totais
        const totalTaxableGrossRevenue = totalGrossRevenue - totalCommVarSaleC;

        const totals = {
            grossRevenueSales: totalGrossSales,
            grossRevenueRental1st: totalGrossRental1st,
            grossRevenueRentalAdmin: totalGrossRentalAdmin,
            grossRevenueRegularization: totalGrossRegularization,
            grossRevenueTotal: totalGrossRevenue,
            taxAmount: totalTax,
            commissionVarSalesPartners: totalCommVarSaleS,
            commissionVarSalesBrokersPaid: totalCommVarSaleC,
            commissionVarRental1stPartners: totalCommVarRent1stS,
            commissionVarRental1stInterns: totalCommVarRent1stI, // NOVO
            netRevenueForFixedCosts: totalNetRevenueForFixedCosts,
            totalFixedCosts: totalFixedCosts,
            totalPropertyPayments: totalPropertyPayments,
            finalAccumulatedCashFlow: accumulatedCashFlow,
            totalSalesCount,
            totalRentalsCount,
            totalVgv,
            avgContributionMarginPercent: totalTaxableGrossRevenue > 0 ? (totalNetRevenueForFixedCosts / totalTaxableGrossRevenue) * 100 : 0,
            avgOperatingProfitabilityPercent: totalNetRevenueForFixedCosts > 0 ? ((accumulatedCashFlow - inputs.initialCash) / totalNetRevenueForFixedCosts) * 100 : 0,
            avgBreakEvenPoint: monthlyData.reduce((acc, row) => acc + row.breakEvenPoint, 0) / duration,
        };
        
        const correctedPayment2 = inputs.propertyPayment2Amount * (1 + inputs.taxaSelicEstimadaAnual / 100);
        const totalPropertyCost = inputs.propertyPayment1Amount + correctedPayment2 + inputs.propertyPayment3Amount;
        const bufferTarget = totalPropertyCost * 0.10;
        const isViable = accumulatedCashFlow >= 0;

        const summary = {
            finalCash: accumulatedCashFlow,
            totalPropertyCost: totalPropertyCost,
            isViable: isViable,
            bufferTarget: bufferTarget,
            bufferMet: isViable && accumulatedCashFlow >= bufferTarget,
        };

        return { monthlyData, totals, summary };

    }, []);
    
    return calculateSimulation;
};