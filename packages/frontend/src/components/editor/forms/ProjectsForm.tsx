import type { ProjectEntry, Achievement, EliteCategory, Language } from '../../../lib/types';
import BilingualField from '../BilingualField';
import CarReviewPanel from './CarReviewPanel';
import { Plus, Trash2, X, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: ProjectEntry[];
  onChange: (data: ProjectEntry[]) => void;
  lang?: Language;
}

const ELITE_CATEGORIES: { value: EliteCategory; label: string; color: string }[] = [
  { value: 'experience', label: 'Experience', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'leadership', label: 'Leadership', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'impact', label: 'Impact', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { value: 'transformation', label: 'Transformation', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { value: 'excellence', label: 'Excellence', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
];

function newAchievement(): Achievement {
  return { id: uuidv4(), challenge: { en: '', de: '' }, action: { en: '', de: '' }, result: { en: '', de: '' } };
}

export default function ProjectsForm({ data, onChange, lang = 'en' }: Props) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set(data.map((e) => e.id)));
  const [newTechs, setNewTechs] = useState<Record<string, string>>({});
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  function toggleEntry(id: string) {
    const next = new Set(expandedEntries);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedEntries(next);
  }

  function addEntry() {
    const entry: ProjectEntry = { id: uuidv4(), name: { en: '', de: '' }, description: { en: '', de: '' }, technologies: [], achievements: [] };
    setExpandedEntries((prev) => new Set(prev).add(entry.id));
    onChange([...data, entry]);
  }

  function updateEntry(index: number, entry: ProjectEntry) {
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
    updated[projIndex] = { ...updated[projIndex], technologies: updated[projIndex].technologies.filter((_, i) => i !== techIndex) };
    onChange(updated);
  }

  function updateAchievement(entryIndex: number, achIndex: number, ach: Achievement) {
    const updated = [...data];
    updated[entryIndex] = {
      ...updated[entryIndex],
      achievements: updated[entryIndex].achievements.map((a, i) => (i === achIndex ? ach : a)),
    };
    onChange(updated);
  }

  function addAchievement(entryIndex: number) {
    const updated = [...data];
    updated[entryIndex] = { ...updated[entryIndex], achievements: [...updated[entryIndex].achievements, newAchievement()] };
    onChange(updated);
  }

  function removeAchievement(entryIndex: number, achIndex: number) {
    const updated = [...data];
    updated[entryIndex] = { ...updated[entryIndex], achievements: updated[entryIndex].achievements.filter((_, i) => i !== achIndex) };
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center justify-between pt-4 bg-gray-50 dark:bg-gray-900 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">Projects</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      {data.map((entry, entryIndex) => (
        <div key={entry.id} className="entry-card rounded-lg border border-gray-200 bg-white">
          {/* Entry Header */}
          <div
            className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            onClick={() => toggleEntry(entry.id)}
          >
            <GripVertical size={16} className="text-gray-400 dark:text-gray-500" />
            {expandedEntries.has(entry.id) ? (
              <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
            )}
            <div className="flex-1">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {entry.name.en || entry.name.de || 'New Project'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); moveEntry(entryIndex, -1); }} className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200" title="Move up">↑</button>
              <button onClick={(e) => { e.stopPropagation(); moveEntry(entryIndex, 1); }} className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200" title="Move down">↓</button>
              <button onClick={(e) => { e.stopPropagation(); removeEntry(entryIndex); }} className="p-1 text-red-400 hover:text-red-600" title="Delete" aria-label="Delete project">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Entry Body */}
          {expandedEntries.has(entry.id) && (
            <div className="border-t border-gray-100 px-4 py-4 space-y-3">
              <BilingualField
                label="Project Name"
                value={entry.name}
                onChange={(name) => updateEntry(entryIndex, { ...entry, name })}
                placeholder={{ en: 'Project name', de: 'Projektname' }}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company (optional)</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={entry.company || ''}
                    placeholder="Client or employer"
                    onChange={(e) => updateEntry(entryIndex, { ...entry, company: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Link (optional)</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={entry.link || ''}
                    onChange={(e) => updateEntry(entryIndex, { ...entry, link: e.target.value || undefined })}
                    placeholder="github.com/..."
                  />
                </div>
              </div>

              <BilingualField
                label="Period (optional)"
                value={entry.period ?? { en: '', de: '' }}
                onChange={(period) => updateEntry(entryIndex, { ...entry, period: (period.en || period.de) ? period : undefined })}
                placeholder={{ en: '2022 – 2023', de: '2022 – 2023' }}
              />

              <BilingualField
                label="Description"
                value={entry.description}
                onChange={(description) => updateEntry(entryIndex, { ...entry, description })}
                multiline
                rows={2}
              />

              {/* Technologies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {entry.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/40 px-3 py-1 text-sm text-green-700 dark:text-green-300"
                    >
                      {tech}
                      <button onClick={() => removeTech(entryIndex, techIndex)} aria-label="Remove technology" className="text-green-400 hover:text-green-600">
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
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech(entryIndex))}
                    placeholder="Type technology and press Enter"
                  />
                  <button
                    onClick={() => addTech(entryIndex)}
                    className="rounded-md bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Achievements (CAR Framework) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Achievements (CAR Framework)</label>
                  <button
                    onClick={() => addAchievement(entryIndex)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus size={14} /> Add Achievement
                  </button>
                </div>

                {entry.achievements.map((ach, achIndex) => (
                  <div
                    key={ach.id}
                    className="rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-3 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">Achievement {achIndex + 1}</span>
                        <select
                          aria-label="ELITE category"
                          className="rounded border border-gray-300 px-2 py-0.5 text-xs"
                          value={ach.eliteCategory || ''}
                          onChange={(e) =>
                            updateAchievement(entryIndex, achIndex, {
                              ...ach,
                              eliteCategory: (e.target.value as EliteCategory) || undefined,
                            })
                          }
                        >
                          <option value="">No ELITE tag</option>
                          {ELITE_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                        {ach.eliteCategory && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ELITE_CATEGORIES.find((c) => c.value === ach.eliteCategory)?.color}`}>
                            {ach.eliteCategory.charAt(0).toUpperCase() + ach.eliteCategory.slice(1)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeAchievement(entryIndex, achIndex)}
                        aria-label="Remove achievement"
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <BilingualField
                      label="Challenge"
                      value={ach.challenge}
                      onChange={(challenge) => updateAchievement(entryIndex, achIndex, { ...ach, challenge })}
                      multiline
                      rows={4}
                      placeholder={{ en: 'What was the problem or challenge?', de: 'Was war das Problem oder die Herausforderung?' }}
                    />
                    <BilingualField
                      label="Action"
                      value={ach.action}
                      onChange={(action) => updateAchievement(entryIndex, achIndex, { ...ach, action })}
                      multiline
                      rows={4}
                      placeholder={{ en: 'What did you do to address it?', de: 'Was haben Sie unternommen?' }}
                    />
                    <BilingualField
                      label="Result"
                      value={ach.result}
                      onChange={(result) => updateAchievement(entryIndex, achIndex, { ...ach, result })}
                      multiline
                      rows={4}
                      placeholder={{ en: 'What was the measurable outcome?', de: 'Was war das messbare Ergebnis?' }}
                    />
                    <CarReviewPanel
                      challenge={ach.challenge[lang]}
                      action={ach.action[lang]}
                      result={ach.result[lang]}
                      lang={lang}
                      onApply={(field, text) =>
                        updateAchievement(entryIndex, achIndex, {
                          ...ach,
                          [field]: { ...ach[field], [lang]: text },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
