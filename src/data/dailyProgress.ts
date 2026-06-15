export type DailyLog = {
  date: string; // ISO date
  activitiesDone: number;
  activitiesTotal: number;
  spentToday: number;
  budgetToday: number;
  steps: number;
  notes: string;
  moodCheck: "great" | "good" | "tired" | "rough";
};

export const DAILY_PROGRESS: Record<string, DailyLog> = {
  // Users fill this in during the trip via local storage
};

export type CrewMember = {
  name: string;
  role: string; // "Navigator", "CFO", "Food Scout", etc.
  status: "ready" | "tired" | "hungry" | "lost";
};

export const CREW: CrewMember[] = [
  { name: "You", role: "Navigator", status: "ready" },
  { name: "Person 2", role: "CFO", status: "ready" },
  { name: "Person 3", role: "Food Scout", status: "ready" },
  { name: "Person 4", role: "Photo Lead", status: "ready" },
  { name: "Person 5", role: "Logistics", status: "ready" },
  { name: "Person 6", role: "Translator", status: "ready" },
  { name: "Person 7", role: "Timekeeper", status: "ready" },
  { name: "Person 8", role: "Morale", status: "ready" },
];
