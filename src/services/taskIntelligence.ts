import { MASTER_TASKS } from '../data/services';
import { Task } from '../types';

export interface WorkloadEstimate {
  selectedTasks: Task[];
  totalEstimatedMinutes: number;
  formattedDuration: string;
  recommendedHours: number;
  isOverloadedForSelectedHours: (hours: number) => boolean;
  feasibilityNotice: string;
  hasChildcareTasks: boolean;
  hasElderTasks: boolean;
}

export function calculateTaskIntelligence(
  selectedTaskIds: string[],
  chosenHours: number = 2
): WorkloadEstimate {
  const selectedTasks = MASTER_TASKS.filter((t) => selectedTaskIds.includes(t.id));
  const totalMinutes = selectedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  // Recommended hours based on realistic pace with buffer
  let recommendedHours = 1;
  if (totalMinutes <= 60) {
    recommendedHours = 1;
  } else if (totalMinutes <= 125) {
    recommendedHours = 2;
  } else if (totalMinutes <= 195) {
    recommendedHours = 3;
  } else {
    recommendedHours = 4;
  }

  const hoursFloat = (totalMinutes / 60).toFixed(1);
  const formattedDuration = `~${hoursFloat} hrs (${totalMinutes} mins)`;

  const hasChildcareTasks = selectedTasks.some((t) => t.category === 'kids');
  const hasElderTasks = selectedTasks.some((t) => t.category === 'family');

  const chosenMinutes = chosenHours * 60;
  const isOverloaded = totalMinutes > chosenMinutes + 15; // 15 mins buffer

  let feasibilityNotice = '';
  if (selectedTasks.length === 0) {
    feasibilityNotice = 'Select tasks above to estimate your visit duration.';
  } else if (isOverloaded) {
    feasibilityNotice = `⚠️ ${selectedTasks.length} tasks typically take ${formattedDuration}. In ${chosenHours} hour(s), helper will prioritize top tasks first. Consider booking ${recommendedHours} hours for complete coverage.`;
  } else if (chosenMinutes - totalMinutes >= 35) {
    feasibilityNotice = `✨ Relaxed pace! Helper has extra buffer time for thorough cleaning or ad-hoc assistance.`;
  } else {
    feasibilityNotice = `✓ Well-balanced workload for a ${chosenHours}-hour visit. Realistic coverage for one dedicated helper.`;
  }

  return {
    selectedTasks,
    totalEstimatedMinutes: totalMinutes,
    formattedDuration,
    recommendedHours,
    isOverloadedForSelectedHours: (h: number) => totalMinutes > h * 60 + 15,
    feasibilityNotice,
    hasChildcareTasks,
    hasElderTasks,
  };
}
