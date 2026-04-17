import { useState, useEffect } from 'react';
import type { ThemeListItem } from '../../lib/types';
import { getThemes } from '../../lib/api';
import { Palette } from 'lucide-react';

interface Props {
  value: string;
  onChange: (themeName: string) => void;
}

export default function ThemeSelector({ value, onChange }: Props) {
  const [themes, setThemes] = useState<ThemeListItem[]>([]);

  useEffect(() => {
    getThemes().then((list) => setThemes(list));
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <Palette size={16} className="text-gray-500" />
      <select
        aria-label="Resume theme"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      >
        {themes.map((t) => (
          <option key={t.filename} value={t.filename}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
