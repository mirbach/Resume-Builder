import type { EducationEntry } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: EducationEntry[];
  onChange: (data: EducationEntry[]) => void;
}

export default function EducationForm({ data, onChange }: Props) {
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  function addEntry() {
    onChange([
      ...data,
      {
        id: uuidv4(),
        institution: '',
        degree: { en: '', de: '' },
        period: '',
      },
    ]);
  }

  function updateEntry(index: number, entry: EducationEntry) {
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
        <h3 className="text-lg font-semibold text-gray-900">Education</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Education
        </button>
      </div>

      {data.map((entry, index) => (
        <div key={entry.id} className="entry-card rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">
            </span>
            <button onClick={() => removeEntry(index)} aria-label="Remove entry" className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Institution</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.institution}
                onChange={(e) => updateEntry(index, { ...entry, institution: e.target.value })}
                placeholder="Technische Universität München"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Period</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.period}
                onChange={(e) => updateEntry(index, { ...entry, period: e.target.value })}
                placeholder="2013 - 2015"
              />
            </div>
          </div>

          <BilingualField
            label="Degree"
            value={entry.degree}
            onChange={(degree) => updateEntry(index, { ...entry, degree })}
            placeholder={{ en: 'M.Sc. Computer Science', de: 'M.Sc. Informatik' }}
          />

          <BilingualField
            label="Details (optional)"
            value={entry.details || { en: '', de: '' }}
            onChange={(details) =>
              updateEntry(index, {
                ...entry,
                details: details.en || details.de ? details : undefined,
              })
            }
            multiline
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}
