import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { ResolvedResume, ResumeTheme, ResumeSection, EliteCategory } from '../../lib/types';

// pdfkit only supports TTF/OTF — woff/woff2 cause DataView errors.
// Map any font name to the nearest built-in PDF font so export always works.
Font.registerHyphenationCallback((word) => [word]);

function pdfFont(name: string): string {
  switch (name) {
    case 'Times-Roman': return 'Times-Roman';
    case 'Courier':     return 'Courier';
    case 'Helvetica':   return 'Helvetica';
    default:            return 'Helvetica'; // Inter and anything else → Helvetica
  }
}

function pdfFontBold(name: string): string {
  switch (name) {
    case 'Times-Roman': return 'Times-Bold';
    case 'Courier':     return 'Courier-Bold';
    default:            return 'Helvetica-Bold';
  }
}

const ELITE_LABELS: Record<EliteCategory, string> = {
  experience: 'E',
  leadership: 'L',
  impact: 'I',
  transformation: 'T',
  excellence: 'E',
};

const ELITE_BG: Record<EliteCategory, string> = {
  experience: '#dbeafe',
  leadership: '#f3e8ff',
  impact: '#dcfce7',
  transformation: '#ffedd5',
  excellence: '#fef9c3',
};

const ELITE_COLOR: Record<EliteCategory, string> = {
  experience: '#1d4ed8',
  leadership: '#7c3aed',
  impact: '#15803d',
  transformation: '#c2410c',
  excellence: '#a16207',
};

