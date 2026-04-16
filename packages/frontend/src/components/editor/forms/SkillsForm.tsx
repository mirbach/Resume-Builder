import type { SkillCategory } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: SkillCategory[];
  onChange: (data: SkillCategory[]) => void;
}

export default function SkillsForm({ data, onChange }: Props) {
  const [newSkills, setNewSkills] = useState<Record<string, string>>({});

  function addCategory() {
    onChange([...data, { id: uuidv4(), category: { en: '', de: '' }, items: [] }]);
  }

  function updateCategory(index: number, cat: SkillCategory) {
    const updated = [...data];
    updated[index] = cat;
    onChange(updated);
  }

  function removeCategory(index: number) {
    onChange(data.filter((_, i) => i !== index));
  }

  function addSkill(index: number) {
    const skill = newSkills[data[index].id]?.trim();
    if (!skill) return;
    const updated = [...data];
    updated[index] = { ...updated[index], items: [...updated[index].items, skill] };
    onChange(updated);
    setNewSkills({ ...newSkills, [data[index].id]: '' });
  }

  function removeSkill(catIndex: number, skillIndex: number) {
    const updated = [...data];
    updated[catIndex] = {
      ...updated[catIndex],
      items: updated[catIndex].items.filter((_, i) => i !== skillIndex),
    };
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
        <button
          onClick={addCategory}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {data.map((cat, catIndex) => (
        <div key={cat.id} className="entry-card rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">
              {cat.category.en || 'New Category'}
            </span>
            <button
              onClick={() => removeCategory(catIndex)}
              aria-label="Remove category"
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <BilingualField
            label="Category Name"
            value={cat.category}
            onChange={(category) => updateCategory(catIndex, { ...cat, category })}
            placeholder={{ en: 'Programming Languages', de: 'Programmiersprachen' }}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {cat.items.map((item, skillIndex) => (
                <span
                  key={skillIndex}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/40 px-3 py-1 text-sm text-blue-700 dark:text-blue-300"
                >
                  {item}
                  <button
                    onClick={() => removeSkill(catIndex, skillIndex)}
                    aria-label="Remove skill"
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={newSkills[cat.id] || ''}
                onChange={(e) => setNewSkills({ ...newSkills, [cat.id]: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(catIndex))}
                placeholder="Type skill and press Enter"
              />
              <button
                onClick={() => addSkill(catIndex)}
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
