import { createRequestHandler } from 'react-router';

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Proxy logic
    if (
      url.pathname === '/resources/proxy' ||
      url.pathname.startsWith('/resources/proxy')
    ) {
      const targetUrl = url.searchParams.get('url');

      // CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type, User-Agent',
        'Access-Control-Expose-Headers':
          'Content-Length, Content-Range, Content-Type, Accept-Ranges, Content-Disposition',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: corsHeaders,
        });
      }

      if (!targetUrl) {
        return new Response("Missing 'url' query parameter", {
          status: 400,
          headers: corsHeaders,
        });
      }

      try {
        const upstreamUrl = new URL(targetUrl);
        const headers = new Headers(request.headers);
        
        headers.set('Host', upstreamUrl.hostname);
        headers.set('Referer', upstreamUrl.origin);
        headers.delete('Origin'); 
        headers.delete('Cookie');

        const upstreamResponse = await fetch(targetUrl, {
          method: request.method,
          headers: headers,
          redirect: 'follow',
        });

        const responseHeaders = new Headers();
        
        // Copy Headers (Blocklist approach for maximum compatibility)
        const skipHeaders = [
          'content-encoding', 
          'content-length', 
          'transfer-encoding', 
          'connection', 
          'keep-alive',
          'content-disposition', // We handle this manually
          'content-type'         // We handle this manually
        ];

        for (const [key, value] of upstreamResponse.headers.entries()) {
          if (!skipHeaders.includes(key.toLowerCase())) {
            responseHeaders.set(key, value);
          }
        }

        // --- IDM FIX: Force browser to treat as stream, not file ---
        responseHeaders.delete('content-disposition');
        responseHeaders.set('content-type', 'application/octet-stream');

        // Restore Critical Headers
        if (upstreamResponse.headers.has('Content-Length')) {
          responseHeaders.set('Content-Length', upstreamResponse.headers.get('Content-Length')!);
        }
        if (upstreamResponse.headers.has('Content-Range')) {
          responseHeaders.set('Content-Range', upstreamResponse.headers.get('Content-Range')!);
        }

        // CORS
        Object.entries(corsHeaders).forEach(([key, value]) => {
          responseHeaders.set(key, value);
        });

        return new Response(upstreamResponse.body, {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
          headers: responseHeaders,
        });
      } catch (error) {
        return new Response(
          `Proxy error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          {
            status: 502,
            headers: corsHeaders,
          },
        );
      }
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
