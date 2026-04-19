import type { ResolvedExperience, ResumeTheme, EliteCategory, Language } from '../../lib/types';
import { getSectionLabel, getCarLabel, getEliteLabel } from '../../lib/sectionLabels';

interface Props {
  data: ResolvedExperience[];
  theme: ResumeTheme;
  lang: Language;
}

const ELITE_COLORS: Record<EliteCategory, { bg: string; text: string }> = {
  experience: { bg: '#dbeafe', text: '#1d4ed8' },
  leadership: { bg: '#f3e8ff', text: '#7c3aed' },
  impact:     { bg: '#dcfce7', text: '#15803d' },
  transformation: { bg: '#ffedd5', text: '#c2410c' },
  excellence: { bg: '#fef9c3', text: '#a16207' },
};

export default function Experience({ data, theme, lang }: Props) {
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
        {getSectionLabel('experience', lang)}
      </h2>

      <div className="space-y-4">
        {data.map((exp) => (
          <div key={exp.id}>
            <div className="flex items-baseline justify-between">
              <div>
                <h3
                  className="font-semibold text-base"
                  style={{ color: theme.colors.heading, fontFamily: theme.fonts.heading }}
                >
                  {exp.role}
                </h3>
                <p className="text-sm" style={{ color: theme.colors.primary }}>
                  {[exp.company, exp.location].filter(Boolean).join(' — ')}
                </p>
              </div>
              <span className="text-sm shrink-0" style={{ color: theme.colors.secondary }}>
                {exp.period}
              </span>
            </div>

            {exp.description && (
              <p className="mt-1 text-sm" style={{ color: theme.colors.text, whiteSpace: 'pre-wrap' }}>
                {exp.description}
              </p>
            )}

            {exp.achievements.length > 0 && (
              <ul className="mt-2 space-y-2">
                {exp.achievements.filter(a => a.challenge || a.action || a.result).map((ach) => (
                  <li key={ach.id} className="text-sm" style={{ color: theme.colors.text }}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p style={{ whiteSpace: 'pre-wrap' }}>
                          <span className="font-medium" style={{ color: theme.colors.accent }}>
                            {getCarLabel('challenge', lang)}:{' '}
                          </span>
                          {ach.challenge}
                        </p>
                        <p style={{ whiteSpace: 'pre-wrap' }}>
                          <span className="font-medium" style={{ color: theme.colors.accent }}>
                            {getCarLabel('action', lang)}:{' '}
                          </span>
                          {ach.action}
                        </p>
                        <p style={{ whiteSpace: 'pre-wrap' }}>
                          <span className="font-medium" style={{ color: theme.colors.accent }}>
                            {getCarLabel('result', lang)}:{' '}
                          </span>
                          {ach.result}
                        </p>
                      </div>
                      {ach.eliteCategory && (
                        <span
                          className="shrink-0 inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold mt-0.5"
                          style={{
                            backgroundColor: ELITE_COLORS[ach.eliteCategory].bg,
                            color: ELITE_COLORS[ach.eliteCategory].text,
                          }}
                          title={getEliteLabel(ach.eliteCategory, lang)}
                        >
                          {getEliteLabel(ach.eliteCategory, lang)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
