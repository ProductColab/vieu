import type { ConditionalDisplay } from "./conditional.types";

/**
 * Evaluates whether a field should be shown based on conditional logic
 */
export function shouldShowField(
  condition: ConditionalDisplay,
  watchedValue: any,
  allValues: Record<string, any>
): boolean {
  if (condition.condition === "custom") {
    return condition.predicate(watchedValue, allValues);
  }

  switch (condition.condition) {
    case "equals":
      return watchedValue === condition.value;
    case "not_equals":
      return watchedValue !== condition.value;
    case "contains":
      return String(watchedValue || "").includes(String(condition.value));
    case "greater_than":
      return Number(watchedValue) > Number(condition.value);
    case "less_than":
      return Number(watchedValue) < Number(condition.value);
    default:
      return true;
  }
}

/**
 * Evaluates conditional display for static data (tables/cards)
 * This is simpler than the form version since there's no reactive state
 */
export function shouldShowFieldInView(
  condition: ConditionalDisplay,
  itemData: Record<string, any>
): boolean {
  const watchedValue = itemData[condition.field];
  return shouldShowField(condition, watchedValue, itemData);
}
