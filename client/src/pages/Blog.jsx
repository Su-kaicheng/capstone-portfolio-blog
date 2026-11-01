import { useEffect, useState } from "react";
import BlogPostCard from "../components/BlogPostCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import { FileTextIcon } from "../components/Icons.jsx";
import { CardGridSkeleton } from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { getPosts } from "../lib/api.js";
import { pluralize } from "../lib/format.js";

/** Public blog index backed by GET /api/blog (newest first). */
export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError("");

    getPosts()
      .then((data) => {
        if (!active) return;
        setPosts(Array.isArray(data) ? data : []);
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
        eyebrow="Writing"
        title="Blog"
        description="Field notes from building the MERN stack for this capstone: data modelling, authentication and the small details that make an interface feel finished."
      >
        {status === "ready" && posts.length > 0 && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            {pluralize(posts.length, "post")}
          </span>
        )}
      </PageHeader>

      <section aria-label="Blog posts" className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        {status === "loading" && (
          <CardGridSkeleton count={4} gridClassName="sm:grid-cols-2" />
        )}

        {status === "error" && (
          <ErrorState
            title="Blog posts could not be loaded"
            message={error}
            onRetry={() => setRequest((current) => current + 1)}
          />
        )}

        {status === "ready" &&
          (posts.length === 0 ? (
            <EmptyState
              icon={FileTextIcon}
              title="Nothing published yet"
              description="Posts written from the admin dashboard appear here as soon as they are published."
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <BlogPostCard key={post._id} post={post} />
              ))}
            </div>
          ))}
      </section>
    </>
  );
}
