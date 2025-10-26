
export interface SimulationInput {
  avgSaleValue: number;
  avgRentalValue: number;
  taxRate: number;
  propertyPayment1Month: number;
  propertyPayment1Amount: number;
  propertyPayment2Month: number;
  propertyPayment2Amount: number;
  initialCash: number;
  // baseFixedCosts is replaced by detailed costs
  custoContabilidade: number;
  custoCRM: number;
  custoInternetTel: number;
  custoAguaLuz: number;
  custoOutrosFixos: number;
  taxaSelicEstimadaAnual: number;
  outrosCustosVarPercentFatBruto: number;
  proLaboreTotal: number;
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
  // New metrics
  salesCount: number;
  rentalsCount: number;
  contributionMarginPercent: number;
  operatingProfitabilityPercent: number;
  breakEvenPoint: number;
}

export interface SimulationTotals {
    grossRevenueSales: number;
    grossRevenueRental1st: number;
    grossRevenueRentalAdmin: number;
    grossRevenueTotal: number;
    taxAmount: number;
    commissionVarSalesPartners: number;
    commissionVarSalesBrokersPaid: number;
    commissionVarRental1stPartners: number;
    netRevenueForFixedCosts: number;
    totalFixedCosts: number;
    totalPropertyPayments: number;
    finalAccumulatedCashFlow: number;
    // New totals/averages
    totalSalesCount: number;
    totalRentalsCount: number;
    avgContributionMarginPercent: number;
    avgOperatingProfitabilityPercent: number;
    avgBreakEvenPoint: number;
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