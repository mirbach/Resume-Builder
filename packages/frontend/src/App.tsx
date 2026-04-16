import { useState, useEffect, useCallback, useRef } from 'react';
import type { ResumeData, ResumeTheme, AppSettings, Language } from './lib/types';
import { getResume, saveResume, getTheme, getThemes, getSettings, setAuthToken } from './lib/api';
import { buildAuthUrl, exchangeCodeForToken, getApiToken, storeToken, validateOAuthState, clearToken, buildLogoutUrl } from './lib/auth';
import { resolveResume } from './lib/resolve';
import ResumeEditor from './components/editor/ResumeEditor';
import ResumeLayout from './components/resume/ResumeLayout';
import LanguageSwitcher from './components/toolbar/LanguageSwitcher';
import ThemeSelector from './components/toolbar/ThemeSelector';
import ThemeEditor from './components/editor/theme/ThemeEditor';
import PdfExportButton from './components/pdf/PdfExportButton';
import SettingsPage from './components/SettingsPage';
import { Save, CheckCircle, AlertCircle, Loader2, Palette, Settings, Moon, Sun, Pencil, ArrowLeft, X, LogOut } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type AppMode = 'preview' | 'editor';

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
  const [mode, setMode] = useState<AppMode>('preview');
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        // Restore any stored token BEFORE making API calls so auth headers are present
        const apiToken = getApiToken();
        if (apiToken) setAuthToken(apiToken);

        // Always load settings first (settings endpoint is public)
        const settings = await getSettings().catch(() => null);
        setAppSettings(settings);

        // If this is an OAuth callback (?code= present), skip the data fetch —
        // the OAuth callback effect will exchange the code, then load data.
        const params = new URLSearchParams(window.location.search);
        if (params.has('code')) {
          setLoading(false);
          return;
        }

        const resume = await getResume();
        setResumeData(resume);

        let themeData: ResumeTheme | null = null;
        try {
          themeData = await getTheme('default');
          setThemeName('default');
        } catch {
          const list = await getThemes();
          if (list.length === 0) throw new Error('No themes found.');
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

  // Load resume + theme data (used after OAuth exchange)
  async function loadResumeData() {
    const resume = await getResume();
    setResumeData(resume);
    let themeData: ResumeTheme | null = null;
    try {
      themeData = await getTheme('default');
      setThemeName('default');
    } catch {
      const list = await getThemes();
      if (list.length > 0) {
        themeData = await getTheme(list[0].filename);
        setThemeName(list[0].filename);
      }
    }
    if (themeData) setTheme(themeData);
  }

  // Handle OAuth callback (?code=... in URL after IDP redirect)
  useEffect(() => {
    if (!appSettings?.auth.enabled) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    const returnedState = params.get('state');
    if (!validateOAuthState(returnedState)) {
      setAuthError('Authentication failed: invalid state parameter');
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    setAuthLoading(true);
    exchangeCodeForToken(code, appSettings.auth)
      .then(async ({ accessToken, idToken }) => {
        storeToken(accessToken, idToken);
        setAuthToken(idToken ?? accessToken);
        window.history.replaceState({}, '', window.location.pathname);
        // Now that we have a valid token, load the resume + theme data
        await loadResumeData();
        setMode('editor');
      })
      .catch((err) => {
        setAuthError(err instanceof Error ? err.message : 'Authentication failed');
        window.history.replaceState({}, '', window.location.pathname);
      })
      .finally(() => setAuthLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSettings]);

  // Load theme when user changes theme selection (skip the initial mount —
  // theme is already fetched inside init() with the token already set)
  const isInitialThemeMount = useRef(true);
  useEffect(() => {
    if (isInitialThemeMount.current) {
      isInitialThemeMount.current = false;
      return;
    }
    getTheme(themeName).then(setTheme).catch(console.error);
  }, [themeName]);

  // Auto-save with debounce
  const handleResumeChange = useCallback((data: ResumeData) => {
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
  }, []);

  async function handleEditClick() {
    if (!appSettings?.auth.enabled) {
      setMode('editor');
      return;
    }
    // Already have a token
    const token = getApiToken();
    if (token) {
      setAuthToken(token);
      setMode('editor');
      return;
    }
    // Redirect to IDP
    try {
      setAuthLoading(true);
      const url = await buildAuthUrl(appSettings.auth);
      window.location.href = url;
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to initiate authentication');
      setAuthLoading(false);
    }
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  }

  async function handleLogout() {
    clearToken();
    setAuthToken(null);
    if (appSettings?.auth.enabled) {
      try {
        const logoutUrl = await buildLogoutUrl(appSettings.auth);
        if (logoutUrl) {
          window.location.href = logoutUrl;
          return;
        }
      } catch {
        // fall through to page reload
      }
    }
    window.location.reload();
  }

  // ---- Render: loading / error ----
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
  const darkClass = darkMode ? ' dark' : '';

  // ---- Render: preview mode ----
  if (mode === 'preview') {
    return (
      <div className={`flex h-screen flex-col bg-gray-200 dark:bg-gray-700${darkClass}`}>
        {/* Minimal top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 shadow-sm flex-shrink-0">
          <span className="text-base font-semibold text-gray-900 dark:text-white">
            {resolved.personal.name || 'Resume'}
          </span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher language={language} onChange={setLanguage} />
            <PdfExportButton resume={resolved} theme={theme} language={language} />
            <button
              aria-label="Toggle dark mode"
              onClick={toggleDarkMode}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              aria-label="Edit resume"
              onClick={handleEditClick}
              disabled={authLoading}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {authLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <Pencil size={14} />}
              Edit
            </button>
          </div>
        </header>

        {/* Auth error banner */}
        {authError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-300 flex-shrink-0">
            <AlertCircle size={14} />
            <span>{authError}</span>
            <button aria-label="Dismiss" onClick={() => setAuthError(null)} className="ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Full-page resume preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <ResumeLayout resume={resolved} theme={theme} />
        </div>
      </div>
    );
  }

  // ---- Render: editor mode ----
  return (
    <div className={`flex h-screen flex-col bg-gray-100 dark:bg-gray-900${darkClass}`}>
      {/* Editor toolbar */}
      <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            aria-label="Back to preview"
            onClick={() => setMode('preview')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Resume Builder</h1>
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Loader2 size={14} className="animate-spin" /> Saving…
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
                    .then(() => { setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); })
                    .catch(() => { setSaveStatus('error'); setTimeout(() => setSaveStatus('idle'), 3000); });
                }}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Save size={14} /> Save
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector value={themeName} onChange={setThemeName} />
          <button
            onClick={() => setShowThemeEditor(true)}
            className="flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Palette size={14} /> Edit Theme
          </button>
          <LanguageSwitcher language={language} onChange={setLanguage} />
          <button
            aria-label="Toggle dark mode"
            onClick={toggleDarkMode}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <Settings size={16} />
          </button>
          {appSettings?.auth.enabled && (
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut size={16} />
            </button>
          )}
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
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
              <ResumeEditor data={resumeData} onChange={handleResumeChange} />
            </div>
            <div className="w-1/2 overflow-y-auto p-6 bg-gray-200 dark:bg-gray-700">
              <ResumeLayout resume={resolved} theme={theme} />
            </div>
          </div>

          {showThemeEditor && (
            <ThemeEditor
              currentTheme={themeName}
              onThemeChange={(name) => {
                setThemeName(name);
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
