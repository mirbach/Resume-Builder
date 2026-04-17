import type { LanguageEntry } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: LanguageEntry[];
  onChange: (data: LanguageEntry[]) => void;
}

export default function LanguagesForm({ data, onChange }: Props) {
  function addEntry() {
    onChange([
      ...data,
      { id: uuidv4(), language: { en: '', de: '' }, level: { en: '', de: '' } },
    ]);
  }

  function updateEntry(index: number, entry: LanguageEntry) {
    const updated = [...data];
    updated[index] = entry;
    onChange(updated);
  }

  function removeEntry(index: number) {
    onChange(data.filter((_, i) => i !== index));
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.length) return;
    const updated = [...data];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Languages</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Language
        </button>
      </div>

      {data.map((entry, index) => (
        <div key={entry.id} className="entry-card rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">
              {entry.language.en || 'New Language'}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveEntry(index, -1)} aria-label="Move up" className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200">↑</button>
              <button onClick={() => moveEntry(index, 1)} aria-label="Move down" className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200">↓</button>
              <button onClick={() => removeEntry(index)} aria-label="Remove language" className="p-1 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          </div>
          <BilingualField
            label="Language"
            value={entry.language}
            onChange={(language) => updateEntry(index, { ...entry, language })}
            placeholder={{ en: 'German', de: 'Deutsch' }}
          />
          <BilingualField
            label="Level"
            value={entry.level}
            onChange={(level) => updateEntry(index, { ...entry, level })}
            placeholder={{ en: 'Native', de: 'Muttersprache' }}
          />
        </div>
      ))}
    </div>
  );
}
