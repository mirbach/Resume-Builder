import type { ResolvedProduct, ResumeTheme } from '../../lib/types';

interface Props {
  data: ResolvedProduct[];
  theme: ResumeTheme;
}

export default function Products({ data, theme }: Props) {
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
        Products
      </h2>
      <div className="space-y-3">
        {data.map((prod) => (
          <div key={prod.id}>
            <h3 className="font-semibold text-sm" style={{ color: theme.colors.heading }}>
              {prod.name}
            </h3>
            <p className="text-sm mt-0.5" style={{ color: theme.colors.text, whiteSpace: 'pre-wrap' }}>
              {prod.description}
            </p>
            <p className="text-xs mt-0.5" style={{ color: theme.colors.secondary }}>
              Role: {prod.role}
            </p>
            {prod.highlights.length > 0 && (
              <ul className="mt-1 list-disc list-inside text-sm" style={{ color: theme.colors.text }}>
                {prod.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
