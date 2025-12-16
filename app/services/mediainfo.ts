import type { MediaInfo } from 'mediainfo.js';

type MediaInfoFactory = (opts: {
  format: 'text' | 'json' | 'object' | 'XML' | 'MAXML' | 'HTML' | string;
  coverData: boolean;
  full: boolean;
  locateFile?: (path: string, prefix: string) => string;
}) => Promise<MediaInfo>;

export async function analyzeMedia(
  url: string,
  onResult: (text: string) => void,
  onStatus: (status: string) => void,
  format: string = 'text',
): Promise<string> {
  // --- 1. Validation Phase ---
  onStatus('Validating URL...');

  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  const PROXY_ENDPOINT = '/resources/proxy';
  const proxyUrl = `${PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`;

  // --- 2. Load MediaInfo Engine ---
  onStatus('Loading MediaInfo engine...');
  let mediainfoModule: any;
  try {
    // @ts-expect-error - dynamic import
    mediainfoModule = await import('mediainfo.js');
  } catch (e) {
    throw new Error('Failed to load MediaInfo WASM module.');
  }

  const mediaInfoFactory = mediainfoModule.default as MediaInfoFactory;
  const mediainfo = await mediaInfoFactory({
    format,
    coverData: false,
    full: true,
    locateFile: (path: string) => `/${path}`,
  });

  // State to track progress
  let fileSize = 0;
  let totalBytesDownloaded = 0;

  try {
    // --- 3. Define Smart IO Handlers ---

    // Function to get file size safely (Fixes the 405 Method Not Allowed error)
    const getSize = async (): Promise<number> => {
      onStatus('Connecting to file...');

      // We use GET with a 0-byte range instead of HEAD.
      // This tricks servers that block HEAD requests into giving us the size.
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          Range: 'bytes=0-0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status} ${response.statusText}`);
      }

      // 1. Try Content-Range (Reliable for Range requests)
      // Format: bytes 0-0/12345678
      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }

      // 2. Fallback to Content-Length
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }

      throw new Error('Could not determine file size (Server missing size headers)');
    };

    // Function to read specific chunks of the file
    const readChunk = async (
      size: number,
      offset: number,
    ): Promise<Uint8Array> => {
      // Calculate percentage of TOTAL file downloaded so far
      // This answers: "How much of the file did we actually have to fetch?"
      totalBytesDownloaded += size;
      
      let progressText = '';
      if (fileSize > 0) {
        // Calculate percentage to 2 decimal places (e.g., "1.45%")
        const percent = ((totalBytesDownloaded / fileSize) * 100).toFixed(2);
        progressText = `(${percent}% read)`;
      } else {
        // Fallback if size is unknown
        const mb = (totalBytesDownloaded / 1024 / 1024).toFixed(2);
        progressText = `(${mb} MB read)`;
      }

      // Show the cleaner status
      onStatus(`Analyzing metadata... ${progressText}`);

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          Range: `bytes=${offset}-${offset + size - 1}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Read error: ${response.statusText}`);
      }

      if (response.status === 200 && offset > 0) {
        throw new Error(
          'Server returned 200 OK (Full File) instead of 206 Partial Content. Aborting.',
        );
      }

      const buffer = await response.arrayBuffer();
      return new Uint8Array(buffer);
    };

    // --- 4. Execute Analysis ---
    
    // Step A: Get size first so we can use it for progress bars
    fileSize = await getSize();
    
    // Step B: Run analysis
    const result = await mediainfo.analyzeData(() => fileSize, readChunk);

    if (typeof result === 'string') {
      onResult(result);
      onStatus('Analysis complete!');
      return result;
    } else {
      const json = JSON.stringify(result, null, 2);
      onResult(json);
      onStatus('Analysis complete!');
      return json;
    }
  } catch (error) {
    console.error('Analysis failed:', error);
    onStatus(error instanceof Error ? error.message : 'Error occurred');
    mediainfo.close();
    throw error;
  }
}
