import { useCallback } from 'react';
import { SimulationInput, MonthlyResult, SimulationResult } from '../types';
import { INSS_PRO_LABORE_COST } from '../constants';

export const useFinancialSimulator = () => {
    const calculateSimulation = useCallback((inputs: SimulationInput, duration: number): SimulationResult => {
        const monthlyData: MonthlyResult[] = [];
        let accumulatedCashFlow = inputs.initialCash;
        let accumulatedRentalContracts = 0;

        let totalGrossSales = 0, totalGrossRental1st = 0, totalGrossRentalAdmin = 0, totalGrossRegularization = 0, totalGrossRevenue = 0;
        let totalTax = 0, totalCommVarSaleS = 0, totalCommVarSaleC = 0, totalCommVarRent1stS = 0;
        let totalNetRevenueForFixedCosts = 0, totalFixedCosts = 0, totalPropertyPayments = 0;
        let totalSalesCount = 0, totalRentalsCount = 0, totalVgv = 0;
        
        // Definindo o número de sócios com base nos inputs de pró-labore
        const NUMBER_OF_PARTNERS = 3; 

        const baseFixedCosts = inputs.custoContabilidade + inputs.custoCRM + inputs.custoInternetTel + inputs.custoAguaLuz + inputs.custoOutrosFixos + inputs.custoAluguelCondominio + inputs.salarioAdministrativo;

        for (let month = 1; month <= duration; month++) {
            const isSlowMonth = month <= inputs.slowStartMonths;
            const isExpansionActive = month >= inputs.expansionStartMonth;

            // Meta de vendas por sócio * Número de sócios
            const salesTargetPerPartner = isSlowMonth ? inputs.salesTargetPartnersSlow : inputs.salesTargetPartnersFull;
            const salesCountPartners = salesTargetPerPartner * NUMBER_OF_PARTNERS;
            
            let salesCountBrokers = 0;
            const fullBrokerTarget = inputs.numberOfBrokers * inputs.salesTargetBrokersFull;
            if (isExpansionActive && inputs.numberOfBrokers > 0 && fullBrokerTarget > 0) {
                const expansionMonthIndex = month - inputs.expansionStartMonth;
                if (expansionMonthIndex === 0) salesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes1 / 100));
                else if (expansionMonthIndex === 1) salesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes2 / 100));
                else salesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes3 / 100));
            }

            const currentRentalsTarget = isSlowMonth ? inputs.rentalsTargetSlow : inputs.rentalsTargetFull;
            const salesCount = salesCountPartners + salesCountBrokers;
            const rentalsCount = currentRentalsTarget;
            const vgv = salesCount * inputs.avgSaleValue;

            const currentMarketingCost = isExpansionActive ? inputs.marketingExpandedCost : inputs.marketingBaseCost;
            const currentInternCostTotal = isExpansionActive ? inputs.numberOfInterns * inputs.internCost : 0;
            
            let currentProLaboreCost = 0;
            let currentINSSCost = 0;
            if (month >= inputs.proLaboreStartMonth) {
                currentProLaboreCost = inputs.proLaboreAlessandro + inputs.proLaboreTamires + inputs.proLaboreMoisez;
                currentINSSCost = INSS_PRO_LABORE_COST;
            }

            const currentFixedCosts = baseFixedCosts + currentProLaboreCost + currentINSSCost + currentMarketingCost + currentInternCostTotal;

            // 1. Cálculo da Receita Bruta (Total de comissão da imobiliária)
            const grossRevenueSalesPartners = salesCountPartners * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSalesBrokers = salesCountBrokers * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSales = grossRevenueSalesPartners + grossRevenueSalesBrokers;
            
            const grossRevenueRental1st = currentRentalsTarget * inputs.avgRentalValue;
            const grossRevenueRentalAdmin = accumulatedRentalContracts * inputs.avgRentalValue * (inputs.commissionRateRentalAdmin / 100);
            const grossRevenueRegularization = inputs.avgRegularizationsPerMonth * inputs.avgRegularizationValue;
            
            const grossRevenueTotal = grossRevenueSales + grossRevenueRental1st + grossRevenueRentalAdmin + grossRevenueRegularization;

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
            // Faturamento Bruto Total - Comissão dos Corretores Externos
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

            // 8. Receita Líquida para Custos Fixos (Net Revenue)
            const netRevenueForFixedCosts = taxableGrossRevenue 
                - taxAmount 
                - commissionVarSalesPartners 
                - commissionVarRental1stPartners 
                - otherVariableCosts 
                - brokerRental1stComm 
                - brokerRentalAdminComm;
            
            let currentPropertyPayment = 0;
            if (month === 1) currentPropertyPayment += inputs.custoSetupInicial;
            if (month === inputs.propertyPayment1Month) currentPropertyPayment += inputs.propertyPayment1Amount;
            if (month === inputs.propertyPayment2Month) {
                const correction = inputs.propertyPayment2Amount * (inputs.taxaSelicEstimadaAnual / 100);
                currentPropertyPayment += inputs.propertyPayment2Amount + correction;
            }

            const monthlyCashFlow = netRevenueForFixedCosts - currentFixedCosts - currentPropertyPayment;
            accumulatedCashFlow += monthlyCashFlow;
            accumulatedRentalContracts += currentRentalsTarget;

            // Calculation of Contribution Margin, Operating Profitability, and Break-Even Point
            // Base para índices agora é o Faturamento Tributável (Taxable Gross Revenue)
            const contributionMarginPercent = taxableGrossRevenue > 0 ? (netRevenueForFixedCosts / taxableGrossRevenue) * 100 : 0;
            
            // Lucratividade Operacional = (Fluxo Caixa Mês / Receita Líquida) * 100
            const operatingProfitabilityPercent = netRevenueForFixedCosts > 0 ? (monthlyCashFlow / netRevenueForFixedCosts) * 100 : 0;
            
            const breakEvenPoint = contributionMarginPercent > 0 ? currentFixedCosts / (contributionMarginPercent / 100) : 0;

            monthlyData.push({
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
                netRevenueForFixedCosts,
                currentFixedCosts,
                currentPropertyPayment,
                monthlyCashFlow,
                accumulatedCashFlow,
                salesCount,
                salesCountPartners, // Adicionado
                salesCountBrokers,  // Adicionado
                rentalsCount,
                contributionMarginPercent,
                operatingProfitabilityPercent,
                breakEvenPoint,
                vgv
            });

            totalGrossSales += grossRevenueSales;
            totalGrossRental1st += grossRevenueRental1st;
            totalGrossRentalAdmin += grossRevenueRentalAdmin;
            totalGrossRegularization += grossRevenueRegularization;
            totalGrossRevenue += grossRevenueTotal;
            totalTax += taxAmount;
            totalCommVarSaleS += commissionVarSalesPartners;
            totalCommVarSaleC += commissionVarSalesBrokersPaid;
            totalCommVarRent1stS += commissionVarRental1stPartners;
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
            netRevenueForFixedCosts: totalNetRevenueForFixedCosts,
            totalFixedCosts: totalFixedCosts,
            totalPropertyPayments: totalPropertyPayments,
            finalAccumulatedCashFlow: accumulatedCashFlow,
            totalSalesCount,
            totalRentalsCount,
            totalVgv,
            // Recalculando a média total com a nova fórmula (baseada no Faturamento Tributável Total)
            avgContributionMarginPercent: totalTaxableGrossRevenue > 0 ? (totalNetRevenueForFixedCosts / totalTaxableGrossRevenue) * 100 : 0,
            avgOperatingProfitabilityPercent: totalNetRevenueForFixedCosts > 0 ? ((accumulatedCashFlow - inputs.initialCash) / totalNetRevenueForFixedCosts) * 100 : 0,
            avgBreakEvenPoint: monthlyData.reduce((acc, row) => acc + row.breakEvenPoint, 0) / duration,
        };
        
        const correctedPayment2 = inputs.propertyPayment2Amount * (1 + inputs.taxaSelicEstimadaAnual / 100);
        const totalPropertyCost = inputs.propertyPayment1Amount + correctedPayment2;
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