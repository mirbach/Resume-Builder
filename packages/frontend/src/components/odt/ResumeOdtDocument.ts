import type { ResolvedResume, ResumeTheme, ResumeSection, EliteCategory, Language } from '../../lib/types';
import { getSectionLabel, getCarLabel, getEliteLabel } from '../../lib/sectionLabels';
import type { ImageBytes } from '../../lib/fileUtils';
import { escXml } from './xml';

// Fixed elite-category colors, matching ResumePdfDocument.tsx's ELITE_BG/ELITE_COLOR maps
// (kept independent of theme colors, same as the PDF export).
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

export interface OdtImages {
  photo?: ImageBytes;
  logo?: ImageBytes;
}

export interface OdtImageFile {
  path: string;
  data: Uint8Array;
  mime: string;
}

export interface OdtDocument {
  contentXml: string;
  stylesXml: string;
  manifestXml: string;
  metaXml: string;
  images: OdtImageFile[];
}

function span(styleName: string, text: string): string {
  return `<text:span text:style-name="${styleName}">${escXml(text)}</text:span>`;
}

function p(styleName: string, inner: string): string {
  return `<text:p text:style-name="${styleName}">${inner}</text:p>`;
}

function ptToCm(pt: number): number {
  return (pt * 2.54) / 72;
}

// CSS object-fit: contain — scales the natural size down to fit inside the box
// without distorting it. Falls back to the box itself when dimensions weren't
// readable (see fetchAsImageBytes), same as the previous fixed-box behavior.
function fitWithin(naturalW: number | undefined, naturalH: number | undefined, maxWCm: number, maxHCm: number): { wCm: number; hCm: number } {
  if (!naturalW || !naturalH) return { wCm: maxWCm, hCm: maxHCm };
  const scale = Math.min(maxWCm / naturalW, maxHCm / naturalH);
  return { wCm: naturalW * scale, hCm: naturalH * scale };
}

// A font the theme names (e.g. "Space Grotesk") may not be installed on the
// machine opening the document — unlike the PDF path, which maps down to
// guaranteed-available base-14 fonts, Word/LibreOffice fall back on their own
// when a name is unknown, and that fallback can look nothing like the intended
// typeface. fo:font-family (unlike style:font-name, which resolves a single
// declared face) accepts a CSS-style fallback list, so give it one.
function fontFamily(font: string): string {
  const fallback = /times|georgia|serif|garamond/i.test(font)
    ? `'Georgia', 'Times New Roman', serif`
    : `'Segoe UI', 'Calibri', 'Arial', sans-serif`;
  return `'${font}', ${fallback}`;
}

// --- Automatic styles (paragraph + text), driven by theme colors/fonts ---

