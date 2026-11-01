import { Link } from "react-router-dom";
import { excerpt } from "../lib/format.js";
import { ArrowRightIcon, ExternalLinkIcon, GitHubIcon } from "./Icons.jsx";
import ProjectMedia from "./ProjectMedia.jsx";

/** Project card used on the home page strip and the /projects gallery. */
export default function ProjectCard({ project }) {
  const detailsPath = `/projects/${project._id}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 transition duration-300 hover:-translate-y-1 hover:border-accent-400/40 hover:shadow-[0_30px_70px_-40px_rgba(52,211,153,0.55)]">
      <Link
        to={detailsPath}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProjectMedia title={project.title} imageUrl={project.imageUrl} className="aspect-[16/9]" />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-semibold text-white">
          <Link to={detailsPath} className="transition-colors hover:text-accent-300">
            {project.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
          {excerpt(project.description, 160) || "No description provided."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/5 pt-4">
          <Link
            to={detailsPath}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200"
          >
            Details
            <ArrowRightIcon className="h-4 w-4" />
          </Link>

          {(project.repoUrl || project.liveUrl) && (
            <div className="flex items-center gap-1.5">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn"
                  aria-label={`${project.title} — source repository`}
                  title="Source repository"
                >
                  <GitHubIcon className="h-4 w-4" />
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn"
                  aria-label={`${project.title} — live site`}
                  title="Live site"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
