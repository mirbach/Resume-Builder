import { useState, useEffect, useCallback, useRef } from 'react';
import type { ResumeData, ResumeTheme, AppSettings, Language, ResolvedResume } from './lib/types';
import { getResume, saveResume, getTheme, getThemes, getSettings, setAuthToken, exportResumeJson, importResumeJson, AuthExpiredError } from './lib/api';
import { buildAuthUrl, exchangeCodeForToken, getApiToken, storeToken, validateOAuthState, clearToken, buildLogoutUrl, isTokenExpired } from './lib/auth';
import { resolveResume } from './lib/resolve';
import ResumeEditor from './components/editor/ResumeEditor';
import ResumeLayout from './components/resume/ResumeLayout';
import LanguageSwitcher from './components/toolbar/LanguageSwitcher';
import ThemeSelector from './components/toolbar/ThemeSelector';
import ThemeEditor from './components/editor/theme/ThemeEditor';
import PdfExportButton from './components/pdf/PdfExportButton';
import PrintButton from './components/pdf/PrintButton';
import SettingsPage from './components/SettingsPage';
import HelpPage from './components/HelpPage';
import { Save, CheckCircle, AlertCircle, Loader2, Palette, Settings, HelpCircle, Moon, Sun, Pencil, ArrowLeft, X, LogOut, Download, Upload, Eye, EyeOff } from 'lucide-react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type AppMode = 'preview' | 'editor';

const APP_MODE_KEY = 'resume_app_mode';
const THEME_KEY = 'resume_theme';
const REAUTH_KEY = 'auth_reauth_pending';