function buildAutomaticStyles(theme: ResumeTheme): string {
  const c = theme.colors;
  const m = theme.layout.pageMargins;
  const headingFont = theme.fonts.heading;
  const bodyFont = theme.fonts.body;

  const styles: string[] = [];

  const para = (name: string, props: string, textProps: string) =>
    styles.push(`<style:style style:name="${name}" style:family="paragraph"><style:paragraph-properties ${props}/><style:text-properties ${textProps}/></style:style>`);

  const text = (name: string, textProps: string) =>
    styles.push(`<style:style style:name="${name}" style:family="text"><style:text-properties ${textProps}/></style:style>`);

  // Word's ODF filter does not reliably paint the page-level background color
  // (style:page-layout-properties/fo:background-color in styles.xml), which
  // leaves near-white theme text unreadable on a plain white Word page. Table
  // cell shading is supported consistently by both Word and LibreOffice (it's
  // effectively the same feature as Word's own cell shading), so the page
  // background is instead painted by wrapping the whole body in one borderless,
  // full-page table cell — see buildResumeOdt. Page margins move into this
  // cell's padding so the fill still reaches every edge.
  styles.push(`<style:style style:name="PageTable" style:family="table"><style:table-properties style:width="21cm" table:align="margins"/></style:style>`);
  styles.push(`<style:style style:name="PageTableCol" style:family="table-column"><style:table-column-properties style:column-width="21cm"/></style:style>`);
  styles.push(`<style:style style:name="PageTableCell" style:family="table-cell"><style:table-cell-properties fo:background-color="${c.background}" fo:padding-top="${m.top}pt" fo:padding-right="${m.right}pt" fo:padding-bottom="${m.bottom}pt" fo:padding-left="${m.left}pt" fo:border="none"/></style:style>`);

  const headingFamily = fontFamily(headingFont);
  const bodyFamily = fontFamily(bodyFont);

  para('P-ImgCell', 'fo:text-align="center"', '');
  para('P-Name', 'fo:margin-bottom="2pt"', `fo:font-family="${headingFamily}" fo:font-weight="bold" fo:font-size="22pt" fo:color="${c.heading}"`);
  para('P-Title', 'fo:margin-bottom="2pt"', `fo:font-family="${bodyFamily}" fo:font-size="14pt" fo:color="${c.primary}"`);
  para('P-CompanyName', 'fo:margin-bottom="2pt"', `fo:font-family="${headingFamily}" fo:font-weight="bold" fo:font-size="8pt" fo:color="${c.secondary}"`);
  para('P-Contact', 'fo:margin-bottom="10pt"', `fo:font-family="${bodyFamily}" fo:font-size="8pt" fo:color="${c.secondary}"`);
  para('P-SectionTitle',
    `fo:keep-with-next="always" fo:margin-top="10pt" fo:margin-bottom="6pt" fo:padding-bottom="2pt" fo:border-bottom="1pt solid ${c.primary}"`,
    `fo:font-family="${headingFamily}" fo:font-weight="bold" fo:font-size="12pt" fo:color="${c.heading}"`);
  para('P-EntryTitle', 'fo:keep-with-next="always" fo:margin-top="4pt" fo:margin-bottom="1pt"', `fo:font-family="${headingFamily}" fo:font-weight="bold" fo:font-size="10pt" fo:color="${c.heading}"`);
  para('P-EntrySubtitle', 'fo:margin-bottom="2pt"', `fo:font-family="${bodyFamily}" fo:font-size="9pt" fo:color="${c.primary}"`);
  // Matches ResumePdfDocument.tsx's skillCatName: heading color/font, unlike
  // P-EntrySubtitle (primary) used for company/institution lines — the two
  // look the same enough to mix up, but the PDF and web preview keep them distinct.
  para('P-SkillCat', 'fo:keep-with-next="always" fo:margin-bottom="2pt"', `fo:font-family="${headingFamily}" fo:font-weight="bold" fo:font-size="9pt" fo:color="${c.heading}"`);
  para('P-Small', 'fo:margin-bottom="2pt"', `fo:font-family="${bodyFamily}" fo:font-size="8pt" fo:color="${c.secondary}"`);
  para('P-Body', 'fo:margin-bottom="3pt" fo:line-height="140%"', `fo:font-family="${bodyFamily}" fo:font-size="9pt" fo:color="${c.text}"`);
  para('P-Bullet', 'fo:margin-left="10pt" fo:margin-bottom="2pt"', `fo:font-family="${bodyFamily}" fo:font-size="9pt" fo:color="${c.text}"`);

  text('T-Bold', `fo:font-weight="bold" fo:color="${c.heading}"`);
  text('T-Primary', `fo:color="${c.primary}"`);
  // Explicit weight/size/family: several uses (period, product link) sit inline
  // inside a now-bold P-EntryTitle paragraph and would otherwise inherit its
  // bold 10pt heading font instead of matching the PDF's plain 9pt body text.
  text('T-Secondary', `fo:font-family="${bodyFamily}" fo:font-weight="normal" fo:font-size="9pt" fo:color="${c.secondary}"`);
  text('T-Accent', `fo:font-weight="bold" fo:color="${c.accent}"`);
  text('T-Label', `fo:font-family="${headingFamily}" fo:font-weight="bold" fo:color="${c.accent}" fo:font-size="8pt"`);
  text('T-SkillTag', `fo:color="${c.skillTagText ?? c.primary}" fo:background-color="${c.skillTagBg ?? '#eef2ff'}" fo:font-size="8pt"`);
  text('T-TechTag', `fo:color="${c.techTagText ?? c.accent}" fo:background-color="${c.techTagBg ?? '#fef3c7'}" fo:font-size="8pt"`);

  for (const category of Object.keys(ELITE_BG) as EliteCategory[]) {
    text(`T-Elite-${category}`, `fo:font-weight="bold" fo:font-size="7pt" fo:color="${ELITE_COLOR[category]}" fo:background-color="${ELITE_BG[category]}"`);
  }

  return styles.join('');
}

