import { Project } from '@/lib/confluence';

const SOPHOS_COLORS = [
  '#003E72', // Deep Navy
  '#005C9A', // Sophos Blue
  '#00A9E0', // Sophos Cyan
  '#1C3A6B', // Navy
  '#0073CF', // Bright Blue
];

const PORTAL_LABEL = 'accelerating-ai-portal-approved';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const color = SOPHOS_COLORS[index % SOPHOS_COLORS.length];
  const visibleTags = project.tags.filter((t) => t !== PORTAL_LABEL);
  const initial = project.title.charAt(0).toUpperCase();

  return (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col h-full bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {/* Coloured tile header */}
      <div
        className="h-28 flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <span
          className="text-7xl font-black text-white select-none"
          style={{ opacity: 0.18 }}
        >
          {initial}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-700 transition-colors">
          {project.title}
        </h3>

        <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">
          {project.description}
        </p>

        {/* Tags — portal approval label hidden */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {visibleTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-1 text-xs font-medium text-white rounded-full"
                style={{ backgroundColor: color }}
              >
                {tag}
              </span>
            ))}
            {visibleTags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full font-medium">
                +{visibleTags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer link */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <span
            className="text-sm font-semibold group-hover:translate-x-1 transition-transform"
            style={{ color }}
          >
            View in Confluence →
          </span>
        </div>
      </div>
    </a>
  );
}
