import { signIn } from 'next-auth/react';
import Head from 'next/head';

export default function SignIn() {
  return (
    <>
      <Head>
        <title>Sign In - Accelerating AI</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                🚀 Accelerating AI
              </h1>
              <p className="text-slate-600">Sign in to continue</p>
            </div>

            <button
              onClick={() => signIn('azure-ad', { redirect: true, callbackUrl: '/' })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4"
            >
              Sign in with Sophos
            </button>

            <p className="text-center text-sm text-slate-600 mt-6">
              You need a Sophos account to access this portal.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
