import {
  formatDateTime,
  formatRelativeDate,
  initials,
} from "../lib/format.js";
import EmptyState from "./EmptyState.jsx";

/** Discussion thread for a blog post. */
export default function CommentList({ comments = [] }) {
  return (
    <section aria-labelledby="comments-heading" className="space-y-5">
      <h2 id="comments-heading" className="text-lg font-semibold text-white">
        Comments
        <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 align-middle text-xs font-medium text-slate-300">
          {comments.length}
        </span>
      </h2>

      {comments.length === 0 ? (
        <EmptyState
          title="No comments yet"
          description="Start the conversation — questions and feedback are both welcome."
        />
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => {
            const authorName = comment.author?.username ?? "Unknown user";
            return (
              <li key={comment._id} className="surface p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-accent-400/10 text-xs font-bold text-accent-300">
                    {initials(authorName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{authorName}</p>
                    <time
                      dateTime={comment.createdAt}
                      title={formatDateTime(comment.createdAt)}
                      className="text-xs text-slate-500"
                    >
                      {formatRelativeDate(comment.createdAt)}
                    </time>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-slate-300">
                  {comment.body}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
