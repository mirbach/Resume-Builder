import { useEffect, useState } from 'react';
import { fetchProtected } from './fileUtils';

/**
 * Resolves an uploaded photo/logo path to a src an <img> tag can load directly.
 * Uploads are served from a per-user, auth-gated endpoint once OIDC is enabled
 * (functions/api/uploads/[userId]/[filename].ts), and a plain <img src> can't
 * carry an Authorization header — so we fetch it ourselves and hand back a
 * blob: URL instead.
 */
export function useAuthedImageSrc(src: string | undefined): string | undefined {
  const [resolved, setResolved] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setResolved(undefined);
      return;
    }
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
      setResolved(src);
      return;
    }

    let cancelled = false;
    let objectUrl: string | undefined;

    fetchProtected(src)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResolved(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setResolved(undefined);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  return resolved;
}
