import type { ResumeTheme } from '../../lib/types';

interface Props {
  data: string;
  theme: ResumeTheme;
}

export default function Summary({ data, theme }: Props) {
  if (!data) return null;
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
        Professional Summary
      </h2>
      <p
        className="text-sm leading-relaxed"
        style={{ color: theme.colors.text, fontFamily: theme.fonts.body, whiteSpace: 'pre-wrap' }}
      >
        {data}
      </p>
    </section>
  );
}
