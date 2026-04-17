import type { ResolvedReference, ResumeTheme, Language } from '../../lib/types';
import { getSectionLabel } from '../../lib/sectionLabels';

interface Props {
  data: ResolvedReference[];
  theme: ResumeTheme;
  lang: Language;
}

export default function References({ data, theme, lang }: Props) {
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
        {getSectionLabel('references', lang)}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {data.map((ref) => (
          <div key={ref.id}>
            <p className="text-sm font-medium" style={{ color: theme.colors.heading }}>
              {ref.name}
            </p>
            <p className="text-xs" style={{ color: theme.colors.secondary }}>
              {ref.title}
            </p>
            <p className="text-xs" style={{ color: theme.colors.secondary }}>
              {ref.company}
            </p>
            {ref.contact && (
              <p className="text-xs mt-0.5" style={{ color: theme.colors.accent }}>
                {ref.contact}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
