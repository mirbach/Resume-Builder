import { useState, useEffect, useRef } from 'react';
import type { ResumeTheme, ThemeColors, ThemeFonts, ThemeLayout, LayoutStyle, HeaderStyle, ResumeSection, PageMargins } from '../../../lib/types';
import { getTheme, saveTheme, createTheme, deleteTheme, getThemes, uploadFile } from '../../../lib/api';
import type { ThemeListItem } from '../../../lib/types';
import { Save, Plus, Trash2, GripVertical, Loader2, Upload, X } from 'lucide-react';

interface Props {
  currentTheme: string;
  onThemeChange: (name: string) => void;
  onClose: () => void;
}

const ALL_SECTIONS: ResumeSection[] = [
  'personal', 'summary', 'experience', 'education', 'skills',
  'certifications', 'languages', 'projects', 'products', 'references',
];

const DEFAULT_THEME: ResumeTheme = {
  name: '',
  colors: {
    primary: '#2563eb',
    secondary: '#6b7280',
    accent: '#059669',
    text: '#1f2937',
    background: '#ffffff',
    heading: '#111827',
  },
  fonts: { heading: 'Inter', body: 'Inter', size: 'medium' },
  layout: {
    style: 'single-column',
    headerStyle: 'full-width',
    sectionOrder: [...ALL_SECTIONS],
    showPhoto: true,
    pageMargins: { top: 40, right: 40, bottom: 40, left: 40 },
  },
};

