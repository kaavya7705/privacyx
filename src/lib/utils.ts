import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

export function getRiskColor(score: number): string {
  const level = getRiskLevel(score);
  const colors = {
    low: "#00ff88",
    medium: "#ffb800",
    high: "#ff6b35",
    critical: "#ff006e",
  };
  return colors[level];
}

export function getRiskLabel(score: number): string {
  const level = getRiskLevel(score);
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatTimeBucket(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  const minutesStr = minutes.toString().padStart(2, "0");
  const endMinutes = (minutes + 15) % 60;
  const endHours = endMinutes === 0 ? (date.getHours() + 1) % 24 : date.getHours();
  return `${hours}:${minutesStr}-${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

export function formatDurationBucket(seconds: number): string {
  if (seconds < 60) return "<1m";
  if (seconds < 300) return "1-5m";
  if (seconds < 600) return "5-10m";
  if (seconds < 1800) return "10-30m";
  if (seconds < 3600) return "30-60m";
  return ">60m";
}