// Header table (photo/logo beside the name block) needs column widths sized to
// this specific render's margins and which of photo/logo are actually present,
// so it's built separately from the theme-only styles above and appended to them.
function buildHeaderTableStyles(theme: ResumeTheme, hasPhoto: boolean, hasLogo: boolean): string {
  if (!hasPhoto && !hasLogo) return '';
  const m = theme.layout.pageMargins;
  const sideWidthCm = 4;
  const contentWidthCm = 21 - ptToCm(m.left) - ptToCm(m.right);
  const sideCols = (hasPhoto ? 1 : 0) + (hasLogo ? 1 : 0);
  const mainWidthCm = Math.max(contentWidthCm - sideCols * sideWidthCm, 4);
  const bg = theme.colors.background;

  return [
    `<style:style style:name="HeaderTable" style:family="table"><style:table-properties style:width="${contentWidthCm.toFixed(2)}cm" table:align="left"/></style:style>`,
    `<style:style style:name="HeaderColSide" style:family="table-column"><style:table-column-properties style:column-width="${sideWidthCm}cm"/></style:style>`,
    `<style:style style:name="HeaderColMain" style:family="table-column"><style:table-column-properties style:column-width="${mainWidthCm.toFixed(2)}cm"/></style:style>`,
    `<style:style style:name="HeaderCellSide" style:family="table-cell"><style:table-cell-properties fo:background-color="${bg}" style:vertical-align="middle" fo:border="none" fo:padding="0cm"/></style:style>`,
    `<style:style style:name="HeaderCellMain" style:family="table-cell"><style:table-cell-properties fo:background-color="${bg}" style:vertical-align="middle" fo:border="none" fo:padding-top="0cm" fo:padding-bottom="0cm" fo:padding-left="8pt" fo:padding-right="8pt"/></style:style>`,
  ].join('');
}

// --- Section builders (each returns an array of paragraph XML strings) ---

function carParagraphs(achievements: { id: string; challenge: string; action: string; result: string; eliteCategory?: EliteCategory }[], lang: Language): string[] {
  const out: string[] = [];
  for (const ach of achievements) {
    if (!ach.challenge && !ach.action && !ach.result) continue;
    if (ach.challenge) out.push(p('P-Body', span('T-Label', `${getCarLabel('challenge', lang)}: `) + escXml(ach.challenge)));
    if (ach.action) out.push(p('P-Body', span('T-Label', `${getCarLabel('action', lang)}: `) + escXml(ach.action)));
    const resultLine = ach.result ? span('T-Label', `${getCarLabel('result', lang)}: `) + escXml(ach.result) : '';
    const badge = ach.eliteCategory ? ` ${span(`T-Elite-${ach.eliteCategory}`, ` ${getEliteLabel(ach.eliteCategory, lang)} `)}` : '';
    if (resultLine || badge) out.push(p('P-Body', resultLine + badge));
  }
  return out;
}

function tagRow(items: string[], styleName: string): string {
  return items.map((item) => span(styleName, ` ${item} `)).join(' ');
}

