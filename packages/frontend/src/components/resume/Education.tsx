import type { ResolvedEducation, ResumeTheme, Language } from '../../lib/types';
import { getSectionLabel } from '../../lib/sectionLabels';

interface Props {
  data: ResolvedEducation[];
  theme: ResumeTheme;
  lang: Language;
}

export default function Education({ data, theme, lang }: Props) {
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
        {getSectionLabel('education', lang)}
      </h2>
      <div className="space-y-3">
        {data.map((edu) => (
          <div key={edu.id}>
            <div className="flex items-baseline justify-between">
              <div>
                <h3
                  className="font-semibold text-sm"
                  style={{ color: theme.colors.heading }}
                >
                  {edu.degree}
                </h3>
                <p className="text-sm" style={{ color: theme.colors.primary }}>
                  {edu.institution}
                </p>
              </div>
              <span className="text-sm shrink-0" style={{ color: theme.colors.secondary }}>
                {edu.period}
              </span>
            </div>
            {edu.details && (
              <p className="text-xs mt-1" style={{ color: theme.colors.secondary, whiteSpace: 'pre-wrap' }}>
                {edu.details}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
