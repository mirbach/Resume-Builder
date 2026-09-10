import { getAuthToken } from './api';

function isSameOrigin(src: string): boolean {
  return !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('blob:');
}

function toAbsoluteUrl(src: string): string {
  return isSameOrigin(src) ? `${window.location.origin}${src}` : src;
}

// Our own uploaded photos/logos are served from a per-user, auth-gated endpoint
// (see functions/api/uploads/[userId]/[filename].ts) once OIDC is enabled, so a
// plain fetch() 401s. Attach our bearer token, but only for same-origin requests —
// never leak it to an externally-hosted URL.
export async function fetchProtected(src: string): Promise<Response> {
  const token = isSameOrigin(src) ? getAuthToken() : null;
  const res = await fetch(toAbsoluteUrl(src), token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status}`);
  return res;
}

export async function fetchAsDataUrl(src: string): Promise<string> {
  const res = await fetchProtected(src);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface ImageBytes {
  data: Uint8Array;
  mime: string;
  ext: 'png' | 'jpg';
  /** Natural pixel size, when readable from the file's own header — lets a
   *  consumer preserve aspect ratio instead of forcing a fixed box. */
  width?: number;
  height?: number;
}

// Reads intrinsic pixel dimensions straight from each format's header, so a
// non-square logo/photo isn't force-stretched into a fixed box by a consumer
// that has to specify an explicit width/height (e.g. ODF's draw:frame).
function readImageDimensions(data: Uint8Array, mime: string): { width: number; height: number } | undefined {
  try {
    if (mime === 'image/png' && data.length > 24) {
      const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
      const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
      return { width: width >>> 0, height: height >>> 0 };
    }
    if (mime === 'image/jpeg') {
      let i = 2;
      while (i < data.length - 9) {
        if (data[i] !== 0xff) { i++; continue; }
        const marker = data[i + 1];
        if (marker >= 0xc0 && marker <= 0xc3) {
          return { height: (data[i + 5] << 8) | data[i + 6], width: (data[i + 7] << 8) | data[i + 8] };
        }
        const segmentLength = (data[i + 2] << 8) | data[i + 3];
        i += 2 + segmentLength;
      }
    }
    if (mime === 'image/gif' && data.length > 10) {
      return { width: data[6] | (data[7] << 8), height: data[8] | (data[9] << 8) };
    }
    if (mime === 'image/webp' && data.length > 30) {
      const chunk = String.fromCharCode(data[12], data[13], data[14], data[15]);
      if (chunk === 'VP8 ') {
        return { width: (data[26] | (data[27] << 8)) & 0x3fff, height: (data[28] | (data[29] << 8)) & 0x3fff };
      }
      if (chunk === 'VP8L') {
        const b0 = data[21], b1 = data[22], b2 = data[23], b3 = data[24];
        return {
          width: 1 + (((b1 & 0x3f) << 8) | b0),
          height: 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
        };
      }
      if (chunk === 'VP8X') {
        return {
          width: 1 + (data[24] | (data[25] << 8) | (data[26] << 16)),
          height: 1 + (data[27] | (data[28] << 8) | (data[29] << 16)),
        };
      }
    }
  } catch {
    /* fall through to undefined */
  }
  return undefined;
}

export async function fetchAsImageBytes(src: string): Promise<ImageBytes> {
  const res = await fetchProtected(src);
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();
  const mime = blob.type || 'image/jpeg';
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const data = new Uint8Array(buffer);
  const dims = readImageDimensions(data, mime);
  return { data, mime, ext, width: dims?.width, height: dims?.height };
}