interface PersonalImageRef {
  path?: string;
  width?: number;
  height?: number;
}

function renderPersonal(resume: ResolvedResume, theme: ResumeTheme, imageRefs: { photo: PersonalImageRef; logo: PersonalImageRef }): string[] {
  const hasPhoto = theme.layout.showPhoto && !!imageRefs.photo.path;
  const hasLogo = !!imageRefs.logo.path;

  const nameBlock: string[] = [];
  nameBlock.push(p('P-Name', escXml(resume.personal.name)));
  if (resume.personal.title) nameBlock.push(p('P-Title', escXml(resume.personal.title)));
  if (theme.companyName) nameBlock.push(p('P-CompanyName', escXml(theme.companyName)));

  const contactItems = [
    theme.companyEmail,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.github,
    resume.personal.linkedin,
    resume.personal.website,
    theme.companyWebsite,
  ].filter((v): v is string => !!v);
  if (contactItems.length) nameBlock.push(p('P-Contact', escXml(contactItems.join('   •   '))));

  if (!hasPhoto && !hasLogo) return nameBlock;

  // Photo/logo sit either side of the name block in a borderless table row —
  // matching the PDF header's side-by-side layout — rather than stacked above
  // the name, which ate a lot of vertical space and didn't match the PDF export.
  // Each is scaled to fit its box (object-fit: contain) using the dimensions
  // read from the file itself, rather than a fixed box that stretched non-square
  // logos/photos out of their real aspect ratio.
  const imgCell = (ref: PersonalImageRef, name: string, maxWCm: number, maxHCm: number) => {
    const { wCm, hCm } = fitWithin(ref.width, ref.height, maxWCm, maxHCm);
    return `<table:table-cell table:style-name="HeaderCellSide">${p('P-ImgCell', `<draw:frame draw:name="${name}" text:anchor-type="as-char" svg:width="${wCm.toFixed(2)}cm" svg:height="${hCm.toFixed(2)}cm"><draw:image xlink:href="${ref.path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame>`)}</table:table-cell>`;
  };

  const columns =
    (hasPhoto ? '<table:table-column table:style-name="HeaderColSide"/>' : '') +
    '<table:table-column table:style-name="HeaderColMain"/>' +
    (hasLogo ? '<table:table-column table:style-name="HeaderColSide"/>' : '');

  const row =
    (hasPhoto ? imgCell(imageRefs.photo, 'photo', 3, 3) : '') +
    `<table:table-cell table:style-name="HeaderCellMain">${nameBlock.join('')}</table:table-cell>` +
    (hasLogo ? imgCell(imageRefs.logo, 'logo', 3.6, 1.4) : '');

  return [`<table:table table:name="Header" table:style-name="HeaderTable">${columns}<table:table-row>${row}</table:table-row></table:table>`];
}

function renderSummary(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.summary) return [];
  return [p('P-SectionTitle', escXml(getSectionLabel('summary', lang))), p('P-Body', escXml(resume.summary))];
}

function renderExperience(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.experience.length) return [];
  const out: string[] = [p('P-SectionTitle', escXml(getSectionLabel('experience', lang)))];
  for (const exp of resume.experience) {
    out.push(p('P-EntryTitle', escXml(exp.role) + '  —  ' + span('T-Secondary', exp.period)));
    out.push(p('P-EntrySubtitle', escXml([exp.company, exp.location].filter(Boolean).join(' — '))));
    if (exp.description) out.push(p('P-Body', escXml(exp.description)));
    out.push(...carParagraphs(exp.achievements, lang));
  }
  return out;
}

function renderEducation(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.education.length) return [];
  const out: string[] = [p('P-SectionTitle', escXml(getSectionLabel('education', lang)))];
  for (const edu of resume.education) {
    out.push(p('P-EntryTitle', escXml(edu.degree) + '  —  ' + span('T-Secondary', edu.period)));
    out.push(p('P-EntrySubtitle', escXml(edu.institution)));
    if (edu.details) out.push(p('P-Small', escXml(edu.details)));
  }
  return out;
}

