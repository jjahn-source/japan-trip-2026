export type DayRecap = {
  date: string; // ISO date
  highlight: string; // Best moment of the day
  best_meal: string; // Most memorable meal
  crew_mood: "energized" | "tired" | "mixed";
  mood_notes?: string;
  photo_moment?: string; // The best photo we took
  something_unexpected?: string; // Thing that surprised us
  notes?: string; // Free-form recap
  rating: number; // 1-5 stars for the day
};

// Users will add to this via the DayRecap component
export const DAY_RECAPS: DayRecap[] = [];
