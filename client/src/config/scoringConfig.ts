// ============================================
// Configurable Scoring Weights for Story Reading
// ============================================

export interface ScoringWeights {
  pronunciation: number;
  fluency: number;
  accuracy: number;
  completeness: number;
}

export const STORY_SCORING_WEIGHTS: ScoringWeights = {
  pronunciation: 0.35,
  fluency: 0.25,
  accuracy: 0.25,
  completeness: 0.15,
};

export const IDEAL_WPM_RANGE = {
  min: 110,
  max: 150,
};
