import type { ResolvedLanguageEntry, ResumeTheme, Language } from '../../lib/types';
import { getSectionLabel } from '../../lib/sectionLabels';

interface Props {
  data: ResolvedLanguageEntry[];
  theme: ResumeTheme;
  lang: Language;
}

export default function Languages({ data, theme, lang }: Props) {
  if (!data.length) return null;

  return (
    <section className="mb-4">
      <h2
        className="text-lg font-bold mb-2 pb-1 border-b"
        style={{
          color: theme.colors.heading,
          borderColor: theme.colors.primary,
          fontFamily: theme.fonts.heading,
        }}
      >
        {getSectionLabel('languages', lang)}
      </h2>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {data.map((lang) => (
          <div key={lang.id} className="text-sm">
            <span className="font-medium" style={{ color: theme.colors.heading }}>
              {lang.language}
            </span>
            <span style={{ color: theme.colors.secondary }}> — {lang.level}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
