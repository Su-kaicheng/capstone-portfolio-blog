import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { LayersIcon } from "../components/Icons.jsx";
import { CardGridSkeleton } from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import { getProjects } from "../lib/api.js";
import { pluralize } from "../lib/format.js";

/** Public project gallery backed by GET /api/projects. */
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");

    getProjects()
      .then((data) => {
        if (!active) return;
        setProjects(Array.isArray(data) ? data : []);
        setStatus("ready");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [request]);

  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title="Projects"
        description="Full-stack builds stored in MongoDB and rendered from the live REST API — each with its stack notes and source links."
      >
        {status === "ready" && projects.length > 0 && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            {pluralize(projects.length, "project")}
          </span>
        )}
      </PageHeader>

      <section
        aria-label="Project gallery"
        className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14"
      >
        {status === "loading" && <CardGridSkeleton count={6} />}

        {status === "error" && (
          <ErrorState
            title="Projects could not be loaded"
            message={error}
            onRetry={() => setRequest((current) => current + 1)}
          />
        )}

        {status === "ready" &&
          (projects.length === 0 ? (
            <EmptyState
              icon={LayersIcon}
              title="No projects published yet"
              description="Projects created from the admin dashboard appear here automatically."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          ))}
      </section>
    </>
  );
}
