import type { ProductEntry, BilingualText } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: ProductEntry[];
  onChange: (data: ProductEntry[]) => void;
}

export default function ProductsForm({ data, onChange }: Props) {
  function addEntry() {
    onChange([
      ...data,
      {
        id: uuidv4(),
        name: '',
        description: { en: '', de: '' },
        role: { en: '', de: '' },
        highlights: [],
      },
    ]);
  }

  function updateEntry(index: number, entry: ProductEntry) {
    const updated = [...data];
    updated[index] = entry;
    onChange(updated);
  }

  function removeEntry(index: number) {
    onChange(data.filter((_, i) => i !== index));
  }

  function addHighlight(index: number) {
    const updated = [...data];
    updated[index] = {
      ...updated[index],
      highlights: [...updated[index].highlights, { en: '', de: '' }],
    };
    onChange(updated);
  }

  function updateHighlight(entryIndex: number, hlIndex: number, value: BilingualText) {
    const updated = [...data];
    updated[entryIndex] = {
      ...updated[entryIndex],
      highlights: updated[entryIndex].highlights.map((h, i) => (i === hlIndex ? value : h)),
    };
    onChange(updated);
  }

  function removeHighlight(entryIndex: number, hlIndex: number) {
    const updated = [...data];
    updated[entryIndex] = {
      ...updated[entryIndex],
      highlights: updated[entryIndex].highlights.filter((_, i) => i !== hlIndex),
    };
    onChange(updated);
  }

  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Products</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {data.map((entry, index) => (
        <div key={entry.id} className="entry-card rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">{entry.name || 'New Product'}</span>
            <button onClick={() => removeEntry(index)} aria-label="Remove product" className="text-red-400 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              className={inputClasses}
              value={entry.name}
              placeholder="Product name"
              onChange={(e) => updateEntry(index, { ...entry, name: e.target.value })}
            />
          </div>
          <BilingualField
            label="Description"
            value={entry.description}
            onChange={(description) => updateEntry(index, { ...entry, description })}
            multiline
            rows={2}
          />
          <BilingualField
            label="Your Role"
            value={entry.role}
            onChange={(role) => updateEntry(index, { ...entry, role })}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Highlights</label>
              <button
                onClick={() => addHighlight(index)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus size={14} /> Add Highlight
              </button>
            </div>
            {entry.highlights.map((hl, hlIndex) => (
              <div key={hlIndex} className="flex items-start gap-2">
                <div className="flex-1">
                  <BilingualField
                    label={`Highlight ${hlIndex + 1}`}
                    value={hl}
                    onChange={(value) => updateHighlight(index, hlIndex, value)}
                  />
                </div>
                <button
                  onClick={() => removeHighlight(index, hlIndex)}
                  aria-label="Remove highlight"
                  className="mt-6 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
