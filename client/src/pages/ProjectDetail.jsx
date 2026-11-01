import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ButtonLink, ExternalButtonLink } from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ExternalLinkIcon,
  GitHubIcon,
  LayersIcon,
  UserIcon,
} from "../components/Icons.jsx";
import Loader from "../components/Loader.jsx";
import ProjectMedia from "../components/ProjectMedia.jsx";
import { getProject } from "../lib/api.js";
import { formatDate, splitParagraphs } from "../lib/format.js";

/** Full project detail page backed by GET /api/projects/:id. */
export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    setProject(null);

    getProject(id)
      .then((data) => {
        if (!active) return;
        setProject(data);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 404 || requestError.status === 400) {
          setStatus("not-found");
        } else {
          setError(requestError.message);
          setStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, [id, request]);

  if (status === "loading") {
    return <Loader className="py-32" label="Loading project…" />;
  }

  if (status === "not-found") {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <EmptyState
          icon={LayersIcon}
          title="Project not found"
          description="This project may have been removed, or the link is incorrect."
        >
          <ButtonLink to="/projects" variant="secondary" size="sm">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to projects
          </ButtonLink>
        </EmptyState>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <ErrorState
          title="Project could not be loaded"
          message={error}
          onRetry={() => setRequest((current) => current + 1)}
        >
          <ButtonLink to="/projects" variant="ghost" size="sm">
            Back to projects
          </ButtonLink>
        </ErrorState>
      </div>
    );
  }

  const paragraphs = splitParagraphs(project.description);
  const authorName = project.user?.username ?? "Unknown author";

  return (
    <article className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-accent-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to projects
      </Link>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">Project</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {project.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" />
            {authorName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            Published <time dateTime={project.createdAt}>{formatDate(project.createdAt)}</time>
          </span>
        </div>
      </header>

      <ProjectMedia
        title={project.title}
        imageUrl={project.imageUrl}
        className="mt-8 aspect-[16/9] rounded-2xl border border-white/10"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-labelledby="project-description-heading">
          <h2 id="project-description-heading" className="text-lg font-semibold text-white">
            About this project
          </h2>
          <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-slate-500">No description was provided for this project.</p>
            )}
          </div>
        </section>

        <aside className="surface h-fit p-5" aria-labelledby="project-links-heading">
          <h2
            id="project-links-heading"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300"
          >
            Project links
          </h2>

          <div className="mt-4 flex flex-col gap-2">
            {project.liveUrl && (
              <ExternalButtonLink href={project.liveUrl} size="sm" className="w-full">
                <ExternalLinkIcon className="h-4 w-4" />
                Visit live site
              </ExternalButtonLink>
            )}
            {project.repoUrl && (
              <ExternalButtonLink href={project.repoUrl} variant="secondary" size="sm" className="w-full">
                <GitHubIcon className="h-4 w-4" />
                View repository
              </ExternalButtonLink>
            )}
            {!project.liveUrl && !project.repoUrl && (
              <p className="text-xs leading-relaxed text-slate-500">
                No external links were provided for this project.
              </p>
            )}
          </div>

          <dl className="mt-6 space-y-3 border-t border-white/5 pt-4 text-xs">
            <div>
              <dt className="text-slate-500">Author</dt>
              <dd className="mt-0.5 text-slate-200">{authorName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Created</dt>
              <dd className="mt-0.5 text-slate-200">{formatDate(project.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Last updated</dt>
              <dd className="mt-0.5 text-slate-200">{formatDate(project.updatedAt)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </article>
  );
}
