import type { ResolvedProject, ResumeTheme } from '../../lib/types';

interface Props {
  data: ResolvedProject[];
  theme: ResumeTheme;
}

export default function Projects({ data, theme }: Props) {
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
        Projects
      </h2>
      <div className="space-y-3">
        {data.map((proj) => (
          <div key={proj.id}>
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-sm" style={{ color: theme.colors.heading }}>
                {proj.name}
              </h3>
              {proj.link && (
                <span className="text-xs" style={{ color: theme.colors.accent }}>
                  {proj.link}
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: theme.colors.text, whiteSpace: 'pre-wrap' }}>
              {proj.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {proj.technologies.map((tech, i) => (
                <span
                  key={i}
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: theme.colors.accent + '15',
                    color: theme.colors.accent,
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
