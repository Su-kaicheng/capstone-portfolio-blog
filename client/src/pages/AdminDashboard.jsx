import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AdminPostForm from "../components/AdminPostForm.jsx";
import AdminProjectForm from "../components/AdminProjectForm.jsx";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import ErrorState from "../components/ErrorState.jsx";
import RoleBadge from "../components/RoleBadge.jsx";
import { ListSkeleton } from "../components/Loader.jsx";
import PageHeader from "../components/PageHeader.jsx";
import {
  CloseIcon,
  ExternalLinkIcon,
  FileTextIcon,
  InboxIcon,
  LayersIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
} from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  createPost,
  createProject,
  deletePost,
  deleteProject,
  getMessages,
  getPosts,
  getProjects,
  updatePost,
  updateProject,
} from "../lib/api.js";
import { excerpt, formatDate, formatDateTime, initials, pluralize } from "../lib/format.js";

const TABS = [
  { id: "projects", label: "Projects", icon: LayersIcon },
  { id: "posts", label: "Blog posts", icon: FileTextIcon },
  { id: "messages", label: "Messages", icon: InboxIcon },
];

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="surface flex items-center gap-4 p-5">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-accent-400/10 text-accent-300">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-white">{value}</p>
        <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

function ConfirmActions({ question, onConfirm, onCancel, loading, confirmLabel = "Delete" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-rose-200">{question}</span>
      <Button size="sm" variant="danger" loading={loading} onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

/**
 * Protected admin dashboard.
 * - Projects: admin-only create/edit/delete
 * - Blog posts: create for any account, edit/delete only for the author
 * - Messages: admin-only inbox
 * The active section is kept in the URL (`?tab=`) so it survives refreshes.
 */
export default function AdminDashboard() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.id === requestedTab) ? requestedTab : "projects";

  const [projects, setProjects] = useState([]);
  const [projectsStatus, setProjectsStatus] = useState("loading");
  const [projectsError, setProjectsError] = useState("");

  const [posts, setPosts] = useState([]);
  const [postsStatus, setPostsStatus] = useState("loading");
  const [postsError, setPostsError] = useState("");

  const [messages, setMessages] = useState([]);
  const [messagesStatus, setMessagesStatus] = useState("idle");
  const [messagesError, setMessagesError] = useState("");

  const [feedback, setFeedback] = useState(null);
  const [projectForm, setProjectForm] = useState({ open: false, editing: null });
  const [postForm, setPostForm] = useState({ open: false, editing: null });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProjects = useCallback(async () => {
    setProjectsStatus("loading");
    setProjectsError("");
    try {
      const data = await getProjects();
      if (!mountedRef.current) return;
      setProjects(Array.isArray(data) ? data : []);
      setProjectsStatus("ready");
    } catch (error) {
      if (!mountedRef.current) return;
      setProjectsError(error.message);
      setProjectsStatus("error");
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setPostsStatus("loading");
    setPostsError("");
    try {
      const data = await getPosts();
      if (!mountedRef.current) return;
      setPosts(Array.isArray(data) ? data : []);
      setPostsStatus("ready");
    } catch (error) {
      if (!mountedRef.current) return;
      setPostsError(error.message);
      setPostsStatus("error");
    }
  }, []);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    setMessagesStatus("loading");
    setMessagesError("");
    try {
      const data = await getMessages(token);
      if (!mountedRef.current) return;
      setMessages(Array.isArray(data) ? data : []);
      setMessagesStatus("ready");
    } catch (error) {
      if (!mountedRef.current) return;
      setMessagesError(error.message);
      setMessagesStatus("error");
    }
  }, [token]);

  useEffect(() => {
    loadProjects();
    loadPosts();
  }, [loadProjects, loadPosts]);

  // Admins load the inbox once so the dashboard stat card is accurate; the
  // Messages section can also refresh it manually.
  useEffect(() => {
    if (!isAdmin || messagesStatus !== "idle") return;
    loadMessages();
  }, [isAdmin, messagesStatus, loadMessages]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeout = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timeout);
  }, [feedback]);

  /* ----------------------------- projects ----------------------------- */

  const openCreateProject = () => {
    setProjectForm({ open: true, editing: null });
    setFormError("");
    setConfirmDelete(null);
  };

  const openEditProject = (project) => {
    setProjectForm({ open: true, editing: project });
    setFormError("");
    setConfirmDelete(null);
  };

  const closeProjectForm = () => {
    setProjectForm({ open: false, editing: null });
    setFormError("");
  };

  const handleProjectSubmit = async (values) => {
    setFormSubmitting(true);
    setFormError("");
    try {
      if (projectForm.editing) {
        await updateProject(projectForm.editing._id, values, token);
        setFeedback({ tone: "success", message: "Project updated." });
      } else {
        await createProject(values, token);
        setFeedback({ tone: "success", message: "Project created." });
      }
      if (!mountedRef.current) return;
      setProjectForm({ open: false, editing: null });
      await loadProjects();
    } catch (error) {
      if (mountedRef.current) setFormError(error.message);
    } finally {
      if (mountedRef.current) setFormSubmitting(false);
    }
  };

  const handleProjectDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteProject(id, token);
      if (!mountedRef.current) return;
      setFeedback({ tone: "success", message: "Project deleted." });
      setConfirmDelete(null);
      await loadProjects();
    } catch (error) {
      if (mountedRef.current) setFeedback({ tone: "error", message: error.message });
    } finally {
      if (mountedRef.current) setDeletingId(null);
    }
  };

  /* ------------------------------ posts ------------------------------- */

  const openCreatePost = () => {
    setPostForm({ open: true, editing: null });
    setFormError("");
    setConfirmDelete(null);
  };

  const openEditPost = (post) => {
    setPostForm({ open: true, editing: post });
    setFormError("");
    setConfirmDelete(null);
  };

  const closePostForm = () => {
    setPostForm({ open: false, editing: null });
    setFormError("");
  };

  const handlePostSubmit = async (values) => {
    setFormSubmitting(true);
    setFormError("");
    try {
      if (postForm.editing) {
        await updatePost(postForm.editing._id, values, token);
        setFeedback({ tone: "success", message: "Post updated." });
      } else {
        await createPost(values, token);
        setFeedback({ tone: "success", message: "Post published." });
      }
      if (!mountedRef.current) return;
      setPostForm({ open: false, editing: null });
      await loadPosts();
    } catch (error) {
      if (mountedRef.current) setFormError(error.message);
    } finally {
      if (mountedRef.current) setFormSubmitting(false);
    }
  };

  const handlePostDelete = async (id) => {
    setDeletingId(id);
    try {
      await deletePost(id, token);
      if (!mountedRef.current) return;
      setFeedback({ tone: "success", message: "Post deleted." });
      setConfirmDelete(null);
      await loadPosts();
    } catch (error) {
      if (mountedRef.current) setFeedback({ tone: "error", message: error.message });
    } finally {
      if (mountedRef.current) setDeletingId(null);
    }
  };

  const canManagePost = (post) => Boolean(user?._id) && post.author?._id === user._id;

  const isConfirming = (type, id) => confirmDelete?.type === type && confirmDelete?.id === id;

  /* ------------------------------ render ------------------------------ */

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Create and curate the content behind the public site. Every write is sent with your JWT, so the API can enforce author and admin rules."
      >
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-400/15 text-xs font-bold text-accent-300">
            {initials(user?.username)}
          </span>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-white">{user?.username}</p>
            <p className="text-[11px] text-slate-400">{user?.email}</p>
          </div>
          <RoleBadge role={user?.role} className="ml-1" />
        </div>
      </PageHeader>

      <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={LayersIcon}
            label="Projects"
            value={projectsStatus === "ready" ? String(projects.length) : "…"}
            hint="Public gallery"
          />
          <StatCard
            icon={FileTextIcon}
            label="Blog posts"
            value={postsStatus === "ready" ? String(posts.length) : "…"}
            hint="Published writing"
          />
          <StatCard
            icon={InboxIcon}
            label="Inbox"
            value={!isAdmin ? "—" : messagesStatus === "ready" ? String(messages.length) : "…"}
            hint="Contact messages"
          />
        </div>

        {feedback && (
          <div className="relative mt-6">
            <Alert tone={feedback.tone}>{feedback.message}</Alert>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss notification"
              className="absolute right-2.5 top-2.5 rounded-lg p-1 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <nav aria-label="Dashboard sections" className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.id === "projects" ? "/admin" : `/admin?tab=${tab.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-accent-400/15 text-accent-200 ring-1 ring-inset ring-accent-400/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* --------------------------- projects --------------------------- */}
        {activeTab === "projects" && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Projects</h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  {projectsStatus === "ready"
                    ? pluralize(projects.length, "project")
                    : "Loading project list…"}
                </p>
              </div>
              {isAdmin && !projectForm.open && (
                <Button size="sm" onClick={openCreateProject}>
                  <PlusIcon className="h-4 w-4" />
                  New project
                </Button>
              )}
            </div>

            {!isAdmin && (
              <Alert tone="info" title="Read-only access">
                Project writes are admin-only. Sign in with the seeded admin account to create,
                edit or delete projects.
              </Alert>
            )}

            {projectForm.open && (
              <div className="surface p-6">
                <AdminProjectForm
                  key={projectForm.editing?._id ?? "new-project"}
                  project={projectForm.editing ?? undefined}
                  onSubmit={handleProjectSubmit}
                  onCancel={closeProjectForm}
                  submitting={formSubmitting}
                  error={formError}
                />
              </div>
            )}

            {projectsStatus === "loading" && (
              <div className="surface overflow-hidden">
                <ListSkeleton rows={4} />
              </div>
            )}

            {projectsStatus === "error" && (
              <ErrorState
                title="Projects could not be loaded"
                message={projectsError}
                onRetry={loadProjects}
              />
            )}

            {projectsStatus === "ready" &&
              (projects.length === 0 ? (
                <EmptyState
                  icon={LayersIcon}
                  title="No projects yet"
                  description="Create the first project to populate the public gallery."
                />
              ) : (
                <ul className="surface divide-y divide-white/5 overflow-hidden">
                  {projects.map((project) => (
                    <li
                      key={project._id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{project.title}</p>
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 transition hover:text-accent-300"
                              aria-label={`Open live site for ${project.title}`}
                            >
                              <ExternalLinkIcon className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <p className="mt-0.5 max-w-xl truncate text-xs text-slate-400">
                          {excerpt(project.description, 120)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Updated {formatDate(project.updatedAt)} ·{" "}
                          {project.user?.username ?? "Unknown author"}
                        </p>
                      </div>

                      {isAdmin && (
                        <div className="shrink-0">
                          {isConfirming("project", project._id) ? (
                            <ConfirmActions
                              question="Delete this project?"
                              loading={deletingId === project._id}
                              onConfirm={() => handleProjectDelete(project._id)}
                              onCancel={() => setConfirmDelete(null)}
                            />
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => openEditProject(project)}>
                                <PencilIcon className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setConfirmDelete({ type: "project", id: project._id })}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
          </div>
        )}

        {/* ----------------------------- posts ---------------------------- */}
        {activeTab === "posts" && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Blog posts</h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  {postsStatus === "ready"
                    ? `${pluralize(posts.length, "post")} · you can only edit your own`
                    : "Loading posts…"}
                </p>
              </div>
              {!postForm.open && (
                <Button size="sm" onClick={openCreatePost}>
                  <PlusIcon className="h-4 w-4" />
                  New post
                </Button>
              )}
            </div>

            {postForm.open && (
              <div className="surface p-6">
                <AdminPostForm
                  key={postForm.editing?._id ?? "new-post"}
                  post={postForm.editing ?? undefined}
                  onSubmit={handlePostSubmit}
                  onCancel={closePostForm}
                  submitting={formSubmitting}
                  error={formError}
                />
              </div>
            )}

            {postsStatus === "loading" && (
              <div className="surface overflow-hidden">
                <ListSkeleton rows={4} />
              </div>
            )}

            {postsStatus === "error" && (
              <ErrorState
                title="Posts could not be loaded"
                message={postsError}
                onRetry={loadPosts}
              />
            )}

            {postsStatus === "ready" &&
              (posts.length === 0 ? (
                <EmptyState
                  icon={FileTextIcon}
                  title="No posts yet"
                  description="Publish the first post — it appears on the public blog immediately."
                />
              ) : (
                <ul className="surface divide-y divide-white/5 overflow-hidden">
                  {posts.map((post) => {
                    const mine = canManagePost(post);
                    return (
                      <li
                        key={post._id}
                        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{post.title}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {excerpt(post.content, 120)}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {post.author?.username ?? "Unknown author"} ·{" "}
                            {formatDate(post.createdAt)}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {isConfirming("post", post._id) ? (
                            <ConfirmActions
                              question="Delete this post?"
                              loading={deletingId === post._id}
                              onConfirm={() => handlePostDelete(post._id)}
                              onCancel={() => setConfirmDelete(null)}
                            />
                          ) : mine ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => openEditPost(post)}>
                                <PencilIcon className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setConfirmDelete({ type: "post", id: post._id })}
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                              <LockIcon className="h-3 w-3" />
                              Author only
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ))}
          </div>
        )}

        {/* --------------------------- messages --------------------------- */}
        {activeTab === "messages" && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Messages</h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  {!isAdmin
                    ? "Restricted to admin accounts."
                    : messagesStatus === "ready"
                      ? pluralize(messages.length, "message")
                      : "Contact form submissions"}
                </p>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadMessages}
                  disabled={messagesStatus === "loading"}
                >
                  <RefreshIcon className="h-4 w-4" />
                  Refresh inbox
                </Button>
              )}
            </div>

            {!isAdmin ? (
              <div className="surface flex items-start gap-4 p-6">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent-300">
                  <LockIcon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Inbox is admin-only</h3>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
                    Contact messages are read with an admin JWT. Log in with the seeded admin
                    account (<span className="font-mono text-slate-300">admin@portfolio.dev</span>)
                    to view the inbox.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messagesStatus === "loading" && (
                  <div className="space-y-3">
                    <ListSkeleton rows={3} />
                  </div>
                )}

                {messagesStatus === "error" && (
                  <ErrorState
                    title="Messages could not be loaded"
                    message={messagesError}
                    onRetry={loadMessages}
                  />
                )}

                {messagesStatus === "ready" &&
                  (messages.length === 0 ? (
                    <EmptyState
                      icon={InboxIcon}
                      title="No messages yet"
                      description="Messages sent from the public contact form will land here."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {messages.map((message) => (
                        <li key={message._id} className="surface p-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-accent-400/10 text-xs font-bold text-accent-300">
                                {initials(message.name)}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white">{message.name}</p>
                                <a
                                  href={`mailto:${message.email}`}
                                  className="text-xs text-accent-300 transition hover:text-accent-200"
                                >
                                  {message.email}
                                </a>
                              </div>
                            </div>
                            <time dateTime={message.createdAt} className="text-xs text-slate-500">
                              {formatDateTime(message.createdAt)}
                            </time>
                          </div>
                          <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-slate-300">
                            {message.message}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ))}
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}
