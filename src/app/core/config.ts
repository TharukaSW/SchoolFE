// Base URL of the backend API. Change here if the API runs elsewhere.
export const API_BASE = 'http://localhost:5000/api';

export const CATEGORIES = [
  'Low vision',
  'Total blind',
  'Deaf',
  'Total deaf',
  'Autism',
  'Down syndrome',
  'Mental retardation',
  'Physical handicap',
] as const;
export const SPECIALIZATIONS = [
  'Brail',
  'Sign language',
] as const;
export const GRADES = [
  '1-A', '1-B', '1-C',
  '2-A', '2-B', '2-C',
  '3-A', '3-B', '3-C',
  '4-A', '4-B', '4-C',
  '5-A', '5-B', '5-C',
  '6-A', '6-B', '6-C',
  '7-A', '7-B', '7-C',
  '8-A', '8-B', '8-C',
  '9-A', '9-B', '9-C',
  '10-A', '10-B', '10-C',
  '11-A', '11-B', '11-C',
] as const;
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
export const EVENT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const BEHAVIOR_COLORS = ['Green', 'Yellow', 'Red'] as const;
export const TERMS = ['Term 1', 'Term 2', 'Term 3'] as const;
export const LEVELS = ['Primary', 'Secondary'] as const;

// Short CSS-friendly key for a category (used for badge classes).
export function catKey(category: string): string {
  if (!category) return 'default';
  const c = category.toLowerCase();
  if (c.includes('low vision')) return 'low-vision';
  if (c.includes('total blind') || c.includes('blind')) return 'total-blind';
  if (c.includes('total deaf')) return 'total-deaf';
  if (c.includes('deaf')) return 'deaf';
  if (c.includes('autism')) return 'autism';
  if (c.includes('down syndrome')) return 'down-syndrome';
  if (c.includes('menta') || c.includes('retard')) return 'mental-retardation';
  if (c.includes('physical') || c.includes('handicap')) return 'physical-handicap';
  if (c.includes('brail') || c.includes('braille')) return 'brail';
  if (c.includes('sign')) return 'sign-language';
  return 'default';
}
