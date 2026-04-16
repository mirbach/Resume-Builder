import type { ProjectEntry } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: ProjectEntry[];
  onChange: (data: ProjectEntry[]) => void;
}

export default function ProjectsForm({ data, onChange }: Props) {
  const [newTechs, setNewTechs] = useState<Record<string, string>>({});
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  function addEntry() {
    onChange([
      ...data,
      { id: uuidv4(), name: '', description: { en: '', de: '' }, technologies: [] },
    ]);
  }

  function updateEntry(index: number, entry: ProjectEntry) {
    const updated = [...data];
    updated[index] = entry;
    onChange(updated);
  }

  function removeEntry(index: number) {
    onChange(data.filter((_, i) => i !== index));
  }

  function addTech(index: number) {
    const tech = newTechs[data[index].id]?.trim();
    if (!tech) return;
    const updated = [...data];
    updated[index] = { ...updated[index], technologies: [...updated[index].technologies, tech] };
    onChange(updated);
    setNewTechs({ ...newTechs, [data[index].id]: '' });
  }

  function removeTech(projIndex: number, techIndex: number) {
    const updated = [...data];
    updated[projIndex] = {
      ...updated[projIndex],
      technologies: updated[projIndex].technologies.filter((_, i) => i !== techIndex),
    };
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      {data.map((entry, index) => (
        <div key={entry.id} className="entry-card rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">{entry.name || 'New Project'}</span>
            <button onClick={() => removeEntry(index)} aria-label="Remove project" className="text-red-400 hover:text-red-600">
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
                placeholder="Project name"
                onChange={(e) => updateEntry(index, { ...entry, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Link (optional)</label>
              <input
                type="text"
                className={inputClasses}
                value={entry.link || ''}
                onChange={(e) =>
                  updateEntry(index, { ...entry, link: e.target.value || undefined })
                }
                placeholder="github.com/..."
              />
            </div>
          </div>
          <BilingualField
            label="Description"
            value={entry.description}
            onChange={(description) => updateEntry(index, { ...entry, description })}
            multiline
            rows={2}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {entry.technologies.map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/40 px-3 py-1 text-sm text-green-700 dark:text-green-300"
                >
                  {tech}
                  <button
                    onClick={() => removeTech(index, techIndex)}
                    aria-label="Remove technology"
                    className="text-green-400 hover:text-green-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={newTechs[entry.id] || ''}
                onChange={(e) => setNewTechs({ ...newTechs, [entry.id]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech(index))}
                placeholder="Type technology and press Enter"
              />
              <button
                onClick={() => addTech(index)}
                className="rounded-md bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
