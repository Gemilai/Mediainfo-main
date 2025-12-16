import { Input } from '@base-ui/react/input';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Search, Terminal, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

import { analyzeMedia } from '../services/mediainfo';
import { FormatMenu } from './format-menu';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-black transition-all hover:bg-gray-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
      ) : (
        <>
          <span>Analyze</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

export function MediaForm() {
  const [realtimeStatus, setRealtimeStatus] = useState<string>('');
  const [format, setFormat] = useState<string>('text');

  const [state, formAction] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const url = formData.get('url') as string;
      if (!url) return { error: 'Please enter a valid URL' };

      try {
        setRealtimeStatus('Initializing...');
        const result = await analyzeMedia(
          url,
          () => {}, // We handle final result via return
          (status) => setRealtimeStatus(status),
          format,
        );
        return { result, error: null };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : 'Unknown error occurred',
          result: null,
        };
      }
    },
    { result: null, error: null },
  );

  return (
    <div className="w-full">
      <form action={formAction} className="relative">
        {/* Input Bar Card */}
        <div className="relative flex flex-col gap-2 rounded-2xl border border-white/5 bg-[#111] p-2 shadow-2xl shadow-black/50 ring-1 ring-white/5 transition-all focus-within:ring-white/10 sm:flex-row sm:items-center sm:gap-0 sm:pr-2">
          
          {/* Format Dropdown (Left) */}
          <div className="relative z-20 sm:border-r sm:border-white/5">
             <FormatMenu value={format} onChange={setFormat} />
          </div>

          {/* URL Input (Center) */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <Input
              name="url"
              type="url"
              placeholder="Paste media URL (e.g., https://example.com/video.mp4)"
              autoComplete="off"
              className="h-12 w-full bg-transparent pl-11 pr-4 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors"
            />
          </div>

          {/* Submit Button (Right) */}
          <div className="mt-2 sm:mt-0">
            <SubmitButton />
          </div>
        </div>
      </form>

      {/* Status & Errors */}
      <AnimatePresence mode="wait">
        {(realtimeStatus || state.error) && !state.result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 flex justify-center"
          >
            <div className={clsx(
              "flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-medium backdrop-blur-md",
              state.error 
                ? "border-red-500/20 bg-red-500/10 text-red-400" 
                : "border-blue-500/20 bg-blue-500/10 text-blue-400"
            )}>
              {state.error ? <AlertCircle className="h-3.5 w-3.5" /> : <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
              {state.error || realtimeStatus}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Area */}
      <AnimatePresence>
        {state.result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // smooth easeOutCubic
            className="mt-8 overflow-hidden rounded-xl border border-white/5 bg-[#0F0F0F] shadow-2xl"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-[#141414] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#333]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#333]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#333]" />
                </div>
                <div className="ml-3 flex items-center gap-2 rounded bg-black/40 px-2 py-0.5 text-[10px] font-medium text-gray-500 font-mono border border-white/5">
                  <Terminal className="h-3 w-3" />
                  RESULT
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-600 font-medium">
                  {format}
                </span>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="relative group">
               <pre className="max-h-[60vh] overflow-auto p-6 text-sm font-mono leading-relaxed text-gray-300 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {state.result}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
