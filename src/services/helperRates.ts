import { Helper, ServiceCategory } from '../types';
import { MASTER_TASKS } from '../data/services';

/**
 * Standard work category definitions and typical Chennai hourly market rates
 */
export interface WorkRateInfo {
  category: ServiceCategory;
  name: string;
  tamilName: string;
  icon: string;
  askingRate: number; // what helper asks for this work per hour
  isPrimarySkill: boolean;
}

/**
 * Get helper's specific asking rate for an individual task ID
 */
export function getHelperAskingRateForTask(helper: Helper, taskId: string): number {
  const task = MASTER_TASKS.find((t) => t.id === taskId);
  if (!task) return helper.hourlyRate || 249;

  // 1. If helper has specific category rate
  if (helper.categoryRates && helper.categoryRates[task.category]) {
    return helper.categoryRates[task.category]!;
  }

  // 2. Reasonable category based derivation from helper's base rate
  const base = helper.hourlyRate || 249;
  switch (task.category) {
    case 'cleaning':
      return Math.round(base * 0.9); // Cleaning is usually slightly lower
    case 'cooking':
      return Math.round(base * 1.05); // Cooking requires culinary skill
    case 'laundry':
      return Math.round(base * 0.9);
    case 'organisation':
      return base;
    case 'family':
      return Math.round(base * 0.95);
    case 'kids':
      return Math.round(base * 1.15); // Childcare requires specialized verification
    default:
      return base;
  }
}

/**
 * Get the effective asking rate of a helper for a customer's selected task list.
 * If customer gave only sweeping, returns strictly the helper's asking rate for sweeping!
 */
export function getHelperEffectiveRateForTasks(helper: Helper, selectedTaskIds: string[]): number {
  if (!selectedTaskIds || selectedTaskIds.length === 0) {
    return helper.hourlyRate || 249;
  }

  // Calculate average asking rate for the customer's selected tasks
  const rates = selectedTaskIds.map((id) => getHelperAskingRateForTask(helper, id));
  const sum = rates.reduce((a, b) => a + b, 0);
  return Math.round(sum / rates.length);
}

/**
 * Get full list of work category rates for a helper so customer can compare.
 */
export function getHelperWorkRatesBreakdown(helper: Helper): WorkRateInfo[] {
  const categories: { id: ServiceCategory; name: string; tamilName: string; icon: string }[] = [
    { id: 'cleaning', name: 'Cleaning & Sweeping', tamilName: 'பெருக்குதல் & சுத்தம்', icon: '🧹' },
    { id: 'cooking', name: 'Cooking & Meal Prep', tamilName: 'சமையல்', icon: '🍳' },
    { id: 'laundry', name: 'Laundry & Ironing', tamilName: 'துணி துவைத்தல் & இஸ்திரி', icon: '👕' },
    { id: 'organisation', name: 'Wardrobe & Organising', tamilName: 'அடுக்குதல்', icon: '👗' },
    { id: 'family', name: 'Elder Care Assistance', tamilName: 'முதியோர் உதவி', icon: '👵' },
    { id: 'kids', name: 'Kids Care (Screened)', tamilName: 'குழந்தை பராமரிப்பு', icon: '👶' },
  ];

  return categories
    .map((cat) => {
      let askingRate = helper.hourlyRate || 249;
      if (helper.categoryRates && helper.categoryRates[cat.id]) {
        askingRate = helper.categoryRates[cat.id]!;
      } else {
        // Fallback realistic offset
        if (cat.id === 'cleaning') askingRate = Math.round((helper.hourlyRate || 249) * 0.9);
        else if (cat.id === 'cooking') askingRate = Math.round((helper.hourlyRate || 249) * 1.05);
        else if (cat.id === 'laundry') askingRate = Math.round((helper.hourlyRate || 249) * 0.9);
        else if (cat.id === 'kids') askingRate = Math.round((helper.hourlyRate || 249) * 1.15);
      }

      // Check if helper has skills in this category
      const hasSkill = helper.skills.some((skillId) => {
        const t = MASTER_TASKS.find((m) => m.id === skillId);
        return t?.category === cat.id;
      });

      // Special check for kids care
      if (cat.id === 'kids' && !helper.isChildcareVerified) {
        return null;
      }

      return {
        category: cat.id,
        name: cat.name,
        tamilName: cat.tamilName,
        icon: cat.icon,
        askingRate,
        isPrimarySkill: hasSkill,
      };
    })
    .filter((item): item is WorkRateInfo => item !== null);
}
