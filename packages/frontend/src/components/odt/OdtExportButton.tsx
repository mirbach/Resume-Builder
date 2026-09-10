import { useState } from 'react';
import JSZip from 'jszip';
import type { ResolvedResume, ResumeTheme, Language } from '../../lib/types';
import { fetchAsImageBytes, type ImageBytes } from '../../lib/fileUtils';
import { buildResumeOdt } from './ResumeOdtDocument';
import { FileType, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  resume: ResolvedResume;
  theme: ResumeTheme;
  language: Language;
}

export default function OdtExportButton({ resume, theme, language }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setGenerating(true);
    setError(null);
    try {
      let photo: ImageBytes | undefined;
      let logo: ImageBytes | undefined;

      if (theme.layout.showPhoto && resume.personal.photo) {
        try { photo = await fetchAsImageBytes(resume.personal.photo); }
        catch { /* skip if fetch fails */ }
      }
      if (theme.logo) {
        try { logo = await fetchAsImageBytes(theme.logo); }
        catch { /* skip if fetch fails */ }
      }

      const doc = buildResumeOdt(resume, theme, language, { photo, logo });

      const zip = new JSZip();
      zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });
      zip.file('META-INF/manifest.xml', doc.manifestXml);
      zip.file('content.xml', doc.contentXml);
      zip.file('styles.xml', doc.stylesXml);
      zip.file('meta.xml', doc.metaXml);
      for (const img of doc.images) zip.file(img.path, img.data);

      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.text' });
      const url = URL.createObjectURL(blob);
      const safeName = resume.personal.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-]/g, '');
      const safeTheme = theme.name.replace(/\s+/g, '').replace(/[^a-zA-Z0-9-]/g, '');
      const lang = language === 'de' ? 'DE' : 'EN';
      const a = document.createElement('a');
      a.href = url;
      a.download = `CV-${safeName}-${safeTheme}-${lang}.odt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('ODT generation failed:', err);
      setError(err instanceof Error ? err.message : 'ODT generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={generating}
        className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {generating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <FileType size={14} />
        )}
        {generating ? 'Generating...' : 'Export ODT'}
      </button>
      {error && (
        <span className="flex items-center gap-1 text-xs text-red-600 max-w-[200px] text-right">
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}
