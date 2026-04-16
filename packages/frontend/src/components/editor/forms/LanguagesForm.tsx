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
            <button onClick={() => removeEntry(index)} aria-label="Remove language" className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
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
