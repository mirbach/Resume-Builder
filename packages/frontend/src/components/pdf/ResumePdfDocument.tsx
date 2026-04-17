// @ts-nocheck -- @react-pdf/renderer class components are incompatible with React 19 JSX.ElementClass; tracked upstream
import {
  Document,
  Page,
  Text,
  View,
  Image,
  Link,
  StyleSheet,
  Font,
  Svg,
  Path,
  Rect,
  Circle,
} from '@react-pdf/renderer';
import type { ResolvedResume, ResumeTheme, ResumeSection, EliteCategory, Language } from '../../lib/types';
import { getSectionLabel, getCarLabel, getEliteLabel } from '../../lib/sectionLabels';
import { lightTint } from '../../lib/colorUtils';

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

// ---- Inline SVG icons for the PDF contact row ----
const IC = 8; // icon size in pt
type IconProps = { color: string };

function IconMail({ color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={IC} height={IC}>
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconPhone({ color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={IC} height={IC}>
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.07 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconMapPin({ color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={IC} height={IC}>
      <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function IconLinkedin({ color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={IC} height={IC}>
      <Path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="2" y="9" width="4" height="12" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="4" cy="4" r="2" stroke={color} strokeWidth={2} fill="none" />
    </Svg>
  );
}

function IconGithub({ color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={IC} height={IC}>
      <Path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 18c-4.51 2-5-2-7-2" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconGlobe({ color }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={IC} height={IC}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 12h20" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

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
    companyName: { fontSize: 8, fontFamily: headingFontBold, color: theme.colors.secondary, textAlign: 'left' },
    photo: { width: 64, height: 64, borderRadius: 32, objectFit: 'cover', marginRight: 14, borderWidth: 2, borderColor: theme.colors.primary },
    name: { fontSize: 22, fontFamily: headingFontBold, color: theme.colors.heading },
    title: { fontSize: 14, marginTop: 2, color: theme.colors.primary },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 10 },
    contactCell: { flexDirection: 'row', alignItems: 'center', gap: 2 },
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
      borderRadius: 4,
      paddingHorizontal: 4, paddingVertical: 1,
      fontSize: 7,
      marginLeft: 4, marginTop: 1,
      alignSelf: 'flex-start',
    },
    skillCategory: { marginBottom: 4 },
    skillCatName: { fontSize: 9, fontFamily: headingFontBold, color: theme.colors.heading, marginBottom: 2 },
    skillTag: {
      fontSize: 8, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8,
      backgroundColor: lightTint(theme.colors.primary), color: theme.colors.primary, marginRight: 4, marginBottom: 2,
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
    entryCompany: { fontSize: 9, fontFamily: headingFont, color: theme.colors.secondary },
    projLink: { fontSize: 8, color: theme.colors.accent },
    projDesc: { fontSize: 9, marginTop: 1 },
    techTag: {
      fontSize: 7, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3,
      backgroundColor: lightTint(theme.colors.accent), color: theme.colors.accent,
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
  lang: Language;
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
            <Text style={[styles.companyName, { marginTop: 2 }]}>{theme.companyName}</Text>
          )}
          <View style={styles.contactRow}>
            {theme.companyEmail && (
              <View style={styles.contactCell}>
                <IconMail color={theme.colors.secondary} />
                <Text style={styles.contactItem}>{theme.companyEmail}</Text>
              </View>
            )}
            {resume.personal.phone && (
              <View style={styles.contactCell}>
                <IconPhone color={theme.colors.secondary} />
                <Text style={styles.contactItem}>{resume.personal.phone}</Text>
              </View>
            )}
            {resume.personal.location && (
              <View style={styles.contactCell}>
                <IconMapPin color={theme.colors.secondary} />
                <Text style={styles.contactItem}>{resume.personal.location}</Text>
              </View>
            )}
            {resume.personal.github && (
              <View style={styles.contactCell}>
                <IconGithub color={theme.colors.secondary} />
                <Text style={styles.contactItem}>{resume.personal.github}</Text>
              </View>
            )}
            {resume.personal.linkedin && (
              <View style={styles.contactCell}>
                <IconLinkedin color={theme.colors.secondary} />
                <Text style={styles.contactItem}>{resume.personal.linkedin}</Text>
              </View>
            )}
            {resume.personal.website && (
              <View style={styles.contactCell}>
                <IconGlobe color={theme.colors.secondary} />
                <Text style={styles.contactItem}>{resume.personal.website}</Text>
              </View>
            )}
            {theme.companyWebsite && (
              <View style={styles.contactCell}>
                <IconGlobe color={theme.colors.secondary} />
                <Text style={styles.contactItem}>{theme.companyWebsite}</Text>
              </View>
            )}
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

function SectionSummary({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.summary) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('summary', lang)}</Text>
      <Text style={styles.bodyText}>{resume.summary}</Text>
    </View>
  );
}

function SectionExperience({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.experience.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('experience', lang)}</Text>
      {resume.experience.map((exp) => (
        <View key={exp.id} style={{ marginBottom: 8 }}>
          <View style={styles.entryHeader}>
            <View>
              <Text style={styles.entryTitle}>{exp.role}</Text>
              <Text style={styles.entrySubtitle}>{[exp.company, exp.location].filter(Boolean).join(' \u2014 ')}</Text>
            </View>
            <Text style={styles.entryPeriod}>{exp.period}</Text>
          </View>
          {exp.achievements.filter(a => a.challenge || a.action || a.result).map((ach) => (
            <View key={ach.id} style={[styles.achievement, { flexDirection: 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>{getCarLabel('challenge', lang)}: </Text>{ach.challenge}
                </Text>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>{getCarLabel('action', lang)}: </Text>{ach.action}
                </Text>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>{getCarLabel('result', lang)}: </Text>{ach.result}
                </Text>
              </View>
              {ach.eliteCategory && (
                <View style={[styles.eliteBadge, { backgroundColor: ELITE_BG[ach.eliteCategory], color: ELITE_COLOR[ach.eliteCategory] }]}>
                  <Text style={{ fontSize: 7, fontWeight: 700, textAlign: 'center', color: ELITE_COLOR[ach.eliteCategory!] }}>
                    {getEliteLabel(ach.eliteCategory, lang)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SectionEducation({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.education.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('education', lang)}</Text>
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

function SectionSkills({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.skills.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('skills', lang)}</Text>
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

function SectionCertifications({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.certifications.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('certifications', lang)}</Text>
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

function SectionLanguages({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.languages.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('languages', lang)}</Text>
      <View style={styles.langRow}>
        {resume.languages.map((langEntry) => (
          <Text key={langEntry.id} style={styles.langItem}>
            <Text style={styles.langName}>{langEntry.language}</Text>
            <Text style={styles.langLevel}> — {langEntry.level}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
}

function SectionProjects({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.projects.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('projects', lang)}</Text>
      {resume.projects.map((proj) => (
        <View key={proj.id} style={{ marginBottom: 6 }}>
          <View style={styles.entryHeader}>
            <Text style={styles.projName}>
              {proj.name}
              {proj.company ? <Text style={styles.entryCompany}> @ {proj.company}</Text> : null}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!!proj.period && <Text style={styles.entryPeriod}>{proj.period}</Text>}
              {!!proj.link && <Text style={styles.projLink}>{proj.link}</Text>}
            </View>
          </View>
          {!!proj.description && <Text style={styles.projDesc}>{proj.description}</Text>}
          {proj.technologies.length > 0 && (
            <View style={[styles.tagRow, { marginTop: 2 }]}>
              {proj.technologies.map((t, i) => (
                <Text key={i} style={styles.techTag}>{t}</Text>
              ))}
            </View>
          )}
          {proj.achievements.filter(a => a.challenge || a.action || a.result).map((ach) => (
            <View key={ach.id} style={[styles.achievement, { flexDirection: 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>{getCarLabel('challenge', lang)}: </Text>{ach.challenge}
                </Text>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>{getCarLabel('action', lang)}: </Text>{ach.action}
                </Text>
                <Text style={styles.achText}>
                  <Text style={styles.achLabel}>{getCarLabel('result', lang)}: </Text>{ach.result}
                </Text>
              </View>
              {ach.eliteCategory && (
                <View style={[styles.eliteBadge, { backgroundColor: ELITE_BG[ach.eliteCategory], color: ELITE_COLOR[ach.eliteCategory] }]}>
                  <Text style={{ fontSize: 7, fontWeight: 700, textAlign: 'center', color: ELITE_COLOR[ach.eliteCategory!] }}>
                    {getEliteLabel(ach.eliteCategory, lang)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SectionProducts({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.products.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('products', lang)}</Text>
      {resume.products.map((prod) => (
        <View key={prod.id} style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.prodName}>{prod.name}</Text>
            {prod.link && (
              <Text style={{ fontSize: 8, color: styles.techTag.color }}>{prod.link}</Text>
            )}
          </View>
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

function SectionReferences({ resume, styles, lang }: { resume: ResolvedResume; styles: ReturnType<typeof createStyles>; lang: Language }) {
  if (!resume.references.length) return null;
  return (
    <View>
      <Text style={styles.sectionTitle}>{getSectionLabel('references', lang)}</Text>
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

function renderPdfSection(section: ResumeSection, resume: ResolvedResume, styles: ReturnType<typeof createStyles>, theme: ResumeTheme, lang: Language) {
  switch (section) {
    case 'personal': return <SectionPersonal key="personal" resume={resume} styles={styles} theme={theme} />;
    case 'summary': return <SectionSummary key="summary" resume={resume} styles={styles} lang={lang} />;
    case 'experience': return <SectionExperience key="experience" resume={resume} styles={styles} lang={lang} />;
    case 'education': return <SectionEducation key="education" resume={resume} styles={styles} lang={lang} />;
    case 'skills': return <SectionSkills key="skills" resume={resume} styles={styles} lang={lang} />;
    case 'certifications': return <SectionCertifications key="certifications" resume={resume} styles={styles} lang={lang} />;
    case 'languages': return <SectionLanguages key="languages" resume={resume} styles={styles} lang={lang} />;
    case 'projects': return <SectionProjects key="projects" resume={resume} styles={styles} lang={lang} />;
    case 'products': return <SectionProducts key="products" resume={resume} styles={styles} lang={lang} />;
    case 'references': return <SectionReferences key="references" resume={resume} styles={styles} lang={lang} />;
    default: return null;
  }
}

export default function ResumePdfDocument({ resume, theme, lang }: Props) {
  const styles = createStyles(theme);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {theme.layout.sectionOrder.map((section) => renderPdfSection(section, resume, styles, theme, lang))}
      </Page>
    </Document>
  );
}
