import type { MetaFunction } from 'react-router';
import { MediaForm } from '../components/media-form';
import { requireUserSession } from '../services/session.server';
import type { Route } from './+types/_index';

export const meta: MetaFunction = () => {
  return [{ title: 'MediaPeek' }];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireUserSession(request);
  return null;
}

export default function Index() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-[#050505] font-sans selection:bg-blue-500/30">
      
      {/* --- New GUI Background --- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 1. Subtle Noise Texture for texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        
        {/* 2. Grid Floor (Perspective) */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(to bottom, transparent 5%, black 40%, transparent 90%)'
          }}
        />

        {/* 3. Small Stars / Floating Particles */}
        <div className="absolute top-1/4 left-1/4 h-1 w-1 rounded-full bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
        <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 rounded-full bg-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
        <div className="absolute bottom-1/3 left-1/2 h-1 w-1 rounded-full bg-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
        
        {/* 4. Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-900/10 blur-[100px]" />
      </div>

      <main className="relative z-10 mt-20 flex w-full max-w-5xl flex-col px-6 pb-20">
        {/* Minimal Header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            MediaPeek
          </h1>
          <p className="mt-4 max-w-lg text-base text-gray-500">
            Professional media analysis tool. Paste a URL to extract technical metadata instantly.
          </p>
        </div>

        <MediaForm />
      </main>
    </div>
  );
}
