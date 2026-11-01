import { ButtonLink } from "../components/Button.jsx";
import { ArrowLeftIcon } from "../components/Icons.jsx";

/** Friendly catch-all 404 route. */
export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 py-24 text-center sm:px-8">
      <p className="font-mono text-6xl font-bold tracking-tight text-accent-400/80 sm:text-8xl">404</p>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
        This page could not be found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
        The link may be broken or the page may have moved. Head back home, browse the projects, or
        read the latest writing instead.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink to="/">
          <ArrowLeftIcon className="h-4 w-4" />
          Back home
        </ButtonLink>
        <ButtonLink to="/projects" variant="secondary">
          View projects
        </ButtonLink>
        <ButtonLink to="/blog" variant="ghost">
          Read the blog
        </ButtonLink>
      </div>
    </section>
  );
}
