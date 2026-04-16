import type { ReferenceEntry } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: ReferenceEntry[];
  onChange: (data: ReferenceEntry[]) => void;
}

export default function ReferencesForm({ data, onChange }: Props) {
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  function addEntry() {
    onChange([
      ...data,
      {
        id: uuidv4(),
        name: '',
        title: { en: '', de: '' },
        company: '',
      },
    ]);
  }

  function updateEntry(index: number, entry: ReferenceEntry) {
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
        <h3 className="text-lg font-semibold text-gray-900">References</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Reference
        </button>
      </div>

      {data.map((entry, index) => (
        <div key={entry.id} className="entry-card rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">{entry.name || 'New Reference'}</span>
            <button onClick={() => removeEntry(index)} aria-label="Remove reference" className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.name}
                onChange={(e) => updateEntry(index, { ...entry, name: e.target.value })}
                placeholder="Dr. Anna Schmidt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.company}
                placeholder="Acme Corp"
                onChange={(e) => updateEntry(index, { ...entry, company: e.target.value })}
              />
            </div>
          </div>
          <BilingualField
            label="Title / Position"
            value={entry.title}
            onChange={(title) => updateEntry(index, { ...entry, title })}
            placeholder={{ en: 'CTO at Company', de: 'CTO bei Firma' }}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact (optional)</label>
            <input
              type="text"
              className={inputClasses}
              value={entry.contact || ''}
              onChange={(e) =>
                updateEntry(index, { ...entry, contact: e.target.value || undefined })
              }
              placeholder="Available upon request"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
