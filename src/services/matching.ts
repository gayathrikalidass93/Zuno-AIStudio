import { Helper, Customer, Task } from '../types';
import { MASTER_TASKS } from '../data/services';

export interface MatchFactor {
  label: string;
  matched: boolean;
  type: 'positive' | 'neutral' | 'negative' | 'critical';
}

export interface MatchResult {
  helper: Helper;
  score: number; // 0 - 100
  isEligible: boolean;
  ineligibilityReason?: string;
  distanceKm: number;
  factors: MatchFactor[];
  isFavourite: boolean;
  hasServedApartment: boolean;
  skillsCoveragePercent: number;
}

// Distance approximation between Chennai pilot localities (km)
const CHENNAI_DISTANCES: Record<string, Record<string, number>> = {
  Pallavaram: { Pallavaram: 1.2, Chromepet: 2.1, Pammal: 2.5, Keelkattalai: 3.4, Medavakkam: 6.2, Velachery: 7.5, Tambaram: 5.8, Perungalathur: 9.1 },
  Chromepet: { Pallavaram: 2.1, Chromepet: 1.0, Pammal: 3.2, Keelkattalai: 4.0, Medavakkam: 6.8, Velachery: 8.2, Tambaram: 3.9, Perungalathur: 7.2 },
  Pammal: { Pallavaram: 2.5, Chromepet: 3.2, Pammal: 1.1, Keelkattalai: 4.8, Medavakkam: 7.9, Velachery: 9.4, Tambaram: 6.5, Perungalathur: 9.8 },
  Keelkattalai: { Pallavaram: 3.4, Chromepet: 4.0, Pammal: 4.8, Keelkattalai: 1.0, Medavakkam: 3.6, Velachery: 5.2, Tambaram: 6.9, Perungalathur: 9.5 },
  Medavakkam: { Pallavaram: 6.2, Chromepet: 6.8, Pammal: 7.9, Keelkattalai: 3.6, Medavakkam: 1.3, Velachery: 5.8, Tambaram: 7.4, Perungalathur: 10.2 },
  Velachery: { Pallavaram: 7.5, Chromepet: 8.2, Pammal: 9.4, Keelkattalai: 5.2, Medavakkam: 5.8, Velachery: 1.2, Tambaram: 10.1, Perungalathur: 13.0 },
  Tambaram: { Pallavaram: 5.8, Chromepet: 3.9, Pammal: 6.5, Keelkattalai: 6.9, Medavakkam: 7.4, Velachery: 10.1, Tambaram: 1.1, Perungalathur: 3.8 },
  Perungalathur: { Pallavaram: 9.1, Chromepet: 7.2, Pammal: 9.8, Keelkattalai: 9.5, Medavakkam: 10.2, Velachery: 13.0, Tambaram: 3.8, Perungalathur: 1.3 },
};

export function getEstimatedDistance(loc1: string, loc2: string): number {
  if (CHENNAI_DISTANCES[loc1]?.[loc2] !== undefined) {
    return CHENNAI_DISTANCES[loc1][loc2];
  }
  if (CHENNAI_DISTANCES[loc2]?.[loc1] !== undefined) {
    return CHENNAI_DISTANCES[loc2][loc1];
  }
  return 5.0; // fallback standard
}