function createStyles(theme: ResumeTheme) {
  const m = theme.layout.pageMargins;
  const bodyFont = pdfFont(theme.fonts.body);
  const headingFont = pdfFont(theme.fonts.heading);
  const headingFontBold = pdfFontBold(theme.fonts.heading);
  return StyleSheet.create({
    page: {
      paddingTop: m.top,
      paddingRight: m.right,
      paddingBottom: m.bottom,
      paddingLeft: m.left,
      fontFamily: bodyFont,
      fontSize: theme.fonts.size === 'small' ? 9 : theme.fonts.size === 'large' ? 11 : 10,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    header: { marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
    headerInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerLeft: { flex: 1 },
    headerRight: { alignItems: 'flex-end', marginLeft: 16, maxWidth: 120 },
    companyLogo: { width: 'auto', height: 36, objectFit: 'contain', marginBottom: 3 },
    companyName: { fontSize: 8, fontFamily: headingFontBold, color: theme.colors.secondary, textAlign: 'right' },
    photo: { width: 64, height: 64, borderRadius: 32, objectFit: 'cover', marginRight: 14, borderWidth: 2, borderColor: theme.colors.primary },
    name: { fontSize: 22, fontFamily: headingFontBold, color: theme.colors.heading },
    title: { fontSize: 14, marginTop: 2, color: theme.colors.primary },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 10 },
    contactItem: { fontSize: 8, color: theme.colors.secondary },
    sectionTitle: {
      fontSize: 12,
      fontFamily: headingFontBold,
      color: theme.colors.heading,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.primary,
      paddingBottom: 2,
      marginBottom: 6,
      marginTop: 8,
    },
    entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    entryTitle: { fontSize: 10, fontFamily: headingFontBold, color: theme.colors.heading },
    entrySubtitle: { fontSize: 9, color: theme.colors.primary },
    entryPeriod: { fontSize: 9, color: theme.colors.secondary },
    entryDetails: { fontSize: 8, color: theme.colors.secondary, marginTop: 1 },
    bodyText: { fontSize: 9, lineHeight: 1.5 },
    achievement: { marginBottom: 4 },
    achLabel: { fontSize: 8, fontFamily: headingFontBold, color: theme.colors.accent },
    achText: { fontSize: 9 },
    eliteBadge: {
      width: 12, height: 12, borderRadius: 6,
      fontSize: 7, textAlign: 'center',
      marginRight: 4, marginTop: 1,
    },
    skillCategory: { marginBottom: 4 },
    skillCatName: { fontSize: 9, fontFamily: headingFontBold, color: theme.colors.heading, marginBottom: 2 },
    skillTag: {
      fontSize: 8, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8,
      backgroundColor: theme.colors.primary + '20', color: theme.colors.primary, marginRight: 4, marginBottom: 2,
    },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
    certRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    certName: { fontSize: 9, fontFamily: headingFontBold, color: theme.colors.heading },
    certIssuer: { fontSize: 9, color: theme.colors.secondary },
    certDate: { fontSize: 8, color: theme.colors.secondary },
    langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    langItem: { fontSize: 9 },
    langName: { fontFamily: headingFontBold, color: theme.colors.heading },
    langLevel: { color: theme.colors.secondary },
    projName: { fontSize: 10, fontFamily: headingFontBold, color: theme.colors.heading },
    projLink: { fontSize: 8, color: theme.colors.accent },
    projDesc: { fontSize: 9, marginTop: 1 },
    techTag: {
      fontSize: 7, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3,
      backgroundColor: theme.colors.accent + '15', color: theme.colors.accent,
      marginRight: 3, marginBottom: 2,
    },
    prodName: { fontSize: 10, fontFamily: headingFontBold, color: theme.colors.heading },
    prodDesc: { fontSize: 9, marginTop: 1 },
    prodRole: { fontSize: 8, color: theme.colors.secondary, marginTop: 1 },
    highlight: { fontSize: 9, marginLeft: 8 },
    refGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    refItem: { width: '45%' },
    refName: { fontSize: 9, fontFamily: headingFontBold, color: theme.colors.heading },
    refTitle: { fontSize: 8, color: theme.colors.secondary },
    refContact: { fontSize: 8, color: theme.colors.accent, marginTop: 1 },
  });
}

interface Props {
  resume: ResolvedResume;
  theme: ResumeTheme;
}

function SectionPersonal({ resume, styles, theme }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; theme: ResumeTheme }) {
  // react-pdf Image requires an absolute URL; relative paths won't resolve inside the renderer
  const toAbsolute = (path: string) =>
    path.startsWith('http') || path.startsWith('data:') ? path : `${window.location.origin}${path}`;

  const logoSrc = theme.logo ? toAbsolute(theme.logo) : undefined;
  const photoSrc = theme.layout.showPhoto && resume.personal.photo
    ? toAbsolute(resume.personal.photo)
    : undefined;

  return (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        {photoSrc && <Image src={photoSrc} style={styles.photo} />}
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{resume.personal.name}</Text>
          <Text style={styles.title}>{resume.personal.title}</Text>
          {theme.companyName && (
            <Text style={[styles.companyName, { textAlign: 'left', marginTop: 2 }]}>{theme.companyName}</Text>
          )}
          <View style={styles.contactRow}>
            {theme.companyEmail && <Text style={styles.contactItem}>{theme.companyEmail}</Text>}
            {resume.personal.phone && <Text style={styles.contactItem}>{resume.personal.phone}</Text>}
            {resume.personal.location && <Text style={styles.contactItem}>{resume.personal.location}</Text>}
            {resume.personal.linkedin && <Text style={styles.contactItem}>{resume.personal.linkedin}</Text>}
            {resume.personal.github && <Text style={styles.contactItem}>{resume.personal.github}</Text>}
            {resume.personal.website && <Text style={styles.contactItem}>{resume.personal.website}</Text>}
            {theme.companyWebsite && <Text style={styles.contactItem}>{theme.companyWebsite}</Text>}
          </View>
        </View>
        {logoSrc && (
          <View style={styles.headerRight}>
            <Image src={logoSrc} style={styles.companyLogo} />
          </View>
        )}
      </View>
    </View>
  );
}

function SectionSummary({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.summary) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Professional Summary</Text>
      <Text style={styles.bodyText}>{resume.summary}</Text>
    </View>
  );
}

