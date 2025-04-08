// src/types.ts
export interface Task {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  focusedMinutes: number; // Add this
  notes?: string;
  priority: "low" | "medium" | "high";
}

export type TimerStatus = "idle" | "running" | "paused";
export type TimerType = "work" | "break";

export interface Stats {
  dailyPomodoros: number;
  weeklyPomodoros: number;
  dailyFocusTime: number;
  weeklyFocusTime: number;
  lastResetDate: string;
}