function renderSkills(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.skills.length) return [];
  const out: string[] = [p('P-SectionTitle', escXml(getSectionLabel('skills', lang)))];
  for (const cat of resume.skills) {
    out.push(p('P-SkillCat', escXml(cat.category)));
    out.push(p('P-Body', tagRow(cat.items, 'T-SkillTag')));
  }
  return out;
}

function renderCertifications(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.certifications.length) return [];
  const out: string[] = [p('P-SectionTitle', escXml(getSectionLabel('certifications', lang)))];
  for (const cert of resume.certifications) {
    // Deliberately not a clickable text:a: both Word and LibreOffice force their
    // own built-in blue/underlined hyperlink look on it regardless of any style
    // attribute we attach (tried text:style-name on the link, tried redefining
    // the "Internet Link" role style — neither took), which clashed badly on a
    // dark theme. Plain themed text with the URL spelled out stays legible and
    // still gets the destination in front of the reader.
    const name = span('T-Bold', cert.name);
    out.push(p('P-Body', name + escXml(` — ${cert.issuer}`) + '   ' + span('T-Secondary', cert.date)));
    if (cert.url) out.push(p('P-Small', escXml(cert.url)));
  }
  return out;
}

function renderLanguages(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.languages.length) return [];
  const items = resume.languages.map((l) => span('T-Bold', l.language) + escXml(` — ${l.level}`));
  return [p('P-SectionTitle', escXml(getSectionLabel('languages', lang))), p('P-Body', items.join('      '))];
}

function renderProjects(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.projects.length) return [];
  const out: string[] = [p('P-SectionTitle', escXml(getSectionLabel('projects', lang)))];
  for (const proj of resume.projects) {
    const period = proj.period ? '  —  ' + span('T-Secondary', proj.period) : '';
    out.push(p('P-EntryTitle', escXml(proj.name) + (proj.company ? escXml(` @ ${proj.company}`) : '') + period));
    if (proj.link) out.push(p('P-Small', escXml(proj.link)));
    if (proj.description) out.push(p('P-Body', escXml(proj.description)));
    if (proj.technologies.length) out.push(p('P-Body', tagRow(proj.technologies, 'T-TechTag')));
    out.push(...carParagraphs(proj.achievements, lang));
  }
  return out;
}

function renderProducts(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.products.length) return [];
  const out: string[] = [p('P-SectionTitle', escXml(getSectionLabel('products', lang)))];
  for (const prod of resume.products) {
    out.push(p('P-EntryTitle', escXml(prod.name) + (prod.link ? '   ' + span('T-Secondary', prod.link) : '')));
    if (prod.description) out.push(p('P-Body', escXml(prod.description)));
    out.push(p('P-Small', escXml(`Role: ${prod.role}`)));
    for (const h of prod.highlights) out.push(p('P-Bullet', escXml(`• ${h}`)));
  }
  return out;
}

function renderReferences(resume: ResolvedResume, lang: Language): string[] {
  if (!resume.references.length) return [];
  const out: string[] = [p('P-SectionTitle', escXml(getSectionLabel('references', lang)))];
  for (const ref of resume.references) {
    out.push(p('P-EntryTitle', escXml(ref.name)));
    out.push(p('P-EntrySubtitle', escXml([ref.title, ref.company].filter(Boolean).join(' — '))));
    if (ref.contact) out.push(p('P-Small', escXml(ref.contact)));
  }
  return out;
}

