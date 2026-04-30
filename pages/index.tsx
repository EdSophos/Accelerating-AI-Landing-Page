import { useEffect, useState } from 'react';
import Head from 'next/head';
import SearchBar, { SearchFilters } from '@/components/SearchBar';
import ProjectGrid from '@/components/ProjectGrid';
import Header from '@/components/Header';
import { Project } from '@/lib/confluence';

interface ProjectsData {
  lastSynced: string;
  count: number;
  projects: Project[];
}

export default function Home() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
        const response = await fetch(`${basePath}/data/projects.json`);

        if (!response.ok) {
          throw new Error('Failed to load projects');
        }

        const data: ProjectsData = await response.json();
        setAllProjects(data.projects);
        setFilteredProjects(data.projects);
        setLastSynced(data.lastSynced || null);

        // Extract unique tags
        const tags = new Set<string>();
        data.projects.forEach((project) => {
          project.tags.forEach((tag) => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());

        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error loading projects:', message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Handle search and filtering
  const handleSearch = (query: string, filters: SearchFilters) => {
    let results = allProjects;

    // Filter by status
    if (filters.status !== 'all') {
      results = results.filter((p) => p.status === filters.status);
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      results = results.filter((p) =>
        filters.tags.some((tag) => p.tags.includes(tag))
      );
    }

    // Filter by search query
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    setFilteredProjects(results);
  };

  return (
    <>
      <Head>
        <title>Accelerating AI - Sophos</title>
        <meta
          name="description"
          content="Discover Accelerating AI team products and projects at Sophos"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
        {/* Header with Auth */}
        <Header />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">
                ⚠️ Error loading projects: {error}
              </p>
            </div>
          )}

          {allProjects.length === 0 && !isLoading && !error && (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">
                No projects synced yet. Check back soon!
              </p>
            </div>
          )}

          {allProjects.length > 0 && (
            <>
              {/* Search & Filters */}
              <SearchBar
                onSearch={handleSearch}
                availableTags={availableTags}
              />

              {/* Results Summary */}
              <div className="mb-6 text-sm text-slate-600">
                Showing <span className="font-semibold">{filteredProjects.length}</span> of{' '}
                <span className="font-semibold">{allProjects.length}</span> projects
              </div>

              {/* Projects Grid */}
              <ProjectGrid projects={filteredProjects} isLoading={isLoading} />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-slate-800 text-slate-300 mt-16 py-8">
          <div className="container mx-auto px-4 text-center text-sm">
            <p>
              Last synced:{' '}
              {lastSynced ? new Date(lastSynced).toLocaleString() : 'Never'}
            </p>
            <p className="mt-2 text-slate-400">
              Accelerating AI Team • Sophos
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
