export interface SimulationInput {
  avgSaleValue: number;
  avgRentalValue: number;
  avgRegularizationsPerMonth: number; // Novo
  avgRegularizationValue: number; // Novo
  taxRate: number;
  propertyPayment1Month: number;
  propertyPayment1Amount: number;
  propertyPayment2Month: number;
  propertyPayment2Amount: number;
  initialCash: number;
  custoSetupInicial: number;
  custoContabilidade: number;
  custoCRM: number;
  custoInternetTel: number;
  custoAguaLuz: number;
  custoAluguelCondominio: number;
  salarioAdministrativo: number;
  custoOutrosFixos: number;
  taxaSelicEstimadaAnual: number;
  outrosCustosVarPercentFatBruto: number;
  // Pro-labore changes
  proLaboreStartMonth: number;
  proLaboreAlessandro: number;
  proLaboreTamires: number;
  proLaboreMoisez: number;
  marketingBaseCost: number;
  marketingExpandedCost: number;
  expansionStartMonth: number;
  numberOfInterns: number;
  internCost: number;
  numberOfBrokers: number;
  slowStartMonths: number;
  salesTargetPartnersSlow: number;
  rentalsTargetSlow: number;
  salesTargetPartnersFull: number;
  salesTargetBrokersFull: number;
  percRampaMes1: number;
  percRampaMes2: number;
  percRampaMes3: number;
  rentalsTargetFull: number;
  commissionRateSale: number;
  partnerCommissionVarSale: number;
  brokerCommissionSale: number;
  brokerCommissionListing: number;
  brokerInternalListingRatio: number;
  partnerCommissionVarRental1st: number;
  brokerCommissionRental1stPercent: number;
  brokerCommissionRentalAdminPercent: number;
  commissionRateRentalAdmin: number;
}

export interface MonthlyResult {
  month: number;
  grossRevenueSales: number;
  grossRevenueRental1st: number;
  grossRevenueRentalAdmin: number;
  grossRevenueRegularization: number; // Novo
  grossRevenueTotal: number;
  taxAmount: number;
  commissionVarSalesPartners: number;
  commissionVarSalesBrokersPaid: number;
  commissionVarRental1stPartners: number;
  netRevenueForFixedCosts: number;
  currentFixedCosts: number;
  currentPropertyPayment: number;
  monthlyCashFlow: number;
  accumulatedCashFlow: number;
  salesCount: number;
  rentalsCount: number;
  contributionMarginPercent: number;
  operatingProfitabilityPercent: number;
  breakEvenPoint: number;
  vgv: number;
}

export interface SimulationTotals {
    grossRevenueSales: number;
    grossRevenueRental1st: number;
    grossRevenueRentalAdmin: number;
    grossRevenueRegularization: number; // Novo
    grossRevenueTotal: number;
    taxAmount: number;
    commissionVarSalesPartners: number;
    commissionVarSalesBrokersPaid: number;
    commissionVarRental1stPartners: number;
    netRevenueForFixedCosts: number;
    totalFixedCosts: number;
    totalPropertyPayments: number;
    finalAccumulatedCashFlow: number;
    totalSalesCount: number;
    totalRentalsCount: number;
    avgContributionMarginPercent: number;
    avgOperatingProfitabilityPercent: number;
    avgBreakEvenPoint: number;
    totalVgv: number;
}

export interface SimulationSummary {
  finalCash: number;
  totalPropertyCost: number;
  isViable: boolean;
  bufferTarget: number;
  bufferMet: boolean;
}

export interface SimulationResult {
  monthlyData: MonthlyResult[];
  totals: SimulationTotals;
  summary: SimulationSummary;
}
</dyad--write>

<dyad-write path="constants.ts" description="Adding default values for the new regularization inputs.">
import { SimulationInput } from './types';

export const initialSimulationInputs: SimulationInput = {
    avgSaleValue: 300000,
    avgRentalValue: 2500,
    avgRegularizationsPerMonth: 1,
    avgRegularizationValue: 3000,
    taxRate: 6,
    propertyPayment1Month: 6,
    propertyPayment1Amount: 40000,
    propertyPayment2Month: 12,
    propertyPayment2Amount: 275000,
    initialCash: 0,
    custoSetupInicial: 5000,
    custoContabilidade: 100,
    custoCRM: 470.30,
    custoInternetTel: 150,
    custoAguaLuz: 300,
    custoAluguelCondominio: 2000,
    salarioAdministrativo: 2500,
    custoOutrosFixos: 200,
    taxaSelicEstimadaAnual: 10,
    outrosCustosVarPercentFatBruto: 1,
    // Pro-labore defaults
    proLaboreStartMonth: 1,
    proLaboreAlessandro: 2000,
    proLaboreTamires: 2000,
    proLaboreMoisez: 2000,
    marketingBaseCost: 500,
    marketingExpandedCost: 3000,
    expansionStartMonth: 5,
    numberOfInterns: 2,
    internCost: 1000,
    numberOfBrokers: 4,
    slowStartMonths: 3,
    salesTargetPartnersSlow: 1,
    rentalsTargetSlow: 4,
    salesTargetPartnersFull: 3,
    salesTargetBrokersFull: 1, // Per broker
    percRampaMes1: 50,
    percRampaMes2: 75,
    percRampaMes3: 100,
    rentalsTargetFull: 8,
    commissionRateSale: 6,
    partnerCommissionVarSale: 20,
    brokerCommissionSale: 3,
    brokerCommissionListing: 1,
    brokerInternalListingRatio: 50,
    partnerCommissionVarRental1st: 30,
    brokerCommissionRental1stPercent: 0,
    brokerCommissionRentalAdminPercent: 0,
    commissionRateRentalAdmin: 10,
};