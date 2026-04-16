import { useCallback } from 'react';
import type { BilingualText } from '../../lib/types';

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
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none overflow-hidden';

  const refEn = useCallback((el: HTMLTextAreaElement | null) => autoResize(el), [value.en]);
  const refDe = useCallback((el: HTMLTextAreaElement | null) => autoResize(el), [value.de]);

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
