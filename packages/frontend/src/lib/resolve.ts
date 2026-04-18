import type {
  ResumeData,
  ResolvedResume,
  Language,
  BilingualText,
} from './types';

function resolve(text: BilingualText, lang: Language): string {
  return text[lang] || text.en || '';
}

export function resolveResume(data: ResumeData, lang: Language): ResolvedResume {
  return {
    personal: {
      name: data.personal.name,
      title: resolve(data.personal.title, lang),
      email: data.personal.email,
      phone: data.personal.phone,
      location: resolve(data.personal.location, lang),
      linkedin: data.personal.linkedin,
      github: data.personal.github,
      website: data.personal.website,
      photo: data.personal.photo,
    },
    summary: resolve(data.summary, lang),
    experience: data.experience.map((exp) => ({
      id: exp.id,
      company: exp.company,
      role: resolve(exp.role, lang),
      period: resolve(exp.period, lang),
      location: resolve(exp.location, lang),
      achievements: exp.achievements.map((ach) => ({
        id: ach.id,
        challenge: resolve(ach.challenge, lang),
        action: resolve(ach.action, lang),
        result: resolve(ach.result, lang),
        eliteCategory: ach.eliteCategory,
      })),
    })),
    education: data.education.map((edu) => ({
      id: edu.id,
      institution: edu.institution,
      degree: resolve(edu.degree, lang),
      period: resolve(edu.period, lang),
      details: edu.details ? resolve(edu.details, lang) : undefined,
    })),
    skills: data.skills.map((s) => ({
      id: s.id,
      category: resolve(s.category, lang),
      items: s.items
        .map((item) => (typeof item === 'string' ? (item as string) : item[lang] ?? ''))
        .filter(Boolean),
    })),
    certifications: data.certifications.map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      date: resolve(c.date, lang),
      url: c.url,
    })),
    languages: data.languages.map((l) => ({
      id: l.id,
      language: resolve(l.language, lang),
      level: resolve(l.level, lang),
    })),
    projects: data.projects.map((p) => ({
      id: p.id,
      name: resolve(p.name, lang),
      company: p.company,
      description: resolve(p.description, lang),
      technologies: p.technologies,
      link: p.link,
      period: p.period ? resolve(p.period, lang) : undefined,
      achievements: (p.achievements ?? []).map((ach) => ({
        id: ach.id,
        challenge: resolve(ach.challenge, lang),
        action: resolve(ach.action, lang),
        result: resolve(ach.result, lang),
        eliteCategory: ach.eliteCategory,
      })),
    })),
    products: data.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: resolve(p.description, lang),
      role: resolve(p.role, lang),
      highlights: p.highlights.map((h) => resolve(h, lang)),
      link: p.link,
    })),
    references: data.references.map((r) => ({
      id: r.id,
      name: r.name,
      title: resolve(r.title, lang),
      company: r.company,
      contact: r.contact,
    })),
  };
}
