import type { CertificationEntry } from '../../../lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: CertificationEntry[];
  onChange: (data: CertificationEntry[]) => void;
}

export default function CertificationsForm({ data, onChange }: Props) {
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  function addEntry() {
    onChange([...data, { id: uuidv4(), name: '', issuer: '', date: '', url: '' }]);
  }

  function updateEntry(index: number, entry: CertificationEntry) {
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
        <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Certification
        </button>
      </div>

      {data.map((entry, index) => (
        <div key={entry.id} className="entry-card rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">{entry.name || 'New Entry'}</span>
            <button onClick={() => removeEntry(index)} aria-label="Remove certification" className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.name}
                onChange={(e) => updateEntry(index, { ...entry, name: e.target.value })}
                placeholder="Azure Solutions Architect"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Issuer</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.issuer}
                onChange={(e) => updateEntry(index, { ...entry, issuer: e.target.value })}
                placeholder="Microsoft"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.date}
                onChange={(e) => updateEntry(index, { ...entry, date: e.target.value })}
                placeholder="2023"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Credential URL</label>
            <input
              type="url"
              className={inputClasses}
              value={entry.url ?? ''}
              onChange={(e) => updateEntry(index, { ...entry, url: e.target.value })}
              placeholder="https://learn.microsoft.com/credentials/..."
            />
          </div>
        </div>
      ))}
    </div>
  );
}
