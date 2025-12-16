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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#050505] font-sans text-gray-200 selection:bg-white/20">
      
      {/* Background Ambience (Subtle & Greyish) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[1000px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-gray-900/0 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <main className="relative z-10 w-full max-w-4xl px-6">
        {/* Header Area */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
            Analyze Media
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Extract technical metadata efficiently.
          </p>
        </div>

        {/* Main Application Card */}
        <MediaForm />
      </main>
    </div>
  );
}
