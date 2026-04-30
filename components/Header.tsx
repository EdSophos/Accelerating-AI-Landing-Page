import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🚀 Accelerating AI</h1>
          <p className="text-sm text-slate-600">
            Discover the AI Acceleration team&apos;s products and projects
          </p>
        </div>

        {/* User Menu */}
        {session?.user && (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
            >
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                  unoptimized
                />
              )}
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">
                  {session.user.name}
                </p>
                <p className="text-xs text-slate-600">{session.user.email}</p>
              </div>
              <span className="text-slate-600">▼</span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2">
                <button
                  onClick={() => {
                    signOut({ redirect: true, callbackUrl: '/auth/signin' });
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
