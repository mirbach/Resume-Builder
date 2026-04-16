import type { ExperienceEntry, Achievement, EliteCategory } from '../../../lib/types';
import BilingualField from '../BilingualField';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  data: ExperienceEntry[];
  onChange: (data: ExperienceEntry[]) => void;
}

const ELITE_CATEGORIES: { value: EliteCategory; label: string; color: string }[] = [
  { value: 'experience', label: 'Experience', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'leadership', label: 'Leadership', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  { value: 'impact', label: 'Impact', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  { value: 'transformation', label: 'Transformation', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  { value: 'excellence', label: 'Excellence', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
];

function newAchievement(): Achievement {
  return {
    id: uuidv4(),
    challenge: { en: '', de: '' },
    action: { en: '', de: '' },
    result: { en: '', de: '' },
  };
}

function newExperience(): ExperienceEntry {
  return {
    id: uuidv4(),
    company: '',
    role: { en: '', de: '' },
    period: '',
    location: { en: '', de: '' },
    achievements: [newAchievement()],
  };
}

export default function ExperienceForm({ data, onChange }: Props) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set(data.map((e) => e.id))
  );
  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  function toggleEntry(id: string) {
    const next = new Set(expandedEntries);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedEntries(next);
  }

  function updateEntry(index: number, entry: ExperienceEntry) {
    const updated = [...data];
    updated[index] = entry;
    onChange(updated);
  }

  function addEntry() {
    const entry = newExperience();
    setExpandedEntries((prev) => new Set(prev).add(entry.id));
    onChange([...data, entry]);
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
    updated[entryIndex] = {
      ...updated[entryIndex],
      achievements: [...updated[entryIndex].achievements, newAchievement()],
    };
    onChange(updated);
  }

  function removeAchievement(entryIndex: number, achIndex: number) {
    const updated = [...data];
    updated[entryIndex] = {
      ...updated[entryIndex],
      achievements: updated[entryIndex].achievements.filter((_, i) => i !== achIndex),
    };
    onChange(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Add Position
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
                {entry.role.en || 'New Position'}
              </span>
              {entry.company && (
                <span className="text-gray-500 dark:text-gray-300 ml-2">at {entry.company}</span>
              )}
              {entry.period && (
                <span className="text-gray-400 dark:text-gray-400 ml-2 text-sm">{entry.period}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); moveEntry(entryIndex, -1); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); moveEntry(entryIndex, 1); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeEntry(entryIndex); }}
                className="p-1 text-red-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Entry Body */}
          {expandedEntries.has(entry.id) && (
            <div className="border-t border-gray-100 px-4 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={entry.company}
                    onChange={(e) => updateEntry(entryIndex, { ...entry, company: e.target.value })}
                    placeholder="TechCorp GmbH"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Period</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={entry.period}
                    onChange={(e) => updateEntry(entryIndex, { ...entry, period: e.target.value })}
                    placeholder="2020 - Present"
                  />
                </div>
              </div>

              <BilingualField
                label="Role"
                value={entry.role}
                onChange={(role) => updateEntry(entryIndex, { ...entry, role })}
                placeholder={{ en: 'Senior Software Engineer', de: 'Senior Softwareentwickler' }}
              />

              <BilingualField
                label="Location"
                value={entry.location}
                onChange={(location) => updateEntry(entryIndex, { ...entry, location })}
                placeholder={{ en: 'Munich, Germany', de: 'München, Deutschland' }}
              />

              {/* Achievements (CAR Framework) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Achievements (CAR Framework)
                  </label>
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
                        <span className="text-xs font-semibold text-gray-500">
                          Achievement {achIndex + 1}
                        </span>
                        {/* ELITE category selector */}
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
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        {ach.eliteCategory && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              ELITE_CATEGORIES.find((c) => c.value === ach.eliteCategory)?.color
                            }`}
                          >
                            {ach.eliteCategory.charAt(0).toUpperCase() +
                              ach.eliteCategory.slice(1)}
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
                      onChange={(challenge) =>
                        updateAchievement(entryIndex, achIndex, { ...ach, challenge })
                      }
                      multiline
                      rows={4}
                      placeholder={{
                        en: 'What was the problem or challenge?',
                        de: 'Was war das Problem oder die Herausforderung?',
                      }}
                    />
                    <BilingualField
                      label="Action"
                      value={ach.action}
                      onChange={(action) =>
                        updateAchievement(entryIndex, achIndex, { ...ach, action })
                      }
                      multiline
                      rows={4}
                      placeholder={{
                        en: 'What did you do to address it?',
                        de: 'Was haben Sie unternommen?',
                      }}
                    />
                    <BilingualField
                      label="Result"
                      value={ach.result}
                      onChange={(result) =>
                        updateAchievement(entryIndex, achIndex, { ...ach, result })
                      }
                      multiline
                      rows={4}
                      placeholder={{
                        en: 'What was the measurable outcome?',
                        de: 'Was war das messbare Ergebnis?',
                      }}
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
