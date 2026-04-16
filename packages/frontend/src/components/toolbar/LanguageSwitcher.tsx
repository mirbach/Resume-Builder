import type { Language } from '../../lib/types';

interface Props {
  language: Language;
  onChange: (lang: Language) => void;
}

export default function LanguageSwitcher({ language, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
      <button
        onClick={() => onChange('en')}
        className={`px-3 py-1.5 font-medium transition-colors ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onChange('de')}
        className={`px-3 py-1.5 font-medium transition-colors ${
          language === 'de'
            ? 'bg-blue-600 text-white'
            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
        }`}
      >
        DE
      </button>
    </div>
  );
}