export function matchHelpers(
  helpers: Helper[],
  params: {
    selectedTaskIds: string[];
    locality: string;
    apartmentName: string;
    isUrgent: boolean;
    customer?: Customer;
  }
): MatchResult[] {
  const { selectedTaskIds, locality, apartmentName, isUrgent, customer } = params;

  const selectedTasks = MASTER_TASKS.filter((t) => selectedTaskIds.includes(t.id));
  const requiresChildcare = selectedTasks.some((t) => t.category === 'kids');
  const requiresElder = selectedTasks.some((t) => t.category === 'family');

  const results: MatchResult[] = helpers.map((helper) => {
    const factors: MatchFactor[] = [];
    let isEligible = true;
    let ineligibilityReason = '';

    // Check 1: Active & Verification status
    if (!helper.isActive || helper.verificationStatus !== 'verified') {
      return {
        helper,
        score: 0,
        isEligible: false,
        ineligibilityReason: 'Helper account verification in progress',
        distanceKm: 99,
        factors: [{ label: 'Verification Pending', matched: false, type: 'critical' }],
        isFavourite: false,
        hasServedApartment: false,
        skillsCoveragePercent: 0,
      };
    }

    // Check 2: SAFETY-FIRST CHILDCARE GATE
    if (requiresChildcare) {
      if (!helper.isChildcareVerified || !helper.verificationChecklist.childcareScreened) {
        return {
          helper,
          score: 0,
          isEligible: false,
          ineligibilityReason: 'Not certified for Childcare (requires Kids Care Verified screening)',
          distanceKm: 99,
          factors: [{ label: 'Kids Care screening required', matched: false, type: 'critical' }],
          isFavourite: false,
          hasServedApartment: false,
          skillsCoveragePercent: 0,
        };
      } else {
        factors.push({ label: 'Kids Care Verified', matched: true, type: 'positive' });
      }
    }

    // Check 3: Elder Care Gate
    if (requiresElder) {
      if (!helper.isElderAssistanceEligible) {
        return {
          helper,
          score: 0,
          isEligible: false,
          ineligibilityReason: 'Not registered for elder companion assistance',
          distanceKm: 99,
          factors: [{ label: 'Elder assistance clearance needed', matched: false, type: 'critical' }],
          isFavourite: false,
          hasServedApartment: false,
          skillsCoveragePercent: 0,
        };
      }
    }

    // Check 4: Distance & Service Radius
    const distanceKm = getEstimatedDistance(helper.locality, locality);
    if (distanceKm > helper.serviceRadiusKm + 2.0) {
      isEligible = false;
      ineligibilityReason = `Outside travel radius (${distanceKm} km away, max ${helper.serviceRadiusKm} km)`;
    }

    // Check 5: Urgency availability
    if (isUrgent) {
      if (helper.availabilityStatus !== 'available_now') {
        isEligible = false;
        ineligibilityReason = 'Currently not on Available Now status';
      } else {
        factors.push({ label: 'Available Now for immediate dispatch', matched: true, type: 'positive' });
      }
    }

    // Skills match calculation
    const matchedSkillsCount = selectedTaskIds.filter((id) => helper.skills.includes(id)).length;
    const skillsCoveragePercent =
      selectedTaskIds.length > 0
        ? Math.round((matchedSkillsCount / selectedTaskIds.length) * 100)
        : 100;

    if (skillsCoveragePercent < 60 && selectedTaskIds.length > 1) {
      isEligible = false;
      ineligibilityReason = `Covers only ${matchedSkillsCount}/${selectedTaskIds.length} requested tasks`;
    }

    // Community / Apartment familiarity
    const hasServedApartment = helper.apartmentsServed.some(
      (apt) => apt.toLowerCase().trim() === apartmentName.toLowerCase().trim()
    );
    if (hasServedApartment) {
      factors.push({
        label: `Previously served ${apartmentName}`,
        matched: true,
        type: 'positive',
      });
    }

    // Favourite helper boost
    const isFavourite = customer?.favouriteHelperIds?.includes(helper.id) || false;
    if (isFavourite) {
      factors.push({ label: 'Your saved Favourite helper', matched: true, type: 'positive' });
    }

    // Factors compilation
    factors.push({
      label: `${skillsCoveragePercent}% tasks matched (${matchedSkillsCount}/${selectedTaskIds.length})`,
      matched: skillsCoveragePercent >= 80,
      type: skillsCoveragePercent >= 80 ? 'positive' : 'neutral',
    });

    factors.push({
      label: `${distanceKm.toFixed(1)} km away in ${helper.locality}`,
      matched: distanceKm <= 3.5,
      type: distanceKm <= 3.5 ? 'positive' : 'neutral',
    });

    factors.push({
      label: `${helper.rating.toFixed(1)}★ rating (${helper.completedJobs} visits)`,
      matched: helper.rating >= 4.8,
      type: 'positive',
    });

    if (helper.onTimeRate >= 98) {
      factors.push({ label: `${helper.onTimeRate}% on-time arrival`, matched: true, type: 'positive' });
    }

    // COMPUTE WEIGHTED SCORE (0 - 100)
    let score = 0;
    if (isEligible) {
      // 1. Skill coverage (weight: 35)
      score += (skillsCoveragePercent / 100) * 35;

      // 2. Proximity (weight: 25)
      const proximityScore = Math.max(0, 1 - distanceKm / (helper.serviceRadiusKm + 1));
      score += proximityScore * 25;

      // 3. Rating & Quality (weight: 15)
      const ratingNormalized = Math.max(0, (helper.rating - 4.0) / 1.0); // 4.0 to 5.0
      score += ratingNormalized * 15;

      // 4. On-time & Low cancellation (weight: 10)
      const reliabilityScore = (helper.onTimeRate / 100) * (1 - helper.cancellationRate / 100);
      score += reliabilityScore * 10;

      // 5. Apartment Familiarity bonus (weight: 10)
      if (hasServedApartment) {
        score += 10;
      }

      // 6. Favourite bonus (weight: 5)
      if (isFavourite) {
        score += 5;
      }
    }

    const finalScore = Math.min(99, Math.round(score));

    return {
      helper,
      score: isEligible ? finalScore : 0,
      isEligible,
      ineligibilityReason,
      distanceKm,
      factors,
      isFavourite,
      hasServedApartment,
      skillsCoveragePercent,
    };
  });

  // Sort eligible helpers by match score descending, then rating
  return results.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.score - a.score || b.helper.rating - a.helper.rating;
  });
}
