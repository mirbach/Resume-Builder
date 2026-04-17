import type {
  ResumeData,
  ResumeTheme,
  ThemeListItem,
  AppSettings,
  ApiResponse,
  CarReviewResult,
} from './types';

export interface KeysConfigured {
  deeplApiKey: boolean;
  aiApiKey: boolean;
}

export interface SettingsResponse {
  settings: AppSettings;
  keysConfigured: KeysConfigured;
}

const API_BASE = '/api';

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (_authToken) headers.Authorization = `Bearer ${_authToken}`;
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }
  return json.data as T;
}

// Resume
export async function getResume(): Promise<ResumeData> {
  return request<ResumeData>('/resume');
}

export async function saveResume(data: ResumeData): Promise<ResumeData> {
  return request<ResumeData>('/resume', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function exportResumeJson(data: ResumeData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importResumeJson(file: File): Promise<ResumeData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Invalid JSON file');
  }
  if (typeof parsed !== 'object' || parsed === null || !('personal' in parsed)) {
    throw new Error('File does not look like a resume export');
  }
  return saveResume(parsed as ResumeData);
}

// Themes
export async function getThemes(): Promise<ThemeListItem[]> {
  return request<ThemeListItem[]>('/themes');
}

export async function getTheme(name: string): Promise<ResumeTheme> {
  return request<ResumeTheme>(`/themes/${encodeURIComponent(name)}`);
}

export async function saveTheme(name: string, theme: ResumeTheme): Promise<ResumeTheme> {
  return request<ResumeTheme>(`/themes/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(theme),
  });
}

export async function createTheme(theme: ResumeTheme): Promise<ResumeTheme> {
  return request<ResumeTheme>('/themes', {
    method: 'POST',
    body: JSON.stringify(theme),
  });
}

export async function deleteTheme(name: string): Promise<void> {
  await request(`/themes/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

// File uploads
export async function uploadFile(
  file: File,
  type: 'photo' | 'logo'
): Promise<{ path: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return request<{ path: string; filename: string }>(`/upload/${type}`, {
    method: 'POST',
    body: formData,
  });
}

// Settings
async function requestSettingsRaw(url: string, options?: RequestInit): Promise<SettingsResponse> {
  const headers: Record<string, string> = {};
  if (!(options?.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (_authToken) headers.Authorization = `Bearer ${_authToken}`;
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) } });
  const json = (await res.json()) as ApiResponse<AppSettings> & { keysConfigured?: KeysConfigured };
  if (!json.success) throw new Error(json.error || 'API request failed');
  return {
    settings: json.data as AppSettings,
    keysConfigured: json.keysConfigured ?? { deeplApiKey: false, aiApiKey: false },
  };
}

export async function getSettings(): Promise<SettingsResponse> {
  return requestSettingsRaw('/settings');
}

export async function saveSettings(settings: AppSettings): Promise<SettingsResponse> {
  return requestSettingsRaw('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// Translation
export async function translateText(text: string, from: 'en' | 'de', to: 'en' | 'de'): Promise<string> {
  return request<string>('/translate', {
    method: 'POST',
    body: JSON.stringify({ text, from, to }),
  });
}

// AI CAR Review
export async function reviewCar(
  challenge: string,
  action: string,
  result: string,
  lang: 'en' | 'de' = 'en'
): Promise<CarReviewResult> {
  return request<CarReviewResult>('/ai/review', {
    method: 'POST',
    body: JSON.stringify({ challenge, action, result, lang }),
  });
}
