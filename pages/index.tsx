import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Accelerating AI - Sophos</title>
        <meta name="description" content="Discover Accelerating AI team products and projects" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Accelerating AI
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Discover the Accelerating AI team's products and projects
          </p>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-500">
              🚀 Project structure initialized. More coming soon...
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
