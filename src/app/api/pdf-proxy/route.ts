import { NextRequest, NextResponse } from 'next/server';

// Hostnames that must never be proxied — this endpoint takes an arbitrary URL,
// so keep it from being used to reach anything on the internal network.
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
]);

function isProxyableUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return null;
  if (host.endsWith('.local') || host.endsWith('.internal')) return null;
  // Private IPv4 ranges.
  if (
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return null;
  }

  return url;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pdfUrl = searchParams.get('url');

  if (!pdfUrl) {
    return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
  }

  const target = isProxyableUrl(pdfUrl);
  if (!target) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(target.toString());

    if (!response.ok) {
      console.error(
        'Upstream fetch failed:',
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: `Failed to fetch file: ${response.statusText}` },
        { status: 502 },
      );
    }

    const buffer = await response.arrayBuffer();

    // Pass the upstream content type through. Forcing `application/pdf` here
    // corrupted image attachments (government ID photos in particular), which
    // are served from the same storage URLs as PDFs.
    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline', // Force inline display
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}
