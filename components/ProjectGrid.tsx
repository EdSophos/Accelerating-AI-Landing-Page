import { Project } from '@/lib/confluence';
import ProjectCard from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
  isLoading?: boolean;
}

export default function ProjectGrid({
  projects,
  isLoading = false,
}: ProjectGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
          >
            <div className="h-48 bg-slate-200" />
            <div className="p-5 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-slate-200 rounded-full w-16" />
                <div className="h-6 bg-slate-200 rounded-full w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No projects found
        </h3>
        <p className="text-slate-600">
          Try adjusting your search filters or check back later for new projects.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