export default function ThemeEditor({ currentTheme, onThemeChange, onClose }: Props) {
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [theme, setTheme] = useState<ResumeTheme>(DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const inputClasses = 'w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  useEffect(() => {
    getThemes().then(setThemes);
  }, []);

  useEffect(() => {
    getTheme(selectedTheme).then(setTheme).catch(console.error);
  }, [selectedTheme]);

  function updateColors(partial: Partial<ThemeColors>) {
    setTheme({ ...theme, colors: { ...theme.colors, ...partial } });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const { path } = await uploadFile(file, 'logo');
      setTheme({ ...theme, logo: path });
    } catch (err) {
      console.error(err);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  function updateFonts(partial: Partial<ThemeFonts>) {
    setTheme({ ...theme, fonts: { ...theme.fonts, ...partial } });
  }

  function updateLayout(partial: Partial<ThemeLayout>) {
    setTheme({ ...theme, layout: { ...theme.layout, ...partial } });
  }

  function updateMargins(partial: Partial<PageMargins>) {
    setTheme({ ...theme, layout: { ...theme.layout, pageMargins: { ...theme.layout.pageMargins, ...partial } } });
  }

  function moveSectionUp(idx: number) {
    if (idx === 0) return;
    const order = [...theme.layout.sectionOrder];
    [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
    updateLayout({ sectionOrder: order });
  }

  function moveSectionDown(idx: number) {
    if (idx === theme.layout.sectionOrder.length - 1) return;
    const order = [...theme.layout.sectionOrder];
    [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
    updateLayout({ sectionOrder: order });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveTheme(selectedTheme, theme);
      onThemeChange(selectedTheme);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    const newTheme = { ...theme, name: newName.trim() };
    try {
      await createTheme(newTheme);
      const list = await getThemes();
      setThemes(list);
      setSelectedTheme(newName.trim());
      setShowCreate(false);
      setNewName('');
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete() {
    if (selectedTheme === 'default') return;
    try {
      await deleteTheme(selectedTheme);
      const list = await getThemes();
      setThemes(list);
      setSelectedTheme('default');
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-bold">Theme Editor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Theme selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className={inputClasses + ' max-w-xs'}
            >
              {themes.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
            <button onClick={() => setShowCreate(true)} className="text-blue-600 hover:text-blue-700">
              <Plus size={18} />
            </button>
            {selectedTheme !== 'default' && (
              <button onClick={handleDelete} className="text-red-400 hover:text-red-600">
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {showCreate && (
            <div className="flex items-center gap-2">
              <input
                className={inputClasses + ' max-w-xs'}
                placeholder="New theme name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button onClick={handleCreate} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
                Create
              </button>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 text-sm">
                Cancel
              </button>
            </div>
          )}

          {/* Company Branding */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Company Branding</legend>
            <p className="text-xs text-gray-500 mb-3">
              Appears top-right on the resume — ideal for consulting company identity.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                <input
                  className={inputClasses}
                  value={theme.companyName || ''}
                  onChange={(e) => setTheme({ ...theme, companyName: e.target.value || undefined })}
                  placeholder="Acme Consulting GmbH"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Company Logo</label>
                <div className="flex items-center gap-3">
                  {theme.logo ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={theme.logo}
                        alt="Company logo"
                        className="h-10 w-auto max-w-[120px] object-contain rounded border border-gray-200 p-1"
                      />
                      <button
                        onClick={() => setTheme({ ...theme, logo: undefined })}
                        className="text-red-400 hover:text-red-600"
                        title="Remove logo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No logo uploaded</span>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={logoUploading}
                    className="flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {logoUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {logoUploading ? 'Uploading…' : 'Upload Logo'}
                  </button>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Colors */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Colors</legend>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(theme.colors) as (keyof ThemeColors)[]).map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="color"
                    value={theme.colors[key]}
                    onChange={(e) => updateColors({ [key]: e.target.value })}
                    className="h-8 w-8 rounded border cursor-pointer"
                  />
                  <span className="capitalize">{key}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Fonts */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Fonts</legend>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500">Heading</label>
                <input className={inputClasses} value={theme.fonts.heading} onChange={(e) => updateFonts({ heading: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Body</label>
                <input className={inputClasses} value={theme.fonts.body} onChange={(e) => updateFonts({ body: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Size</label>
                <select className={inputClasses} value={theme.fonts.size} onChange={(e) => updateFonts({ size: e.target.value as ThemeFonts['size'] })}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Layout */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Layout</legend>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500">Style</label>
                <select className={inputClasses} value={theme.layout.style} onChange={(e) => updateLayout({ style: e.target.value as LayoutStyle })}>
                  <option value="single-column">Single Column</option>
                  <option value="two-column">Two Column</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Header</label>
                <select className={inputClasses} value={theme.layout.headerStyle} onChange={(e) => updateLayout({ headerStyle: e.target.value as HeaderStyle })}>
                  <option value="full-width">Full Width</option>
                  <option value="compact">Compact</option>
                  <option value="centered">Centered</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm self-end pb-1">
                <input
                  type="checkbox"
                  checked={theme.layout.showPhoto}
                  onChange={(e) => updateLayout({ showPhoto: e.target.checked })}
                  className="rounded"
                />
                Show Photo
              </label>
            </div>
          </fieldset>

          {/* Margins */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Page Margins (px)</legend>
            <div className="grid grid-cols-4 gap-3">
              {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                <div key={side}>
                  <label className="block text-xs text-gray-500 capitalize">{side}</label>
                  <input
                    type="number"
                    className={inputClasses}
                    value={theme.layout.pageMargins[side]}
                    onChange={(e) => updateMargins({ [side]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Section Order */}
          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">Section Order</legend>
            <div className="space-y-1">
              {theme.layout.sectionOrder.map((section, idx) => (
                <div key={section} className="flex items-center gap-2 rounded border border-gray-200 px-3 py-1.5 text-sm">
                  <GripVertical size={14} className="text-gray-400" />
                  <span className="flex-1 capitalize">{section}</span>
                  <button onClick={() => moveSectionUp(idx)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    ↑
                  </button>
                  <button onClick={() => moveSectionDown(idx)} disabled={idx === theme.layout.sectionOrder.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                    ↓
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Save */}
          <div className="flex justify-end border-t pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
