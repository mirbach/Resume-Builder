import { useState, useEffect } from 'react';
import type { AppSettings, AuthProvider, AiProvider, StorageProviderType } from '../lib/types';
import { getSettings, saveSettings } from '../lib/api';
import type { KeysConfigured } from '../lib/api';
import { Save, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
  isAdmin?: boolean;
}

const AI_PROVIDERS: { value: AiProvider; label: string; defaultModel: string; keyPlaceholder: string; docsUrl: string }[] = [
  { value: 'openai', label: 'OpenAI (ChatGPT)', defaultModel: 'gpt-4o-mini', keyPlaceholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys' },
  { value: 'grok', label: 'xAI (Grok)', defaultModel: 'grok-3-mini', keyPlaceholder: 'xai-...', docsUrl: 'https://console.x.ai/' },
  { value: 'google', label: 'Google AI (Gemini)', defaultModel: 'gemini-2.0-flash', keyPlaceholder: 'AIza...', docsUrl: 'https://aistudio.google.com/app/apikey' },
];

const PROVIDERS: { value: AuthProvider; label: string }[] = [
  { value: 'entra-id', label: 'Microsoft Entra ID' },
  { value: 'zitadel', label: 'Zitadel' },
  { value: 'authentik', label: 'Authentik' },
  { value: 'generic-oidc', label: 'Generic OIDC' },
];

export default function SettingsPage({ onClose, isAdmin = true }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [keysConfigured, setKeysConfigured] = useState<KeysConfigured>({ deeplApiKey: false, aiApiKey: false, s3SecretKey: false, sharePointClientSecret: false });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputClasses =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none';

  useEffect(() => {
    getSettings()
      .then(({ settings, keysConfigured }) => {
        setSettings(settings);
        setKeysConfigured(keysConfigured);
      })
      .catch(console.error);
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const { settings: saved_, keysConfigured: kc } = await saveSettings(settings);
      setSettings(saved_);
      setKeysConfigured(kc);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button aria-label="Back" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">You don't have permission to edit settings. Contact an administrator.</p>
      </div>
    );
  }

  const auth = settings.auth;

  function updateAuth(partial: Partial<typeof auth>) {
    setSettings({ ...settings!, auth: { ...auth, ...partial } });
  }

  const storage = settings.storage ?? {
    provider: 'local' as StorageProviderType,
    s3: { bucket: '', region: 'us-east-1', accessKeyId: '', secretAccessKey: '', prefix: '', endpoint: '' },
    sharepoint: { tenantId: '', clientId: '', clientSecret: '', siteUrl: '', driveName: '', folderPath: '' },
  };

  function updateStorage(partial: Partial<typeof storage>) {
    setSettings({ ...settings!, storage: { ...storage, ...partial } });
  }

  function updateS3(partial: Partial<typeof storage.s3>) {
    updateStorage({ s3: { ...storage.s3, ...partial } });
  }

  function updateSharePoint(partial: Partial<typeof storage.sharepoint>) {
    updateStorage({ sharepoint: { ...storage.sharepoint, ...partial } });
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button aria-label="Back" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Authentication (OIDC)</h3>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={auth.enabled}
            onChange={(e) => updateAuth({ enabled: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable authentication</span>
        </label>

        {auth.enabled && (
          <>
            <div>
              <label htmlFor="auth-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
              <select
                id="auth-provider"
                className={inputClasses}
                value={auth.provider}
                onChange={(e) => updateAuth({ provider: e.target.value as AuthProvider })}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client ID</label>
              <input
                className={inputClasses}
                value={auth.clientId}
                onChange={(e) => updateAuth({ clientId: e.target.value })}
                placeholder="your-client-id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authority URL</label>
              <input
                className={inputClasses}
                value={auth.authority}
                onChange={(e) => updateAuth({ authority: e.target.value })}
                placeholder="https://login.microsoftonline.com/your-tenant-id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Redirect URI</label>
              <input
                className={inputClasses}
                value={auth.redirectUri}
                onChange={(e) => updateAuth({ redirectUri: e.target.value })}
                placeholder="http://localhost:5173/callback"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scopes (comma-separated)</label>
              <input
                className={inputClasses}
                value={auth.scopes.join(', ')}
                onChange={(e) =>
                  updateAuth({ scopes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
                }
                placeholder="openid, profile, email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin role claim <span className="font-normal text-gray-400">(JWT claim name that identifies admins)</span></label>
              <input
                className={inputClasses}
                value={auth.adminRoleClaim ?? ''}
                onChange={(e) => updateAuth({ adminRoleClaim: e.target.value })}
                placeholder="roles"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin role value <span className="font-normal text-gray-400">(expected value of the claim above)</span></label>
              <input
                className={inputClasses}
                value={auth.adminRoleValue ?? ''}
                onChange={(e) => updateAuth({ adminRoleValue: e.target.value })}
                placeholder="resume-admin"
              />
            </div>
          </>
        )}
      </div>

      {/* AI Assistant */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enable AI-powered CAR review and phrasing suggestions. Choose a provider and enter your API key.
        </p>
        <div>
          <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
          <select
            id="ai-provider"
            className={inputClasses}
            value={settings.ai?.provider ?? 'openai'}
            onChange={(e) =>
              setSettings({
                ...settings,
                ai: {
                  provider: e.target.value as AiProvider,
                  apiKey: settings.ai?.apiKey ?? '',
                  model: '',
                },
              })
            }
          >
            {AI_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        {(() => {
          const providerInfo = AI_PROVIDERS.find((p) => p.value === (settings.ai?.provider ?? 'openai'));
          return (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key{' '}
                  {providerInfo && (
                    <a href={providerInfo.docsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-normal">
                      Get key ↗
                    </a>
                  )}
                </label>
                {keysConfigured.aiApiKey && (
                  <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                    <CheckCircle size={12} /> Key configured — leave blank to keep existing
                  </p>
                )}
                <input
                  type="password"
                  className={inputClasses}
                  value={settings.ai?.apiKey ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, ai: { provider: settings.ai?.provider ?? 'openai', apiKey: e.target.value, model: settings.ai?.model ?? '' } })
                  }
                  placeholder={keysConfigured.aiApiKey ? '••••••••' : (providerInfo?.keyPlaceholder ?? '')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model <span className="font-normal text-gray-400">(leave blank for default: {providerInfo?.defaultModel})</span>
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={settings.ai?.model ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, ai: { provider: settings.ai?.provider ?? 'openai', apiKey: settings.ai?.apiKey ?? '', model: e.target.value } })
                  }
                  placeholder={providerInfo?.defaultModel ?? ''}
                />
              </div>
            </>
          );
        })()}
      </div>

      {/* Storage */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Storage</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose where resume data, themes, and uploaded files are stored. Switching providers does not migrate existing data.
        </p>
        <div>
          <label htmlFor="storage-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
          <select
            id="storage-provider"
            className={inputClasses}
            value={storage.provider}
            onChange={(e) => updateStorage({ provider: e.target.value as StorageProviderType })}
          >
            <option value="local">Local Filesystem</option>
            <option value="s3">Amazon S3</option>
            <option value="sharepoint">Microsoft SharePoint</option>
          </select>
        </div>

        {storage.provider === 's3' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bucket Name</label>
              <input className={inputClasses} value={storage.s3.bucket} onChange={(e) => updateS3({ bucket: e.target.value })} placeholder="my-resume-bucket" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Region</label>
              <input className={inputClasses} value={storage.s3.region} onChange={(e) => updateS3({ region: e.target.value })} placeholder="us-east-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Access Key ID</label>
              <input className={inputClasses} value={storage.s3.accessKeyId} onChange={(e) => updateS3({ accessKeyId: e.target.value })} placeholder="AKIA..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Access Key</label>
              {keysConfigured.s3SecretKey && (
                <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                  <CheckCircle size={12} /> Key configured — leave blank to keep existing
                </p>
              )}
              <input type="password" className={inputClasses} value={storage.s3.secretAccessKey} onChange={(e) => updateS3({ secretAccessKey: e.target.value })} placeholder={keysConfigured.s3SecretKey ? '••••••••' : 'your-secret-key'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Prefix <span className="font-normal text-gray-400">(optional)</span></label>
              <input className={inputClasses} value={storage.s3.prefix} onChange={(e) => updateS3({ prefix: e.target.value })} placeholder="resume-builder/" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endpoint URL <span className="font-normal text-gray-400">(optional, for MinIO or S3-compatible)</span></label>
              <input className={inputClasses} value={storage.s3.endpoint} onChange={(e) => updateS3({ endpoint: e.target.value })} placeholder="https://s3.example.com" />
            </div>
          </>
        )}

        {storage.provider === 'sharepoint' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant ID</label>
              <input className={inputClasses} value={storage.sharepoint.tenantId} onChange={(e) => updateSharePoint({ tenantId: e.target.value })} placeholder="your-tenant-id" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client ID</label>
              <input className={inputClasses} value={storage.sharepoint.clientId} onChange={(e) => updateSharePoint({ clientId: e.target.value })} placeholder="your-client-id" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Secret</label>
              {keysConfigured.sharePointClientSecret && (
                <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
                  <CheckCircle size={12} /> Secret configured — leave blank to keep existing
                </p>
              )}
              <input type="password" className={inputClasses} value={storage.sharepoint.clientSecret} onChange={(e) => updateSharePoint({ clientSecret: e.target.value })} placeholder={keysConfigured.sharePointClientSecret ? '••••••••' : 'your-client-secret'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SharePoint Site URL</label>
              <input className={inputClasses} value={storage.sharepoint.siteUrl} onChange={(e) => updateSharePoint({ siteUrl: e.target.value })} placeholder="https://contoso.sharepoint.com/sites/mysite" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Drive Name</label>
              <input className={inputClasses} value={storage.sharepoint.driveName} onChange={(e) => updateSharePoint({ driveName: e.target.value })} placeholder="Documents" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Folder Path <span className="font-normal text-gray-400">(optional)</span></label>
              <input className={inputClasses} value={storage.sharepoint.folderPath} onChange={(e) => updateSharePoint({ folderPath: e.target.value })} placeholder="ResumeBuilder" />
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Translation (DeepL)</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your DeepL API key to enable automatic translation between English and German.
          Get a free key at{' '}
          <a
            href="https://www.deepl.com/pro#developer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            deepl.com/pro
          </a>
          .
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DeepL API Key</label>
          {keysConfigured.deeplApiKey && (
            <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
              <CheckCircle size={12} /> Key configured — leave blank to keep existing
            </p>
          )}
          <input
            type="password"
            className={inputClasses}
            value={settings.translation?.deeplApiKey ?? ''}
            onChange={(e) =>
              setSettings({ ...settings, translation: { deeplApiKey: e.target.value } })
            }
            placeholder={keysConfigured.deeplApiKey ? '••••••••' : 'your-deepl-api-key:fx'}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Settings
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  );
}
