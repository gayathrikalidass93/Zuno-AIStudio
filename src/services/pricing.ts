import {
  BookingPricing,
  PricingConfig,
  BroomingMoppingConfig,
  BathroomCleaningConfig,
  WorkScopeBreakdown,
} from '../types';

/**
 * Calculates work-scope based pricing for Bathroom Cleaning.
 * Does NOT calculate the price from hours!
 * 1 Bathroom + Cleaning type + Additional scope = Suggested price
 */
export function calculateBathroomCleaningPrice(
  config: BathroomCleaningConfig,
  pricingConfig: PricingConfig
): number {
  const baseRate = pricingConfig.bathroomCleaningRatePerBath || 149;
  const regularAddon = pricingConfig.bathroomRegularAddon || 50;
  const deepCleanAddon = pricingConfig.bathroomDeepCleanAddon || 120;

  let perBathPrice = baseRate;
  if (config.cleaningType === 'regular') {
    perBathPrice += regularAddon;
  } else if (config.cleaningType === 'deep') {
    perBathPrice += deepCleanAddon;
  }

  // Scope specific additions (e.g. tiles, shower area descaling)
  let scopeAddon = 0;
  if (config.scope.tiles && config.cleaningType !== 'casual') scopeAddon += 30;
  if (config.scope.showerArea && config.cleaningType !== 'casual') scopeAddon += 25;

  const total = config.bathroomCount * perBathPrice + scopeAddon;
  return Math.round(total);
}

/**
 * Calculates work-scope based pricing for Brooming & Mopping.
 * Asks strictly for floor areas: Bedrooms, Halls, Kitchens, other floor areas, Balcony.
 * Does NOT ask for bathrooms/toilets inside Brooming & Mopping!
 */
export function calculateBroomingMoppingPrice(
  config: BroomingMoppingConfig,
  pricingConfig: PricingConfig
): number {
  const roomRate = pricingConfig.broomingBaseRate || 60;
  const multiplier = config.cleaningType === 'deep'
    ? (pricingConfig.broomingDeepCleanMultiplier || 1.5)
    : config.cleaningType === 'regular'
    ? 1.2
    : 1.0;

  const roomCount =
    (config.bedrooms || 0) +
    (config.halls || 0) +
    (config.kitchens || 0) +
    (config.otherFloorAreas || 0) +
    (config.balcony ? 0.5 : 0);

  const baseFloorPrice = Math.max(1, roomCount) * roomRate * multiplier;
  return Math.round(baseFloorPrice);
}

/**
 * Combined Work-Scope Breakdown and Pricing.
 * Supports booking Home Cleaning, Bathroom Cleaning, or both together as separate work items.
 * Final price is based on the combined work scope, NOT converted into an hourly calculation.
 */
export function calculateWorkScopeBreakdown(
  params: {
    homeCleaning?: {
      broomingMopping?: BroomingMoppingConfig;
      dusting?: boolean;
      generalCleaning?: boolean;
      kitchenCleaning?: boolean;
    };
    bathroomCleaning?: {
      config: BathroomCleaningConfig;
    };
    negotiatedDiscount?: number;
  },
  pricingConfig: PricingConfig
): WorkScopeBreakdown {
  let homePrice = 0;
  let homeBreakdown: WorkScopeBreakdown['homeCleaning'] = undefined;

  if (params.homeCleaning) {
    let bmPrice = 0;
    if (params.homeCleaning.broomingMopping) {
      bmPrice = calculateBroomingMoppingPrice(params.homeCleaning.broomingMopping, pricingConfig);
    }
    const dustingPrice = params.homeCleaning.dusting ? 70 : 0;
    const generalPrice = params.homeCleaning.generalCleaning ? 120 : 0;
    const kitchenPrice = params.homeCleaning.kitchenCleaning ? 99 : 0;

    homePrice = bmPrice + dustingPrice + generalPrice + kitchenPrice;
    homeBreakdown = {
      broomingMopping: params.homeCleaning.broomingMopping,
      dusting: params.homeCleaning.dusting,
      generalCleaning: params.homeCleaning.generalCleaning,
      kitchenCleaning: params.homeCleaning.kitchenCleaning,
      price: homePrice,
    };
  }

  let bathPrice = 0;
  let bathBreakdown: WorkScopeBreakdown['bathroomCleaning'] = undefined;

  if (params.bathroomCleaning) {
    bathPrice = calculateBathroomCleaningPrice(params.bathroomCleaning.config, pricingConfig);
    bathBreakdown = {
      config: params.bathroomCleaning.config,
      price: bathPrice,
    };
  }

  const suggestedTotalPrice = homePrice + bathPrice;
  const discount = params.negotiatedDiscount || 0;
  const agreedPrice = Math.max(99, suggestedTotalPrice - discount);

  return {
    homeCleaning: homeBreakdown,
    bathroomCleaning: bathBreakdown,
    suggestedTotalPrice,
    agreedPrice,
    negotiatedDiscount: discount > 0 ? discount : undefined,
  };
}