function SectionExperience({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.experience.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Work Experience</Text>
      {resume.experience.map((exp) => (
        <View key={exp.id} style={{ marginBottom: 8 }}>
          <View style={styles.entryHeader}>
            <View>
              <Text style={styles.entryTitle}>{exp.role}</Text>
              <Text style={styles.entrySubtitle}>{exp.company} — {exp.location}</Text>
            </View>
            <Text style={styles.entryPeriod}>{exp.period}</Text>
          </View>
          {exp.achievements.map((ach) => (
            <View key={ach.id} style={[styles.achievement, { flexDirection: 'row' }]}>
              {ach.eliteCategory && (
                <View style={[styles.eliteBadge, { backgroundColor: ELITE_BG[ach.eliteCategory], color: ELITE_COLOR[ach.eliteCategory] }]}>
                  <Text style={{ fontSize: 7, fontWeight: 700, textAlign: 'center', color: ELITE_COLOR[ach.eliteCategory!] }}>
                    {ELITE_LABELS[ach.eliteCategory]}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>Challenge: </Text>{ach.challenge}
                </Text>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>Action: </Text>{ach.action}
                </Text>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>Result: </Text>{ach.result}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SectionEducation({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.education.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Education</Text>
      {resume.education.map((edu) => (
        <View key={edu.id} style={{ marginBottom: 4 }}>
          <View style={styles.entryHeader}>
            <View>
              <Text style={styles.entryTitle}>{edu.degree}</Text>
              <Text style={styles.entrySubtitle}>{edu.institution}</Text>
            </View>
            <Text style={styles.entryPeriod}>{edu.period}</Text>
          </View>
          {edu.details && <Text style={styles.entryDetails}>{edu.details}</Text>}
        </View>
      ))}
    </View>
  );
}

function SectionSkills({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.skills.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Skills</Text>
      {resume.skills.map((cat) => (
        <View key={cat.id} style={styles.skillCategory}>
          <Text style={styles.skillCatName}>{cat.category}</Text>
          <View style={styles.tagRow}>
            {cat.items.map((item, i) => (
              <Text key={i} style={styles.skillTag}>{item}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionCertifications({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.certifications.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Certifications</Text>
      {resume.certifications.map((cert) => (
        <View key={cert.id} style={styles.certRow}>
          <Text>
            {cert.url ? (
              <Link src={cert.url} style={styles.certName}>{cert.name}</Link>
            ) : (
              <Text style={styles.certName}>{cert.name}</Text>
            )}
            <Text style={styles.certIssuer}> — {cert.issuer}</Text>
          </Text>
          <Text style={styles.certDate}>{cert.date}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionLanguages({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.languages.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Languages</Text>
      <View style={styles.langRow}>
        {resume.languages.map((lang) => (
          <Text key={lang.id} style={styles.langItem}>
            <Text style={styles.langName}>{lang.language}</Text>
            <Text style={styles.langLevel}> — {lang.level}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
}

function SectionProjects({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.projects.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Projects</Text>
      {resume.projects.map((proj) => (
        <View key={proj.id} style={{ marginBottom: 6 }}>
          <View style={styles.entryHeader}>
            <Text style={styles.projName}>{proj.name}</Text>
            {proj.link && <Text style={styles.projLink}>{proj.link}</Text>}
          </View>
          <Text style={styles.projDesc}>{proj.description}</Text>
          <View style={[styles.tagRow, { marginTop: 2 }]}>
            {proj.technologies.map((t, i) => (
              <Text key={i} style={styles.techTag}>{t}</Text>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function SectionProducts({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.products.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>Products</Text>
      {resume.products.map((prod) => (
        <View key={prod.id} style={{ marginBottom: 6 }}>
          <Text style={styles.prodName}>{prod.name}</Text>
          <Text style={styles.prodDesc}>{prod.description}</Text>
          <Text style={styles.prodRole}>Role: {prod.role}</Text>
          {prod.highlights.map((h, i) => (
            <Text key={i} style={styles.highlight}>• {h}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function SectionReferences({ resume, styles }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles> }) {
  if (!resume.references.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>References</Text>
      <View style={styles.refGrid}>
        {resume.references.map((ref) => (
          <View key={ref.id} style={styles.refItem}>
            <Text style={styles.refName}>{ref.name}</Text>
            <Text style={styles.refTitle}>{ref.title}</Text>
            <Text style={styles.refTitle}>{ref.company}</Text>
            {ref.contact && <Text style={styles.refContact}>{ref.contact}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

function renderPdfSection(section: ResumeSection, resume: ResolvedResume, styles: ReturnType<typeof createStyles>, theme: ResumeTheme) {
  switch (section) {
    case 'personal': return <SectionPersonal key="personal" resume={resume} styles={styles} theme={theme} />;
    case 'summary': return <SectionSummary key="summary" resume={resume} styles={styles} />;
    case 'experience': return <SectionExperience key="experience" resume={resume} styles={styles} />;
    case 'education': return <SectionEducation key="education" resume={resume} styles={styles} />;
    case 'skills': return <SectionSkills key="skills" resume={resume} styles={styles} />;
    case 'certifications': return <SectionCertifications key="certifications" resume={resume} styles={styles} />;
    case 'languages': return <SectionLanguages key="languages" resume={resume} styles={styles} />;
    case 'projects': return <SectionProjects key="projects" resume={resume} styles={styles} />;
    case 'products': return <SectionProducts key="products" resume={resume} styles={styles} />;
    case 'references': return <SectionReferences key="references" resume={resume} styles={styles} />;
    default: return null;
  }
}

export default function ResumePdfDocument({ resume, theme }: Props) {
  const styles = createStyles(theme);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {theme.layout.sectionOrder.map((section) => renderPdfSection(section, resume, styles, theme))}
      </Page>
    </Document>
  );
}
