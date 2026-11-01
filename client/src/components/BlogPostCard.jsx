import { Link } from "react-router-dom";
import { excerpt, formatDate, initials, readingTime } from "../lib/format.js";
import { ArrowRightIcon, CalendarIcon } from "./Icons.jsx";

/** Blog list card: date, reading time, title, excerpt, author and CTA. */
export default function BlogPostCard({ post }) {
  const detailsPath = `/blog/${post._id}`;
  const authorName = post.author?.username ?? "Unknown author";

  return (
    <article className="group flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-ink-900/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-accent-400/35 hover:bg-ink-900/80 hover:shadow-[0_30px_70px_-40px_rgba(52,211,153,0.45)]">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" />
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
        </span>
        <span aria-hidden="true">·</span>
        <span>{readingTime(post.content)} min read</span>
      </div>

      <h3 className="text-xl font-semibold leading-snug text-white">
        <Link to={detailsPath} className="transition-colors hover:text-accent-300">
          {post.title}
        </Link>
      </h3>

      <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
        {excerpt(post.content, 200) || "No content available."}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/5 pt-4">
        <span className="inline-flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-accent-400/10 text-[10px] font-bold text-accent-300">
            {initials(authorName)}
          </span>
          {authorName}
        </span>
        <Link
          to={detailsPath}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-200"
        >
          Read more
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
