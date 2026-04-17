import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import type { ResolvedResume, ResumeTheme, Language } from '../../lib/types';
import ResumePdfDocument from './ResumePdfDocument';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  resume: ResolvedResume;
  theme: ResumeTheme;
  language: Language;
}

async function toDataUrl(src: string): Promise<string> {
  const url = src.startsWith('http') ? src : `${window.location.origin}${src}`;
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function PdfExportButton({ resume, theme, language }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setGenerating(true);
    setError(null);
    try {
      // Pre-fetch images as base64 so @react-pdf/renderer can embed them
      const resolvedResume = { ...resume, personal: { ...resume.personal } };
      const resolvedTheme = { ...theme };

      if (resolvedResume.personal.photo) {
        try { resolvedResume.personal.photo = await toDataUrl(resolvedResume.personal.photo); }
        catch { /* skip if fetch fails */ }
      }
      if (resolvedTheme.logo) {
        try { resolvedTheme.logo = await toDataUrl(resolvedTheme.logo); }
        catch { /* skip if fetch fails */ }
      }

      const doc = <ResumePdfDocument resume={resolvedResume} theme={resolvedTheme} lang={language} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = language === 'de'
        ? 'CV-AndreasMirbach-DE.pdf'
        : 'CV-AndreasMirbach-EN.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError(err instanceof Error ? err.message : 'PDF generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={generating}
        className="flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {generating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <FileDown size={14} />
        )}
        {generating ? 'Generating...' : 'Export PDF'}
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
