import { useCallback } from 'react';
import { SimulationInput, MonthlyResult, SimulationResult } from '../types';

export const useFinancialSimulator = () => {
    const calculateSimulation = useCallback((inputs: SimulationInput, duration: number): SimulationResult => {
        const monthlyData: MonthlyResult[] = [];
        let accumulatedCashFlow = inputs.initialCash;
        let accumulatedRentalContracts = 0;

        let totalGrossSales = 0, totalGrossRental1st = 0, totalGrossRentalAdmin = 0, totalGrossRevenue = 0;
        let totalTax = 0, totalCommVarSaleS = 0, totalCommVarSaleC = 0, totalCommVarRent1stS = 0;
        let totalNetRevenueForFixedCosts = 0, totalFixedCosts = 0, totalPropertyPayments = 0;
        let totalSalesCount = 0, totalRentalsCount = 0, totalVgv = 0;

        const baseFixedCosts = inputs.custoContabilidade + inputs.custoCRM + inputs.custoInternetTel + inputs.custoAguaLuz + inputs.custoOutrosFixos + inputs.custoAluguelCondominio + inputs.salarioAdministrativo;

        for (let month = 1; month <= duration; month++) {
            const isSlowMonth = month <= inputs.slowStartMonths;
            const isExpansionActive = month >= inputs.expansionStartMonth;

            const currentSalesTargetPartners = isSlowMonth ? inputs.salesTargetPartnersSlow : inputs.salesTargetPartnersFull;
            
            let currentSalesTargetBrokers = 0;
            const fullBrokerTarget = inputs.numberOfBrokers * inputs.salesTargetBrokersFull;
            if (isExpansionActive && inputs.numberOfBrokers > 0 && fullBrokerTarget > 0) {
                const expansionMonthIndex = month - inputs.expansionStartMonth;
                if (expansionMonthIndex === 0) currentSalesTargetBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes1 / 100));
                else if (expansionMonthIndex === 1) currentSalesTargetBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes2 / 100));
                else currentSalesTargetBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes3 / 100));
            }

            const currentRentalsTarget = isSlowMonth ? inputs.rentalsTargetSlow : inputs.rentalsTargetFull;
            const salesCount = currentSalesTargetPartners + currentSalesTargetBrokers;
            const rentalsCount = currentRentalsTarget;
            const vgv = salesCount * inputs.avgSaleValue;

            const currentMarketingCost = isExpansionActive ? inputs.marketingExpandedCost : inputs.marketingBaseCost;
            const currentInternCostTotal = isExpansionActive ? inputs.numberOfInterns * inputs.internCost : 0;
            
            let currentProLaboreCost = 0;
            if (month >= inputs.proLaboreStartMonth) {
                currentProLaboreCost = inputs.proLaboreAlessandro + inputs.proLaboreTamires + inputs.proLaboreMoisez;
            }

            const currentFixedCosts = baseFixedCosts + currentProLaboreCost + currentMarketingCost + currentInternCostTotal;

            const grossRevenueSalesPartners = currentSalesTargetPartners * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSalesBrokers = currentSalesTargetBrokers * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSales = grossRevenueSalesPartners + grossRevenueSalesBrokers;
            
            const grossRevenueRental1st = currentRentalsTarget * inputs.avgRentalValue;
            const grossRevenueRentalAdmin = accumulatedRentalContracts * inputs.avgRentalValue * (inputs.commissionRateRentalAdmin / 100);
            
            const grossRevenueTotal = grossRevenueSales + grossRevenueRental1st + grossRevenueRentalAdmin;
            const taxAmount = grossRevenueTotal * (inputs.taxRate / 100);

            const commissionVarSalesPartners = grossRevenueSalesPartners * (inputs.partnerCommissionVarSale / 100);
            
            let commissionVarSalesBrokersPaid = 0;
            if (currentSalesTargetBrokers > 0 && inputs.avgSaleValue > 0) {
                const salesBrokerInternalListing = Math.round(currentSalesTargetBrokers * (inputs.brokerInternalListingRatio / 100));
                const salesBrokerExternalListing = currentSalesTargetBrokers - salesBrokerInternalListing;
                const commissionPerSaleInternal = inputs.avgSaleValue * (inputs.brokerCommissionSale / 100);
                const commissionPerSaleExternal = inputs.avgSaleValue * ((inputs.brokerCommissionSale + inputs.brokerCommissionListing) / 100);
                commissionVarSalesBrokersPaid = (salesBrokerInternalListing * commissionPerSaleInternal) + (salesBrokerExternalListing * commissionPerSaleExternal);
            }
            
            const commissionVarRental1stPartners = grossRevenueRental1st * (inputs.partnerCommissionVarRental1st / 100);
            const otherVariableCosts = grossRevenueTotal * (inputs.outrosCustosVarPercentFatBruto / 100);
            const brokerRental1stComm = isExpansionActive ? grossRevenueRental1st * (inputs.brokerCommissionRental1stPercent / 100) : 0;
            const brokerRentalAdminComm = isExpansionActive ? grossRevenueRentalAdmin * (inputs.brokerCommissionRentalAdminPercent / 100) : 0;

            const netRevenueForFixedCosts = grossRevenueTotal - taxAmount - commissionVarSalesPartners - commissionVarSalesBrokersPaid - commissionVarRental1stPartners - otherVariableCosts - brokerRental1stComm - brokerRentalAdminComm;
            
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

            const contributionMarginPercent = grossRevenueTotal > 0 ? (netRevenueForFixedCosts / grossRevenueTotal) * 100 : 0;
            const operatingProfit = netRevenueForFixedCosts - currentFixedCosts;
            const operatingProfitabilityPercent = grossRevenueTotal > 0 ? (operatingProfit / grossRevenueTotal) * 100 : 0;
            const breakEvenPoint = contributionMarginPercent > 0 ? currentFixedCosts / (contributionMarginPercent / 100) : 0;

            monthlyData.push({
                month,
                grossRevenueSales,
                grossRevenueRental1st,
                grossRevenueRentalAdmin,
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
                rentalsCount,
                contributionMarginPercent,
                operatingProfitabilityPercent,
                breakEvenPoint,
                vgv
            });

            totalGrossSales += grossRevenueSales;
            totalGrossRental1st += grossRevenueRental1st;
            totalGrossRentalAdmin += grossRevenueRentalAdmin;
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

        const totals = {
            grossRevenueSales: totalGrossSales,
            grossRevenueRental1st: totalGrossRental1st,
            grossRevenueRentalAdmin: totalGrossRentalAdmin,
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
            avgContributionMarginPercent: totalGrossRevenue > 0 ? (totalNetRevenueForFixedCosts / totalGrossRevenue) * 100 : 0,
            avgOperatingProfitabilityPercent: totalGrossRevenue > 0 ? ((totalNetRevenueForFixedCosts - totalFixedCosts) / totalGrossRevenue) * 100 : 0,
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