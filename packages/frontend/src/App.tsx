import { useState, useEffect, useCallback, useRef } from 'react';
import type { ResumeData, ResumeTheme, Language } from './lib/types';
import { getResume, saveResume, getTheme, getThemes } from './lib/api';
import { resolveResume } from './lib/resolve';
import ResumeEditor from './components/editor/ResumeEditor';
import ResumeLayout from './components/resume/ResumeLayout';
import LanguageSwitcher from './components/toolbar/LanguageSwitcher';
import ThemeSelector from './components/toolbar/ThemeSelector';
import ThemeEditor from './components/editor/theme/ThemeEditor';
import PdfExportButton from './components/pdf/PdfExportButton';
import SettingsPage from './components/SettingsPage';
import { Save, CheckCircle, AlertCircle, Loader2, Palette, Settings, Moon, Sun } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function App() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [theme, setTheme] = useState<ResumeTheme | null>(null);
  const [themeName, setThemeName] = useState('default');
  const [language, setLanguage] = useState<Language>('en');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load initial data — fall back to first available theme if 'default' is missing
  useEffect(() => {
    async function init() {
      try {
        const resume = await getResume();
        setResumeData(resume);

        let themeData: ResumeTheme | null = null;
        try {
          themeData = await getTheme('default');
          setThemeName('default');
        } catch {
          // default theme missing — load first available
          const list = await getThemes();
          if (list.length === 0) throw new Error('No themes found. Please restart the server.');
          themeData = await getTheme(list[0].filename);
          setThemeName(list[0].filename);
        }
        setTheme(themeData);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load app data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Load theme when selection changes
  useEffect(() => {
    getTheme(themeName)
      .then(setTheme)
      .catch(console.error);
  }, [themeName]);

  // Auto-save with debounce
  const handleResumeChange = useCallback(
    (data: ResumeData) => {
      setResumeData(data);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saving');
        saveResume(data)
          .then(() => {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          })
          .catch(() => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
          });
      }, 1000);
    },
    []
  );

  if (loading || !resumeData || !theme) {
    return (
      <div className={`flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900${darkMode ? ' dark' : ''}`}>
        {loadError ? (
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
            <p className="text-red-600 font-medium">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <Loader2 className="animate-spin text-blue-600" size={32} />
        )}
      </div>
    );
  }

  const resolved = resolveResume(resumeData, language);

  return (
    <div className={`flex h-screen flex-col bg-gray-100 dark:bg-gray-900${darkMode ? ' dark' : ''}`}>
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Resume Builder</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle size={14} /> Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle size={14} /> Save failed
              </span>
            )}
            {saveStatus === 'idle' && (
              <button
                onClick={() => {
                  setSaveStatus('saving');
                  saveResume(resumeData)
                    .then(() => {
                      setSaveStatus('saved');
                      setTimeout(() => setSaveStatus('idle'), 2000);
                    })
                    .catch(() => {
                      setSaveStatus('error');
                      setTimeout(() => setSaveStatus('idle'), 3000);
                    });
                }}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Save size={14} /> Save
              </button>
            )}
          </div>
          <ThemeSelector value={themeName} onChange={setThemeName} />
          <button
            onClick={() => setShowThemeEditor(true)}
            className="flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Palette size={14} /> Edit Theme
          </button>
          <LanguageSwitcher language={language} onChange={setLanguage} />
          <PdfExportButton resume={resolved} theme={theme} language={language} />
          <button
            aria-label="Toggle dark mode"
            onClick={() => {
              const next = !darkMode;
              setDarkMode(next);
              localStorage.setItem('darkMode', String(next));
            }}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {showSettings ? (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <SettingsPage onClose={() => setShowSettings(false)} />
        </div>
      ) : (
      <>
      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
          <ResumeEditor data={resumeData} onChange={handleResumeChange} />
        </div>

        {/* Preview */}
        <div className="w-1/2 overflow-y-auto p-6 bg-gray-200 dark:bg-gray-700">
          <ResumeLayout resume={resolved} theme={theme} />
        </div>
      </div>

      {/* Theme Editor Modal */}
      {showThemeEditor && (
        <ThemeEditor
          currentTheme={themeName}
          onThemeChange={(name) => {
            setThemeName(name);
            // Always re-fetch theme data so edits to the current theme are reflected
            getTheme(name).then(setTheme).catch(console.error);
            setShowThemeEditor(false);
          }}
          onClose={() => setShowThemeEditor(false)}
        />
      )}
      </>
      )}
    </div>
  );
}
