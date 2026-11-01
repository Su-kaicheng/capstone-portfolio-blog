import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BlogPostCard from "../components/BlogPostCard.jsx";
import { ButtonLink } from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { CardGridSkeleton } from "../components/Loader.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BracesIcon,
  ClockIcon,
  CodeIcon,
  DatabaseIcon,
  GitBranchIcon,
  GlobeIcon,
  LayersIcon,
  MailIcon,
  ServerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WindIcon,
} from "../components/Icons.jsx";
import { getPosts, getProjects } from "../lib/api.js";
import { pluralize } from "../lib/format.js";

const HERO_FACTS = [
  { label: "Student ID", value: "24998094" },
  { label: "Course", value: "Web Data Management and Application" },
  { label: "Stack", value: "MERN · JWT · REST" },
];

const SKILLS = [
  {
    name: "React",
    icon: CodeIcon,
    blurb: "Component architecture, hooks and Context for shared auth state.",
  },
  {
    name: "JavaScript",
    icon: BracesIcon,
    blurb: "Modern ES modules, async/await and defensive data handling.",
  },
  {
    name: "Node.js",
    icon: ServerIcon,
    blurb: "Server runtime, environment configuration and npm tooling.",
  },
  {
    name: "Express",
    icon: LayersIcon,
    blurb: "REST routing, middleware chains and centralised error handling.",
  },
  {
    name: "MongoDB / Mongoose",
    icon: DatabaseIcon,
    blurb: "Schemas, validation, references and populate() for authors.",
  },
  {
    name: "REST APIs",
    icon: GlobeIcon,
    blurb: "Resource design, status codes and consistent JSON error shapes.",
  },
  {
    name: "JWT Auth",
    icon: ShieldCheckIcon,
    blurb: "Bearer tokens, protected routes and role-based authorisation.",
  },
  {
    name: "Tailwind CSS",
    icon: WindIcon,
    blurb: "Utility-first responsive layout with a small design-token layer.",
  },
  {
    name: "Git",
    icon: GitBranchIcon,
    blurb: "Branching, focused commits and reviewable change sets.",
  },
];

const HERO_CODE = `const developer = {
  name: "Su Kaicheng (苏楷程)",
  role: "Full-Stack Developer",
  studentId: "24998094",
  course: "Web Data Management & Application",
  stack: ["React", "Node.js", "Express", "MongoDB"],
  auth: "JWT + bcrypt",
};`;

