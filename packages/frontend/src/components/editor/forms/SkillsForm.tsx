import type { SkillCategory, BilingualText } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: SkillCategory[];
  onChange: (data: SkillCategory[]) => void;
}

interface DragSkill {
  catIndex: number;
  skillIndex: number;
}

export default function SkillsForm({ data, onChange }: Props) {
  const [newSkills, setNewSkills] = useState<Record<string, BilingualText>>({});
  const [dragging, setDragging] = useState<DragSkill | null>(null);
  const [dragLang, setDragLang] = useState<'en' | 'de' | null>(null);
  const [dragOverCat, setDragOverCat] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<DragSkill | null>(null);
  const [isCopyMode, setIsCopyMode] = useState(false);

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

  function moveCategory(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= data.length) return;
    const updated = [...data];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  }

  function addSkill(index: number) {
    const entry = newSkills[data[index].id] ?? { en: '', de: '' };
    if (!entry.en.trim() && !entry.de.trim()) return;
    const updated = [...data];
    updated[index] = { ...updated[index], items: [...updated[index].items, { en: entry.en.trim(), de: entry.de.trim() }] };
    onChange(updated);
    setNewSkills({ ...newSkills, [data[index].id]: { en: '', de: '' } });
  }

  function removeSkill(catIndex: number, skillIndex: number) {
    const updated = [...data];
    updated[catIndex] = {
      ...updated[catIndex],
      items: updated[catIndex].items.filter((_, i) => i !== skillIndex),
    };
    onChange(updated);
  }

  function handleSkillDragStart(catIndex: number, skillIndex: number, lang: 'en' | 'de') {
    setDragging({ catIndex, skillIndex });
    setDragLang(lang);
  }

  function handleSkillDragEnd() {
    setDragging(null);
    setDragLang(null);
    setDragOverCat(null);
    setDragOverItem(null);
    setIsCopyMode(false);
  }

  function handleCategoryDragOver(e: React.DragEvent, catIndex: number) {
    if (!dragging) return;
    e.preventDefault();
    setDragOverCat(catIndex);
  }

  function dropSkillAt(targetCatIndex: number, targetSkillIndex: number) {
    if (!dragging) return;
    const updated = data.map((cat) => ({ ...cat, items: [...cat.items] }));
    const skill = updated[dragging.catIndex].items[dragging.skillIndex];
    updated[dragging.catIndex].items.splice(dragging.skillIndex, 1);
    let insertAt = targetSkillIndex;
    if (dragging.catIndex === targetCatIndex && dragging.skillIndex < targetSkillIndex) {
      insertAt--;
    }
    updated[targetCatIndex].items.splice(insertAt, 0, skill);
    onChange(updated);
    setDragging(null);
    setDragOverCat(null);
    setDragOverItem(null);
  }

  function handleChipDragOver(e: React.DragEvent, catIndex: number, skillIndex: number, targetLang: 'en' | 'de') {
    if (!dragging) return;
    e.preventDefault();
    e.stopPropagation();
    setDragOverItem({ catIndex, skillIndex });
    setDragOverCat(null);
    setIsCopyMode(e.ctrlKey && dragLang !== null && dragLang !== targetLang);
  }

  function copySkillToLang(sourceItem: BilingualText | string, sourceLang: 'en' | 'de', targetCatIndex: number, targetSkillIndex: number) {
    const sourceText = typeof sourceItem === 'string' ? sourceItem : sourceItem[sourceLang];
    if (!sourceText) return;
    const otherLang = sourceLang === 'en' ? 'de' : 'en';
    const newItem: BilingualText = { en: '', de: '', [otherLang]: sourceText };
    const updated = data.map((cat) => ({ ...cat, items: [...cat.items] }));
    updated[targetCatIndex].items.splice(targetSkillIndex, 0, newItem);
    onChange(updated);
  }

  function handleChipDrop(e: React.DragEvent, targetCatIndex: number, targetSkillIndex: number, targetLang: 'en' | 'de') {
    e.preventDefault();
    e.stopPropagation();
    if (!dragging) return;

    // Ctrl+drop across language columns: insert a new skill with the source text in the target language
    if (e.ctrlKey && dragLang !== null && dragLang !== targetLang) {
      const sourceItem = data[dragging.catIndex].items[dragging.skillIndex];
      copySkillToLang(sourceItem, dragLang, targetCatIndex, targetSkillIndex);
      setDragging(null);
      setDragLang(null);
      setDragOverItem(null);
      setIsCopyMode(false);
      return;
    }

    if (dragging.catIndex === targetCatIndex && dragging.skillIndex === targetSkillIndex) {
      setDragging(null);
      setDragOverItem(null);
      return;
    }
    dropSkillAt(targetCatIndex, targetSkillIndex);
  }

  function handleCategoryDrop(e: React.DragEvent, targetCatIndex: number) {
    e.preventDefault();
    if (!dragging) {
      setDragOverCat(null);
      return;
    }

    // Ctrl+drop onto a different-language category zone: insert copy
    if (e.ctrlKey && dragLang !== null) {
      const sourceItem = data[dragging.catIndex].items[dragging.skillIndex];
      copySkillToLang(sourceItem, dragLang, targetCatIndex, data[targetCatIndex].items.length);
      setDragging(null);
      setDragLang(null);
      setDragOverCat(null);
      setIsCopyMode(false);
      return;
    }

    if (dragging.catIndex === targetCatIndex) {
      setDragging(null);
      setDragOverCat(null);
      return;
    }
    dropSkillAt(targetCatIndex, data[targetCatIndex].items.length);
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between pt-4 bg-gray-50 dark:bg-gray-900 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
        <button
          onClick={addCategory}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {data.map((cat, catIndex) => (
        <div
          key={cat.id}
          className={`entry-card rounded-lg border bg-white p-4 space-y-3 transition-colors ${
            dragOverCat === catIndex && dragging?.catIndex !== catIndex
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200'
          }`}
          onDragOver={(e) => handleCategoryDragOver(e, catIndex)}
          onDragLeave={() => setDragOverCat(null)}
          onDrop={(e) => handleCategoryDrop(e, catIndex)}
        >
          <div className="flex items-center justify-between">
            <span className="entry-label text-sm font-medium text-gray-500">
              {cat.category.en || 'New Category'}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveCategory(catIndex, -1)} aria-label="Move up" className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200">↑</button>
              <button onClick={() => moveCategory(catIndex, 1)} aria-label="Move down" className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200">↓</button>
              <button onClick={() => removeCategory(catIndex)} aria-label="Remove category" className="p-1 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
          </div>

          <BilingualField
            label="Category Name"
            value={cat.category}
            onChange={(category) => updateCategory(catIndex, { ...cat, category })}
            placeholder={{ en: 'Programming Languages', de: 'Programmiersprachen' }}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {(['en', 'de'] as const).map((lang) => (
                <div key={lang} className="rounded-md border border-gray-100 bg-gray-50 dark:bg-gray-800/40 p-2 min-h-[3rem]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="text-xs font-semibold text-gray-400 uppercase">{lang}</div>
                    {dragging && dragLang !== null && dragLang !== lang && (
                      <div className="text-xs text-gray-400 italic">hold Ctrl to copy</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.length === 0 && dragOverCat === catIndex && dragging?.catIndex !== catIndex && lang === 'en' && (
                      <span className="text-xs text-blue-500 italic">Drop here</span>
                    )}
                    {cat.items.map((item, skillIndex) => {
                      const text = typeof item === 'string' ? item : item[lang];
                      if (!text) return null;
                      const isBeingDragged = dragging?.catIndex === catIndex && dragging?.skillIndex === skillIndex;
                      const isDropTarget = dragOverItem?.catIndex === catIndex && dragOverItem?.skillIndex === skillIndex;
                      return (
                        <span
                          key={skillIndex}
                          draggable
                          onDragStart={() => handleSkillDragStart(catIndex, skillIndex, lang)}
                          onDragEnd={handleSkillDragEnd}
                          onDragOver={(e) => handleChipDragOver(e, catIndex, skillIndex, lang)}
                          onDragLeave={() => { setDragOverItem(null); setIsCopyMode(false); }}
                          onDrop={(e) => handleChipDrop(e, catIndex, skillIndex, lang)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm cursor-grab active:cursor-grabbing select-none transition-all ${
                            isBeingDragged
                              ? 'opacity-40 bg-blue-100 dark:bg-blue-800/40 text-blue-400'
                              : isDropTarget && isCopyMode
                              ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-2 ring-green-400 ring-offset-1'
                              : isDropTarget
                              ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400 ring-offset-1'
                              : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          <span>{text}</span>
                          <button
                            onClick={() => removeSkill(catIndex, skillIndex)}
                            aria-label="Remove skill"
                            className="text-blue-400 hover:text-blue-600 ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                value={newSkills[cat.id]?.en ?? ''}
                onChange={(e) => setNewSkills({ ...newSkills, [cat.id]: { ...(newSkills[cat.id] ?? { en: '', de: '' }), en: e.target.value } })}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(catIndex))}
                placeholder="EN: e.g. TypeScript"
                aria-label="New skill (English)"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={newSkills[cat.id]?.de ?? ''}
                  onChange={(e) => setNewSkills({ ...newSkills, [cat.id]: { ...(newSkills[cat.id] ?? { en: '', de: '' }), de: e.target.value } })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(catIndex))}
                  placeholder="DE: z.B. TypeScript"
                  aria-label="New skill (German)"
                />
                <button
                  onClick={() => addSkill(catIndex)}
                  className="rounded-md bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
