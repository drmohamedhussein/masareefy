import type { ExpenseRepository } from "@/core/repository";
import { createLocalRepository } from "@/lib/storage/local-repository";

/**
 * Storage factory.
 * - Now: localStorage only (works offline, no setup for the user)
 * - Later: Supabase adapter when Auth ships
 * - WordPress plugin: PHP class implementing the same ExpenseRepository contract
 */
export function getExpenseRepository(): ExpenseRepository {
  return createLocalRepository();
}

export function getStorageModeLabel(): string {
  return "محلي على هذا الجهاز";
}
