import type { Language, EliteCategory } from './types';

const LABELS: Record<string, Record<Language, string>> = {
  summary:        { en: 'Professional Summary', de: 'Berufliches Profil' },
  experience:     { en: 'Work Experience',      de: 'Berufserfahrung' },
  education:      { en: 'Education',            de: 'Ausbildung' },
  skills:         { en: 'Skills',               de: 'Kenntnisse' },
  certifications: { en: 'Certifications',       de: 'Zertifizierungen' },
  languages:      { en: 'Languages',            de: 'Sprachen' },
  projects:       { en: 'Projects',             de: 'Projekte' },
  products:       { en: 'Products',             de: 'Produkte' },
  references:     { en: 'References',           de: 'Referenzen' },
};

export function getSectionLabel(section: string, lang: Language): string {
  return LABELS[section]?.[lang] ?? section;
}

const CAR_LABELS: Record<'challenge' | 'action' | 'result', Record<Language, string>> = {
  challenge: { en: 'Challenge', de: 'Herausforderung' },
  action:    { en: 'Action',    de: 'Maßnahme' },
  result:    { en: 'Result',    de: 'Ergebnis' },
};

export function getCarLabel(field: 'challenge' | 'action' | 'result', lang: Language): string {
  return CAR_LABELS[field][lang];
}

const ELITE_LABELS: Record<EliteCategory, Record<Language, string>> = {
  experience:     { en: 'Experience',     de: 'Erfahrung' },
  leadership:     { en: 'Leadership',     de: 'Führung' },
  impact:         { en: 'Impact',         de: 'Wirkung' },
  transformation: { en: 'Transformation', de: 'Transformation' },
  excellence:     { en: 'Excellence',     de: 'Exzellenz' },
};

export function getEliteLabel(category: EliteCategory, lang: Language): string {
  return ELITE_LABELS[category][lang];
}
