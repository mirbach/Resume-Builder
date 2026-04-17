import type { ResolvedExperience, ResumeTheme, EliteCategory } from '../../lib/types';

interface Props {
  data: ResolvedExperience[];
  theme: ResumeTheme;
}

const ELITE_COLORS: Record<EliteCategory, { bg: string; text: string; label: string }> = {
  experience: { bg: '#dbeafe', text: '#1d4ed8', label: 'E' },
  leadership: { bg: '#f3e8ff', text: '#7c3aed', label: 'L' },
  impact: { bg: '#dcfce7', text: '#15803d', label: 'I' },
  transformation: { bg: '#ffedd5', text: '#c2410c', label: 'T' },
  excellence: { bg: '#fef9c3', text: '#a16207', label: 'E' },
};

const ELITE_LABELS: Record<EliteCategory, string> = {
  experience: 'Experience',
  leadership: 'Leadership',
  impact: 'Impact',
  transformation: 'Transformation',
  excellence: 'Excellence',
};

export default function Experience({ data, theme }: Props) {
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
        Work Experience
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
                  {exp.company} — {exp.location}
                </p>
              </div>
              <span className="text-sm shrink-0" style={{ color: theme.colors.secondary }}>
                {exp.period}
              </span>
            </div>

            {exp.achievements.length > 0 && (
              <ul className="mt-2 space-y-2">
                {exp.achievements.map((ach) => (
                  <li key={ach.id} className="text-sm" style={{ color: theme.colors.text }}>
                    <div className="flex items-start gap-2">
                      {ach.eliteCategory && (
                        <span
                          className="shrink-0 inline-flex items-center justify-center rounded-full w-5 h-5 text-[10px] font-bold mt-0.5"
                          style={{
                            backgroundColor: ELITE_COLORS[ach.eliteCategory].bg,
                            color: ELITE_COLORS[ach.eliteCategory].text,
                          }}
                          title={ELITE_LABELS[ach.eliteCategory]}
                        >
                          {ELITE_COLORS[ach.eliteCategory].label}
                        </span>
                      )}
                      <div className="flex-1">
                        <p style={{ whiteSpace: 'pre-wrap' }}>
                          <span className="font-medium" style={{ color: theme.colors.accent }}>
                            Challenge:{' '}
                          </span>
                          {ach.challenge}
                        </p>
                        <p style={{ whiteSpace: 'pre-wrap' }}>
                          <span className="font-medium" style={{ color: theme.colors.accent }}>
                            Action:{' '}
                          </span>
                          {ach.action}
                        </p>
                        <p style={{ whiteSpace: 'pre-wrap' }}>
                          <span className="font-medium" style={{ color: theme.colors.accent }}>
                            Result:{' '}
                          </span>
                          {ach.result}
                        </p>
                      </div>
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