function renderOdtSection(
  section: ResumeSection,
  resume: ResolvedResume,
  theme: ResumeTheme,
  lang: Language,
  imageRefs: { photo: PersonalImageRef; logo: PersonalImageRef },
): string[] {
  switch (section) {
    case 'personal': return renderPersonal(resume, theme, imageRefs);
    case 'summary': return renderSummary(resume, lang);
    case 'experience': return renderExperience(resume, lang);
    case 'education': return renderEducation(resume, lang);
    case 'skills': return renderSkills(resume, lang);
    case 'certifications': return renderCertifications(resume, lang);
    case 'languages': return renderLanguages(resume, lang);
    case 'projects': return renderProjects(resume, lang);
    case 'products': return renderProducts(resume, lang);
    case 'references': return renderReferences(resume, lang);
    default: return [];
  }
}

function buildStylesXml(theme: ResumeTheme): string {
  // Page margins are 0 here — the full-page table cell in buildResumeOdt supplies
  // the visual margin via its own padding instead, so its background fill reaches
  // every edge regardless of whether the viewer honors this page background hint.
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" office:version="1.2">
<office:styles/>
<office:automatic-styles>
<style:page-layout style:name="PM1">
<style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm" fo:margin-top="0pt" fo:margin-bottom="0pt" fo:margin-left="0pt" fo:margin-right="0pt" fo:background-color="${theme.colors.background}"/>
</style:page-layout>
</office:automatic-styles>
<office:master-styles>
<style:master-page style:name="Standard" style:page-layout-name="PM1"/>
</office:master-styles>
</office:document-styles>`;
}

function buildMetaXml(resume: ResolvedResume): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" office:version="1.2">
<office:meta>
<dc:title>${escXml(resume.personal.name || 'Resume')}</dc:title>
<dc:creator>Resume Builder</dc:creator>
</office:meta>
</office:document-meta>`;
}

function buildManifestXml(images: OdtImageFile[]): string {
  const entries = images
    .map((img) => `<manifest:file-entry manifest:full-path="${img.path}" manifest:media-type="${img.mime}"/>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
<manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
<manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
${entries}
</manifest:manifest>`;
}

export function buildResumeOdt(resume: ResolvedResume, theme: ResumeTheme, lang: Language, images: OdtImages): OdtDocument {
  const imageFiles: OdtImageFile[] = [];
  const imageRefs: { photo: PersonalImageRef; logo: PersonalImageRef } = { photo: {}, logo: {} };

  if (images.photo) {
    const path = `Pictures/photo.${images.photo.ext}`;
    imageRefs.photo = { path, width: images.photo.width, height: images.photo.height };
    imageFiles.push({ path, data: images.photo.data, mime: images.photo.mime });
  }
  if (images.logo) {
    const path = `Pictures/logo.${images.logo.ext}`;
    imageRefs.logo = { path, width: images.logo.width, height: images.logo.height };
    imageFiles.push({ path, data: images.logo.data, mime: images.logo.mime });
  }

  const body = theme.layout.sectionOrder
    .flatMap((section) => renderOdtSection(section, resume, theme, lang, imageRefs))
    .join('');

  // See buildAutomaticStyles: the page background hint alone isn't reliably honored
  // by Word, so the whole body is wrapped in one borderless, full-page table cell
  // whose shading Word and LibreOffice both render consistently.
  const page = `<table:table table:name="Page" table:style-name="PageTable"><table:table-column table:style-name="PageTableCol"/><table:table-row><table:table-cell table:style-name="PageTableCell">${body}</table:table-cell></table:table-row></table:table>`;

  const headerStyles = buildHeaderTableStyles(
    theme,
    theme.layout.showPhoto && !!imageRefs.photo.path,
    !!imageRefs.logo.path,
  );

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.2">
<office:automatic-styles>${buildAutomaticStyles(theme)}${headerStyles}</office:automatic-styles>
<office:body>
<office:text>${page}</office:text>
</office:body>
</office:document-content>`;

  return {
    contentXml,
    stylesXml: buildStylesXml(theme),
    manifestXml: buildManifestXml(imageFiles),
    metaXml: buildMetaXml(resume),
    images: imageFiles,
  };
}
