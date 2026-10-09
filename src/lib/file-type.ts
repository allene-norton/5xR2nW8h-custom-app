// File type detection from the file's own bytes.
//
// We cannot trust the Content-Type header on submitted documents: form
// attachments come back from presigned storage URLs that frequently report
// `application/octet-stream` (or nothing at all), and files uploaded through
// this app are all PUT with `application/pdf`. Sniffing the magic bytes is the
// only reliable way to know what we actually received.

export type DetectedFileType =
  | 'pdf'
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'bmp'
  | 'tiff'
  | 'heic'
  | 'unknown';

/** Image formats pdf-lib can embed directly, with no browser decode step. */
export const NATIVELY_EMBEDDABLE: DetectedFileType[] = ['jpeg', 'png'];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  if (bytes.length < offset + length) return '';
  let out = '';
  for (let i = offset; i < offset + length; i++) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}

// ISO base media file brands that mean "this is a HEIF/HEIC still image".
const HEIF_BRANDS = new Set([
  'heic',
  'heix',
  'heim',
  'heis',
  'hevc',
  'hevx',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
]);

export function detectFileType(bytes: Uint8Array): DetectedFileType {
  // PDF: `%PDF` is normally at offset 0, but the spec tolerates leading junk
  // and some generators emit a BOM or stray newlines first.
  const head = asciiAt(bytes, 0, Math.min(bytes.length, 1024));
  if (head.indexOf('%PDF') !== -1 && head.indexOf('%PDF') <= 256) return 'pdf';

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'png';
  }
  if (asciiAt(bytes, 0, 4) === 'GIF8') return 'gif';
  if (asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WEBP') {
    return 'webp';
  }
  if (asciiAt(bytes, 0, 2) === 'BM') return 'bmp';
  if (
    startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) ||
    startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])
  ) {
    return 'tiff';
  }
  // HEIC/HEIF: `....ftyp<brand>` — the default photo format on iPhones.
  if (asciiAt(bytes, 4, 4) === 'ftyp' && HEIF_BRANDS.has(asciiAt(bytes, 8, 4))) {
    return 'heic';
  }

  return 'unknown';
}

export function isImageType(type: DetectedFileType): boolean {
  return type !== 'pdf' && type !== 'unknown';
}

/** Human-readable label used in error messages shown to staff. */
export function describeFileType(type: DetectedFileType): string {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'jpeg':
      return 'JPEG image';
    case 'png':
      return 'PNG image';
    case 'gif':
      return 'GIF image';
    case 'webp':
      return 'WebP image';
    case 'bmp':
      return 'BMP image';
    case 'tiff':
      return 'TIFF image';
    case 'heic':
      return 'HEIC/HEIF image (iPhone photo)';
    default:
      return 'unrecognized file';
  }
}
