import Image from 'next/image';
import { Project } from '@/lib/confluence';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group h-full bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* Thumbnail */}
      <div className="relative h-48 bg-slate-200 overflow-hidden">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm text-slate-600">No thumbnail</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full font-medium">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Status Badge + Link */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              project.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
          <span className="text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>
    </a>
  );
}
