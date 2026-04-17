import { useCallback, useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import type { BilingualText } from '../../lib/types';
import { translateText } from '../../lib/api';

interface BilingualFieldProps {
  label: string;
  value: BilingualText;
  onChange: (value: BilingualText) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: { en?: string; de?: string };
}

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

export default function BilingualField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
}: BilingualFieldProps) {
  const [translating, setTranslating] = useState<'en-de' | 'de-en' | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none overflow-hidden';

  const refEn = useCallback((el: HTMLTextAreaElement | null) => autoResize(el), [value.en]);
  const refDe = useCallback((el: HTMLTextAreaElement | null) => autoResize(el), [value.de]);

  async function handleTranslate(from: 'en' | 'de', to: 'en' | 'de') {
    const text = value[from];
    if (!text.trim()) return;
    const key = `${from}-${to}` as 'en-de' | 'de-en';
    setTranslating(key);
    setTranslateError(null);
    try {
      const translated = await translateText(text, from, to);
      onChange({ ...value, [to]: translated });
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Translation failed');
      setTimeout(() => setTranslateError(null), 4000);
    } finally {
      setTranslating(null);
    }
  }

  const btnBase =
    'flex items-center justify-center rounded p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2">
        {/* EN column */}
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">EN</span>
          {multiline ? (
            <textarea
              ref={refEn}
              className={inputClasses}
              value={value.en}
              onChange={(e) => { onChange({ ...value, en: e.target.value }); autoResize(e.target); }}
              rows={rows}
              placeholder={placeholder?.en}
            />
          ) : (
            <input
              type="text"
              className={inputClasses.replace('resize-none overflow-hidden', '')}
              value={value.en}
              onChange={(e) => onChange({ ...value, en: e.target.value })}
              placeholder={placeholder?.en}
            />
          )}
        </div>

        {/* Translate buttons */}
        <div className="flex flex-col items-center justify-start gap-1 pt-5">
          <button
            type="button"
            aria-label="Translate EN to DE"
            title="Translate EN → DE"
            className={btnBase}
            disabled={translating !== null || !value.en.trim()}
            onClick={() => handleTranslate('en', 'de')}
          >
            {translating === 'en-de'
              ? <Loader2 size={12} className="animate-spin" />
              : <ArrowRight size={12} />}
          </button>
          <button
            type="button"
            aria-label="Translate DE to EN"
            title="Translate DE → EN"
            className={btnBase}
            disabled={translating !== null || !value.de.trim()}
            onClick={() => handleTranslate('de', 'en')}
          >
            {translating === 'de-en'
              ? <Loader2 size={12} className="animate-spin" />
              : <ArrowLeft size={12} />}
          </button>
        </div>

        {/* DE column */}
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">DE</span>
          {multiline ? (
            <textarea
              ref={refDe}
              className={inputClasses}
              value={value.de}
              onChange={(e) => { onChange({ ...value, de: e.target.value }); autoResize(e.target); }}
              rows={rows}
              placeholder={placeholder?.de}
            />
          ) : (
            <input
              type="text"
              className={inputClasses.replace('resize-none overflow-hidden', '')}
              value={value.de}
              onChange={(e) => onChange({ ...value, de: e.target.value })}
              placeholder={placeholder?.de}
            />
          )}
        </div>
      </div>
      {translateError && (
        <p className="text-xs text-red-500">{translateError}</p>
      )}
    </div>
  );
}
