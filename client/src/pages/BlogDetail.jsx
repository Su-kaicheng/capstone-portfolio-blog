import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CommentForm from "../components/CommentForm.jsx";
import CommentList from "../components/CommentList.jsx";
import { ButtonLink } from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  UserIcon,
} from "../components/Icons.jsx";
import Loader from "../components/Loader.jsx";
import { getPost } from "../lib/api.js";
import { formatDate, initials, readingTime, splitParagraphs } from "../lib/format.js";

/** Blog detail page: post body (rendered safely as text) + comments thread. */
export default function BlogDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");
    setPost(null);
    setComments([]);

    getPost(id)
      .then((data) => {
        if (!active) return;
        setPost(data);
        setComments(Array.isArray(data.comments) ? data.comments : []);
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

  const handleCommentCreated = (comment) => {
    if (!comment) return;
    setComments((current) => [...current, comment]);
  };

  if (status === "loading") {
    return <Loader className="py-32" label="Loading post…" />;
  }

  if (status === "not-found") {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <EmptyState
          icon={FileTextIcon}
          title="Post not found"
          description="This post may have been removed, or the link is incorrect."
        >
          <ButtonLink to="/blog" variant="secondary" size="sm">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to the blog
          </ButtonLink>
        </EmptyState>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
        <ErrorState
          title="Post could not be loaded"
          message={error}
          onRetry={() => setRequest((current) => current + 1)}
        >
          <ButtonLink to="/blog" variant="ghost" size="sm">
            Back to the blog
          </ButtonLink>
        </ErrorState>
      </div>
    );
  }

  const paragraphs = splitParagraphs(post.content);
  const authorName = post.author?.username ?? "Unknown author";

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-accent-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to the blog
      </Link>

      <header className="mt-6 border-b border-white/10 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-300">Blog post</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-accent-400/10 text-[10px] font-bold text-accent-300">
              {initials(authorName)}
            </span>
            <span className="font-medium text-slate-200">{authorName}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-3.5 w-3.5" />
            {readingTime(post.content)} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" />
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </span>
        </div>
      </header>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-slate-300 sm:text-base">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-slate-500">This post has no content yet.</p>
        )}
      </div>

      <div className="mt-12 space-y-8 border-t border-white/10 pt-8">
        <CommentList comments={comments} />
        <CommentForm postId={post._id} onCreated={handleCommentCreated} />
      </div>
    </article>
  );
}