/** Renders a ResumeLayout at full A4 width (794px) and scales it down to fit its container. */
function ScaledPreview({ resume, theme, lang }: { resume: ResolvedResume; theme: ResumeTheme; lang: Language }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const A4_WIDTH = 794; // px — 210mm at 96 dpi

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const available = el.clientWidth;
      setZoom(Math.min(1, available / A4_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <div style={{ width: A4_WIDTH, zoom }}>
        <ResumeLayout resume={resume} theme={theme} lang={lang} />
      </div>
    </div>
  );
}

export default function App() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [theme, setTheme] = useState<ResumeTheme | null>(null);
  const [themeName, setThemeName] = useState(() => localStorage.getItem(THEME_KEY) || 'default');
  const [language, setLanguage] = useState<Language>('en');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [themeListKey, setThemeListKey] = useState(0);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [mode, setMode] = useState<AppMode>(() => {
    const storedMode = sessionStorage.getItem(APP_MODE_KEY);
    return storedMode === 'editor' ? 'editor' : 'preview';
  });
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const importInputRef = useRef<HTMLInputElement>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    importResumeJson(file)
      .then((data) => {
        setResumeData(data);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      })
      .catch((err: unknown) => {
        alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      });
  }

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        // Restore any stored token BEFORE making API calls so auth headers are present
        const apiToken = getApiToken();
        if (apiToken) setAuthToken(apiToken);

        // Always load settings first (settings endpoint is public)
        const settingsResp = await getSettings().catch(() => null);
        const settings = settingsResp?.settings ?? null;
        setAppSettings(settings);

        // If a 401 was caught mid-session, the token was cleared and a reload was triggered.
        // Pick that up here and redirect to sign-in before doing anything else.
        const reauthPending = sessionStorage.getItem(REAUTH_KEY) === '1';
        if (reauthPending) {
          sessionStorage.removeItem(REAUTH_KEY);
          if (settings?.auth.enabled) {
            const url = await buildAuthUrl(settings.auth);
            window.location.href = url;
            return;
          }
        }

        // If auth is enabled and the stored token has expired, redirect to sign-in immediately.
        if (settings?.auth.enabled && apiToken && isTokenExpired(apiToken)) {
          clearToken();
          setAuthToken(null);
          const url = await buildAuthUrl(settings.auth);
          window.location.href = url;
          return;
        }

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
        const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
        try {
          themeData = await getTheme(savedTheme);
          setThemeName(savedTheme);
        } catch {
          try {
            themeData = await getTheme('default');
            setThemeName('default');
          } catch {
            const list = await getThemes();
            if (list.length === 0) throw new Error('No themes found.');
            themeData = await getTheme(list[0].filename);
            setThemeName(list[0].filename);
          }
        }
        setTheme(themeData);

        // Restore editor mode on refresh when the session is still authenticated.
        const wantsEditor = sessionStorage.getItem(APP_MODE_KEY) === 'editor';
        if (wantsEditor && (!settings?.auth.enabled || apiToken)) {
          setMode('editor');
        }
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Failed to load app data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    sessionStorage.setItem(APP_MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeName);
  }, [themeName]);

  // Load resume + theme data (used after OAuth exchange)
  async function loadResumeData() {
    const resume = await getResume();
    setResumeData(resume);
    let themeData: ResumeTheme | null = null;
    const savedTheme = localStorage.getItem(THEME_KEY) || 'default';
    try {
      themeData = await getTheme(savedTheme);
      setThemeName(savedTheme);
    } catch {
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
        .catch((err: unknown) => {
          if (err instanceof AuthExpiredError) {
            clearToken();
            sessionStorage.setItem(REAUTH_KEY, '1');
            window.location.reload();
          } else {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
          }
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
    let logoutUrl: string | null = null;

    if (appSettings?.auth.enabled) {
      try {
        logoutUrl = await buildLogoutUrl(appSettings.auth);
      } catch {
        // fall through to local logout
      }
    }

    sessionStorage.setItem(APP_MODE_KEY, 'preview');
    clearToken();
    setAuthToken(null);

    if (logoutUrl) {
      window.location.href = logoutUrl;
      return;
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
            <PrintButton />
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
          <div id="print-resume">
            <ResumeLayout resume={resolved} theme={theme} lang={language} />
          </div>
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
                    .catch((err: unknown) => {
                      if (err instanceof AuthExpiredError) {
                        clearToken();
                        sessionStorage.setItem(REAUTH_KEY, '1');
                        window.location.reload();
                      } else {
                        setSaveStatus('error');
                        setTimeout(() => setSaveStatus('idle'), 3000);
                      }
                    });
                }}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <Save size={14} /> Save
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeSelector value={themeName} onChange={setThemeName} refreshKey={themeListKey} />
          <button
            onClick={() => setShowThemeEditor(true)}
            className="flex items-center gap-1 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Palette size={14} /> Company
          </button>
          <LanguageSwitcher language={language} onChange={setLanguage} />
          <PrintButton />
          <PdfExportButton resume={resolved} theme={theme} language={language} />
          <button
            onClick={() => resumeData && exportResumeJson(resumeData)}
            aria-label="Export resume JSON"
            title="Export JSON"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <Download size={16} />
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            aria-label="Import resume JSON"
            title="Import JSON"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <Upload size={16} />
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
            title="Import resume JSON file"
          />
          <button
            aria-label="Toggle dark mode"
            onClick={toggleDarkMode}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            aria-label={showPreview ? 'Hide preview' : 'Show preview'}
            title={showPreview ? 'Hide preview' : 'Show preview'}
            onClick={() => setShowPreview((v) => !v)}
            className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 ${showPreview ? '' : 'text-blue-600 dark:text-blue-400'}`}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={() => setShowHelp(true)}
            aria-label="Open frameworks guide"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <HelpCircle size={16} />
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

      {showHelp ? (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <HelpPage onClose={() => setShowHelp(false)} language={language} />
        </div>
      ) : showSettings ? (
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <SettingsPage onClose={() => setShowSettings(false)} />
        </div>
      ) : (
        <>
          {/* Split pane */}
          <div className="flex flex-1 overflow-hidden">
            <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-gray-200 dark:border-gray-700 overflow-hidden transition-all`}>
              <ResumeEditor data={resumeData} onChange={handleResumeChange} lang={language} />
            </div>
            {showPreview && (
              <div className="w-1/2 overflow-y-auto p-4 bg-gray-200 dark:bg-gray-700">
                <ScaledPreview resume={resolved} theme={theme} lang={language} />
              </div>
            )}
          </div>

          {showThemeEditor && (
            <ThemeEditor
              currentTheme={themeName}
              onThemeChange={(name) => {
                setThemeName(name);
                setThemeListKey((k) => k + 1);
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
