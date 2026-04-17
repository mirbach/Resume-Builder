// ============================================
// Resume Data Types (CAR + ELITE frameworks)
// ============================================

export type EliteCategory = 'experience' | 'leadership' | 'impact' | 'transformation' | 'excellence';

export interface Achievement {
  id: string;
  challenge: BilingualText;
  action: BilingualText;
  result: BilingualText;
  eliteCategory?: EliteCategory;
}

export interface BilingualText {
  en: string;
  de: string;
}

export interface PersonalInfo {
  name: string;
  title: BilingualText;
  email?: string;
  phone: string;
  location: BilingualText;
  linkedin?: string;
  github?: string;
  website?: string;
  photo?: string; // file path from uploads
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: BilingualText;
  period: BilingualText;
  location: BilingualText;
  achievements: Achievement[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: BilingualText;
  period: BilingualText;
  details?: BilingualText;
}

export interface SkillCategory {
  id: string;
  category: BilingualText;
  items: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: BilingualText;
  url?: string;
}

export interface LanguageEntry {
  id: string;
  language: BilingualText;
  level: BilingualText;
}

export interface ProjectEntry {
  id: string;
  name: BilingualText;
  company?: string;
  description: BilingualText;
  technologies: string[];
  link?: string;
  period?: BilingualText;
  achievements: Achievement[];
}

export interface ProductEntry {
  id: string;
  name: string;
  description: BilingualText;
  role: BilingualText;
  highlights: BilingualText[];
  link?: string;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  title: BilingualText;
  company: string;
  contact?: string;
}

export interface ResumeData {
  personal: PersonalInfo;
  summary: BilingualText;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
  products: ProductEntry[];
  references: ReferenceEntry[];
}

// ============================================
// Theme Types
// ============================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
  heading: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  size: 'small' | 'medium' | 'large';
}

export type LayoutStyle = 'single-column' | 'two-column' | 'sidebar';
export type HeaderStyle = 'full-width' | 'compact' | 'centered';

export type ResumeSection =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'languages'
  | 'projects'
  | 'products'
  | 'references';

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ThemeLayout {
  style: LayoutStyle;
  headerStyle: HeaderStyle;
  sectionOrder: ResumeSection[];
  showPhoto: boolean;
  pageMargins: PageMargins;
}

export interface ResumeTheme {
  name: string;
  companyName?: string;
  companyEmail?: string;
  companyWebsite?: string;
  logo?: string; // file path from uploads
  colors: ThemeColors;
  fonts: ThemeFonts;
  layout: ThemeLayout;
}

// ============================================
// Settings Types
// ============================================

export type AuthProvider = 'entra-id' | 'zitadel' | 'authentik' | 'generic-oidc';

export interface AuthSettings {
  enabled: boolean;
  provider: AuthProvider;
  clientId: string;
  authority: string;
  redirectUri: string;
  scopes: string[];
}

export interface AppSettings {
  auth: AuthSettings;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ThemeListItem {
  name: string;
  filename: string;
}

// ============================================
// Resolved (single-language) types for display
// ============================================

export type Language = 'en' | 'de';

export interface ResolvedPersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photo?: string;
}

export interface ResolvedAchievement {
  id: string;
  challenge: string;
  action: string;
  result: string;
  eliteCategory?: EliteCategory;
}

export interface ResolvedExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  achievements: ResolvedAchievement[];
}

export interface ResolvedEducation {
  id: string;
  institution: string;
  degree: string;
  period: string;
  details?: string;
}

export interface ResolvedSkillCategory {
  id: string;
  category: string;
  items: string[];
}

export interface ResolvedLanguageEntry {
  id: string;
  language: string;
  level: string;
}

export interface ResolvedProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface ResolvedProduct {
  id: string;
  name: string;
  description: string;
  role: string;
  highlights: string[];
}

export interface ResolvedReference {
  id: string;
  name: string;
  title: string;
  company: string;
  contact?: string;
}

export interface ResolvedResume {
  personal: ResolvedPersonalInfo;
  summary: string;
  experience: ResolvedExperience[];
  education: ResolvedEducation[];
  skills: ResolvedSkillCategory[];
  certifications: CertificationEntry[];
  languages: ResolvedLanguageEntry[];
  projects: ResolvedProject[];
  products: ResolvedProduct[];
  references: ResolvedReference[];
}
