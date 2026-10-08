import { MASTER_TASKS } from '../data/services';
import { Task } from '../types';

export interface ParsedNLResult {
  detectedTaskIds: string[];
  matchedTasks: Task[];
  suggestedDurationHours: number;
  explanation: string;
}

const TASK_KEYWORDS: Record<string, string[]> = {
  clean_sweep: ['sweep', 'broom', 'dusting floor', 'perukku', 'perukkal', 'clean floor', 'living room'],
  clean_mop: ['mop', 'mopping', 'thudaikkanum', 'thudaithal', 'floor wash'],
  clean_dust: ['dust', 'dusting', 'wipe table', 'shelves', 'fans'],
  clean_vessels: ['vessels', 'dishes', 'wash utensils', 'sink', 'pathiram', 'plates'],
  clean_kitchen: ['kitchen', 'counter', 'stove', 'gas stove', 'tiles', 'cooktop'],
  clean_bathroom: ['bathroom', 'toilet', 'washroom', 'restroom', 'scrub bathroom'],
  cook_veg_prep: ['cut vegetables', 'vegetable prep', 'veggies', 'chopping', 'cutting', 'onions', 'kaykari'],
  cook_breakfast: ['breakfast', 'idli', 'dosa', 'pongal', 'tiffin', 'kaalai unavu'],
  cook_lunch: ['lunch', 'meals', 'sambar', 'rasam', 'poriyal', 'curry', 'rice', 'madhiya unavu'],
  cook_dinner: ['dinner', 'chapatis', 'rotis', 'phulka', 'iravu unavu', 'evening meal'],
  cook_pure_veg: ['pure veg', 'satvik', 'no onion', 'no garlic', 'brahmin', 'vegetarian'],
  cook_non_veg: ['non veg', 'chicken', 'fish', 'mutton', 'egg curry'],
  laundry_fold: ['fold clothes', 'folding', 'laundry', 'thuni madi', 'dry clothes'],
  laundry_iron: ['iron', 'ironing', 'press clothes', 'isthiri', 'uniform'],
  laundry_organise: ['wardrobe clothes', 'cupboard arrange', 'hang clothes'],
  org_wardrobe: ['wardrobe', 'closet', 'cupboard', 'declutter', 'sort clothes'],
  org_packing: ['packing', 'pack luggage', 'travel pack', 'shifting'],
  org_unpacking: ['unpacking', 'unpack luggage', 'open cartons'],
  org_general: ['organise', 'organize', 'tidy', 'messy room', 'shoe rack', 'declutter living room'],
  fam_elder_comp: ['elder', 'grandparents', 'parents', 'senior', 'walk with grandma', 'companionship'],
  fam_elder_meals: ['elder meal', 'feed grandfather', 'water for elder', 'elder food'],
  fam_elder_home: ['elder help', 'assist father', 'home elder care'],
  kids_play: ['kids play', 'play supervision', 'entertain child', 'babysit', 'toddler play'],
  kids_homework: ['homework', 'studies', 'school work', 'homework supervision', 'tuition assistance'],
  kids_meal: ['feed child', 'kids food', 'feed baby', 'kids snack'],
  kids_short_care: ['childcare', 'look after kid', 'watch baby', 'child sitting'],
};

export function parseNaturalLanguagePrompt(text: string): ParsedNLResult {
  const normalized = text.toLowerCase();
  const matchedTaskIds = new Set<string>();

  for (const [taskId, keywords] of Object.entries(TASK_KEYWORDS)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        matchedTaskIds.add(taskId);
        break;
      }
    }
  }

  // Common phrase enhancements
  if (normalized.includes('guest') || normalized.includes('guests coming')) {
    matchedTaskIds.add('clean_sweep');
    matchedTaskIds.add('clean_mop');
    matchedTaskIds.add('clean_vessels');
  }

  if (normalized.includes('deep clean') || normalized.includes('house cleaned') || normalized.includes('clean the house')) {
    matchedTaskIds.add('clean_sweep');
    matchedTaskIds.add('clean_mop');
    matchedTaskIds.add('clean_dust');
  }

  const detectedTaskIds = Array.from(matchedTaskIds);
  const matchedTasks = MASTER_TASKS.filter((t) => detectedTaskIds.includes(t.id));
  const totalMinutes = matchedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  let suggestedDurationHours = 2;
  if (totalMinutes <= 60) suggestedDurationHours = 1;
  else if (totalMinutes <= 125) suggestedDurationHours = 2;
  else if (totalMinutes <= 195) suggestedDurationHours = 3;
  else suggestedDurationHours = 4;

  let explanation = '';
  if (detectedTaskIds.length === 0) {
    explanation = 'Could not detect specific tasks. Tap "Build My Visit" below to choose from the task list.';
  } else {
    explanation = `Identified ${detectedTaskIds.length} tasks across ${
      new Set(matchedTasks.map((t) => t.category)).size
    } categories (~${totalMinutes} mins workload). Recommended: ${suggestedDurationHours} hours visit.`;
  }

  return {
    detectedTaskIds,
    matchedTasks,
    suggestedDurationHours,
    explanation,
  };
}