/**
 * Standard booking pricing calculation (maintains compatibility with general chore visits)
 */
export function calculatePricing(
  durationHours: number,
  taskCount: number,
  isUrgent: boolean,
  isWeekend: boolean,
  config: PricingConfig,
  customHourlyRate?: number,
  workScopePrice?: number
): BookingPricing {
  // If work-scope based price is provided (e.g. Brooming & Mopping and/or Bathroom Cleaning),
  // use that suggested price directly rather than hourly calculation!
  if (workScopePrice && workScopePrice > 0) {
    const baseAmount = workScopePrice;
    const urgentFee = isUrgent ? Math.round(baseAmount * (config.urgentPremiumPercent / 100)) : 0;
    const weekendFee = isWeekend ? Math.round(baseAmount * (config.weekendPremiumPercent / 100)) : 0;
    const totalAmount = baseAmount + urgentFee + weekendFee;
    const helperPayout = Math.round(totalAmount * (config.helperPayoutPercent / 100));
    const zunoFee = totalAmount - helperPayout;

    return {
      baseHourlyRate: config.baseHourlyRate,
      durationHours,
      baseAmount,
      taskComplexityAdjustment: 0,
      urgentFee,
      weekendFee,
      multiTaskDiscount: 0,
      subtotal: totalAmount,
      zunoFee,
      helperPayout,
      totalAmount,
    };
  }

  const effectiveHours = Math.max(config.minimumDurationHours, durationHours);
  const effectiveHourlyRate =
    customHourlyRate && customHourlyRate > 0 ? customHourlyRate : config.baseHourlyRate;
  const baseAmount = effectiveHours * effectiveHourlyRate;

  // Multi-task discount: When combining 3 or more tasks in one visit, award bundle discount
  const multiTaskDiscount =
    taskCount >= 3 ? Math.round(baseAmount * (config.multiTaskDiscountPercent / 100)) : 0;

  // Urgent fee
  const urgentFee = isUrgent ? Math.round(baseAmount * (config.urgentPremiumPercent / 100)) : 0;

  // Weekend fee
  const weekendFee = isWeekend ? Math.round(baseAmount * (config.weekendPremiumPercent / 100)) : 0;

  const subtotal = baseAmount - multiTaskDiscount + urgentFee + weekendFee;
  const totalAmount = Math.max(subtotal, effectiveHourlyRate);

  // Helper payout vs ZUNO platform fee
  const helperPayout = Math.round(totalAmount * (config.helperPayoutPercent / 100));
  const zunoFee = totalAmount - helperPayout;

  return {
    baseHourlyRate: effectiveHourlyRate,
    durationHours: effectiveHours,
    baseAmount,
    taskComplexityAdjustment: 0,
    urgentFee,
    weekendFee,
    multiTaskDiscount,
    subtotal,
    zunoFee,
    helperPayout,
    totalAmount,
  };
}