const ABOUT_FACTS = [
  { label: "Now building", value: "This portfolio & blog (MERN stack)" },
  { label: "Focus", value: "REST APIs, authentication, data modelling" },
  { label: "Looking for", value: "Internship / junior developer role" },
  { label: "Based at", value: "University campus · remote-friendly" },
];

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {description && <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/5">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-96 w-[52rem] -translate-x-1/2 rounded-full bg-accent-400/10 blur-[130px]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent-400/25 bg-accent-400/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
            </span>
            Portfolio & Blog · MERN Stack
          </p>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
            Su Kaicheng <span className="text-gradient">(苏楷程)</span>
          </h1>

          <p className="mt-4 text-lg font-medium text-accent-200 sm:text-xl">
            Full-Stack Developer · Web Data Management &amp; Application
          </p>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">
            I build data-driven web applications end to end — from Mongoose schemas and
            JWT-secured Express APIs to the React interfaces on top. This site is my capstone
            project: a live portfolio, a blog and a small admin console, all powered by one REST
            API.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/projects" size="lg">
              View projects
              <ArrowRightIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/blog" variant="secondary" size="lg">
              Read the blog
            </ButtonLink>
            <ButtonLink to="/contact" variant="ghost" size="lg">
              Get in touch
            </ButtonLink>
          </div>

          <dl className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
            {HERO_FACTS.map((fact) => (
              <div
                key={fact.label}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm font-medium leading-snug text-slate-200">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative animate-fade-up lg:justify-self-end">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-accent-400/15 via-transparent to-aqua-400/10 blur-2xl"
          />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/90 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-2 font-mono text-xs text-slate-500">developer.js</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-slate-300">
              <code>{HERO_CODE}</code>
              <span className="mt-4 block text-accent-300">export default developer;</span>
            </pre>
            <div className="flex items-center justify-between border-t border-white/5 px-4 py-3 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                status: shipped · v1.0
              </span>
              <span className="font-mono">UTF-8</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">About</p>
          <h2 id="about-heading" className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Data in the database, clarity in the interface
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            <p>
              I am Su Kaicheng (苏楷程), a final-year student focusing on web data management — how
              applications model, secure and expose data across the stack. This capstone brought the
              whole pipeline together: MongoDB models with validation, an Express API protected by
              JWT and role-based rules, and this React single-page application.
            </p>
            <p>
              Every screen here is backed by the real API rather than mock data: projects and posts
              are seeded in MongoDB, comments and contact messages are stored through the same
              endpoints the admin dashboard uses, and sessions are verified against the token on
              boot.
            </p>
            <p>
              Along the way I cared as much about empty states, error messages and keyboard access
              as about the happy path — a portfolio is only convincing when it behaves like a real
              product.
            </p>
          </div>
        </div>

        <div className="surface h-fit p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
            Quick facts
          </h3>
          <dl className="mt-5 space-y-4">
            {ABOUT_FACTS.map((fact) => (
              <div key={fact.label} className="border-b border-white/5 pb-4 last:border-0 last:pb-0">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {fact.label}
                </dt>
                <dd className="mt-1 text-sm text-slate-200">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-heading" className="border-y border-white/5 bg-ink-900/30">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="Toolkit"
          title="Technologies I build with"
          description="The stack behind this capstone — chosen to cover the full path from database schema to protected interface."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((skill) => {
            const Icon = skill.icon;
            return (
              <li
                key={skill.name}
                className="group flex items-start gap-3.5 rounded-2xl border border-white/10 bg-ink-950/40 p-5 transition duration-300 hover:border-accent-400/35 hover:bg-ink-900/80"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-accent-400/10 text-accent-300 transition group-hover:bg-accent-400/15">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{skill.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{skill.blurb}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FeaturedProjects({ projects, status, error, onRetry }) {
  return (
    <section aria-labelledby="featured-projects-heading" className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <SectionHeading
        eyebrow="Selected work"
        title="Featured projects"
        description="A few of the things I've built — each record is stored in MongoDB and served by the Express API."
        action={
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200"
          >
            All projects
            <ArrowUpRightIcon className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mt-8">
        {status === "loading" && <CardGridSkeleton count={3} />}

        {status === "error" && (
          <ErrorState
            title="Could not load projects"
            message={error}
            onRetry={onRetry}
            className="bg-rose-500/5"
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
      </div>
    </section>
  );
}

function LatestWriting({ posts, status, error, onRetry }) {
  return (
    <section aria-labelledby="latest-writing-heading" className="border-t border-white/5 bg-ink-900/30">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading
          eyebrow="From the blog"
          title="Latest writing"
          description="Notes on building this stack, written as the capstone progressed."
          action={
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200"
            >
              All posts
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-8">
          {status === "loading" && (
            <CardGridSkeleton count={3} gridClassName="sm:grid-cols-2 lg:grid-cols-3" />
          )}

          {status === "error" && (
            <ErrorState title="Could not load the blog" message={error} onRetry={onRetry} />
          )}

          {status === "ready" &&
            (posts.length === 0 ? (
              <EmptyState
                title="No blog posts yet"
                description="The first post is on its way — the latest writing will appear here."
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <BlogPostCard key={post._id} post={post} />
                ))}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-accent-400/20 bg-gradient-to-br from-accent-400/15 via-ink-900 to-ink-950 px-6 py-10 sm:px-12 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-aqua-400/10 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">
            <SparklesIcon className="h-3.5 w-3.5" />
            Open to opportunities
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Have a project, a question or an internship in mind?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Send a message through the contact form — it is stored straight in the site&apos;s inbox
            and comes with a reference number. I reply within two working days.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink to="/contact" size="lg">
              <MailIcon className="h-4 w-4" />
              Contact me
            </ButtonLink>
            <ButtonLink to="/projects" variant="secondary" size="lg">
              Browse projects
            </ButtonLink>
          </div>
          <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-400">
            <ClockIcon className="h-3.5 w-3.5" />
            Average reply time: under two working days
          </p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [projectsStatus, setProjectsStatus] = useState("loading");
  const [projectsError, setProjectsError] = useState("");
  const [projectsRequest, setProjectsRequest] = useState(0);

  const [posts, setPosts] = useState([]);
  const [postsStatus, setPostsStatus] = useState("loading");
  const [postsError, setPostsError] = useState("");
  const [postsRequest, setPostsRequest] = useState(0);

  useEffect(() => {
    let active = true;
    setProjectsStatus("loading");
    setProjectsError("");

    getProjects()
      .then((data) => {
        if (!active) return;
        setProjects(Array.isArray(data) ? data.slice(0, 3) : []);
        setProjectsStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        setProjectsError(error.message);
        setProjectsStatus("error");
      });

    return () => {
      active = false;
    };
  }, [projectsRequest]);

  useEffect(() => {
    let active = true;
    setPostsStatus("loading");
    setPostsError("");

    getPosts()
      .then((data) => {
        if (!active) return;
        setPosts(Array.isArray(data) ? data.slice(0, 3) : []);
        setPostsStatus("ready");
      })
      .catch((error) => {
        if (!active) return;
        setPostsError(error.message);
        setPostsStatus("error");
      });

    return () => {
      active = false;
    };
  }, [postsRequest]);

  return (
    <>
      <Hero />
      <About />
      <Skills />
      <FeaturedProjects
        projects={projects}
        status={projectsStatus}
        error={projectsError}
        onRetry={() => setProjectsRequest((request) => request + 1)}
      />
      <LatestWriting
        posts={posts}
        status={postsStatus}
        error={postsError}
        onRetry={() => setPostsRequest((request) => request + 1)}
      />

      <div className="border-t border-white/5">
        <CtaBanner />
      </div>

      <div className="sr-only" aria-live="polite">
        {projectsStatus === "ready" ? `${pluralize(projects.length, "featured project")} loaded` : ""}
      </div>
      <div className="sr-only" aria-live="polite">
        {postsStatus === "ready" ? `${pluralize(posts.length, "latest post")} loaded` : ""}
      </div>
    </>
  );
}
