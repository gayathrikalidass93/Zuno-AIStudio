import { Task, ServiceCategory } from '../types';

export interface CategoryInfo {
  id: ServiceCategory;
  name: string;
  tamilName: string;
  iconName: string;
  description: string;
  color: string;
}

export const SERVICE_CATEGORIES: CategoryInfo[] = [
  { id: 'cleaning', name: 'Brooming / Mopping', tamilName: '', iconName: 'Broom', description: 'Brooming and mopping bedrooms, halls and kitchen.', color: '' },
  { id: 'bathroom_cleaning', name: 'Bathroom Cleaning', tamilName: '', iconName: 'Bath', description: 'Clean toilets, sinks, floors, shower areas, tiles and mirrors as applicable.', color: '' },
  { id: 'cooking', name: 'Cooking', tamilName: '', iconName: 'ChefHat', description: 'Home cooking and meal preparation.', color: '' },
  { id: 'laundry', name: 'Laundry', tamilName: '', iconName: 'Shirt', description: 'Laundry, folding and ironing.', color: '' },
  { id: 'organisation', name: 'Home Organisation', tamilName: '', iconName: 'House', description: 'Organise rooms, cupboards and household items.', color: '' },
  { id: 'family', name: 'Family Assistance', tamilName: '', iconName: 'Users', description: 'Non-medical family and elder assistance.', color: '' },
];

export const MASTER_TASKS: Task[] = [
  { id: 'clean_sweep', category: 'cleaning', name: 'Brooming / Mopping', tamilName: '', estimatedMinutes: 0, estimatedRateApprox: 0, description: 'Work scope is based on bedrooms, halls and kitchens.' },
  { id: 'bath_clean', category: 'bathroom_cleaning', name: 'Bathroom Cleaning', tamilName: '', estimatedMinutes: 0, estimatedRateApprox: 0, description: 'Toilet, sink, floor, shower area, tiles and mirror as applicable.' },
  { id: 'cook_home', category: 'cooking', name: 'Cooking', tamilName: '', estimatedMinutes: 0, estimatedRateApprox: 0, description: 'Home cooking.' },
  { id: 'laundry_home', category: 'laundry', name: 'Laundry', tamilName: '', estimatedMinutes: 0, estimatedRateApprox: 0, description: 'Laundry and clothing care.' },
  { id: 'organise_home', category: 'organisation', name: 'Home Organisation', tamilName: '', estimatedMinutes: 0, estimatedRateApprox: 0, description: 'Home organisation.' },
  { id: 'family_help', category: 'family', name: 'Family Assistance', tamilName: '', estimatedMinutes: 0, estimatedRateApprox: 0, description: 'Non-medical family assistance.' },
];

export const CHENNAI_LOCALITIES = ['Pallavaram','Chromepet','Pammal','Keelkattalai','Medavakkam','Velachery','Tambaram','Perungalathur'] as const;
export type ChennaiLocality = (typeof CHENNAI_LOCALITIES)[number];