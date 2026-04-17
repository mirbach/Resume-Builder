import type { ResolvedResume, ResumeTheme, ResumeSection, Language } from '../../lib/types';
import PersonalHeader from './PersonalHeader';
import Summary from './Summary';
import Experience from './Experience';
import Education from './Education';
import Skills from './Skills';
import Certifications from './Certifications';
import Languages from './Languages';
import Projects from './Projects';
import Products from './Products';
import References from './References';

interface Props {
  resume: ResolvedResume;
  theme: ResumeTheme;
  lang: Language;
}

/** Map PDF font names to browser-safe CSS font-family strings. */
function cssFont(name: string): string {
  switch (name) {
    case 'Helvetica':   return 'Helvetica Neue, Arial, sans-serif';
    case 'Times-Roman': return 'Times New Roman, Times, serif';
    case 'Courier':     return 'Courier New, Courier, monospace';
    default:            return name; // Inter, custom, etc.
  }
}

/** Return a theme copy whose font names are CSS-safe for HTML rendering. */
function withCssFonts(theme: ResumeTheme): ResumeTheme {
  return {
    ...theme,
    fonts: {
      ...theme.fonts,
      heading: cssFont(theme.fonts.heading),
      body: cssFont(theme.fonts.body),
    },
  };
}

function renderSection(section: ResumeSection, resume: ResolvedResume, theme: ResumeTheme, lang: Language) {
  switch (section) {
    case 'personal':
      return <PersonalHeader key="personal" data={resume.personal} theme={theme} />;
    case 'summary':
      return <Summary key="summary" data={resume.summary} theme={theme} lang={lang} />;
    case 'experience':
      return <Experience key="experience" data={resume.experience} theme={theme} lang={lang} />;
    case 'education':
      return <Education key="education" data={resume.education} theme={theme} lang={lang} />;
    case 'skills':
      return <Skills key="skills" data={resume.skills} theme={theme} lang={lang} />;
    case 'certifications':
      return <Certifications key="certifications" data={resume.certifications} theme={theme} lang={lang} />;
    case 'languages':
      return <Languages key="languages" data={resume.languages} theme={theme} lang={lang} />;
    case 'projects':
      return <Projects key="projects" data={resume.projects} theme={theme} lang={lang} />;
    case 'products':
      return <Products key="products" data={resume.products} theme={theme} lang={lang} />;
    case 'references':
      return <References key="references" data={resume.references} theme={theme} lang={lang} />;
    default:
      return null;
  }
}

export default function ResumeLayout({ resume, theme, lang }: Props) {
  const cssTheme = withCssFonts(theme);
  const { sectionOrder, pageMargins } = cssTheme.layout;

  return (
    <div
      className="mx-auto bg-white shadow-lg min-h-[297mm]"
      style={{
        maxWidth: '210mm',
        padding: `${pageMargins.top}px ${pageMargins.right}px ${pageMargins.bottom}px ${pageMargins.left}px`,
        fontFamily: cssTheme.fonts.body,
        color: cssTheme.colors.text,
        backgroundColor: cssTheme.colors.background,
      }}
    >
      {sectionOrder.map((section) => renderSection(section, resume, cssTheme, lang))}
    </div>
  );
}
