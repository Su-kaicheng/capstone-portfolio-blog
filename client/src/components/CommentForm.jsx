import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { createComment } from "../lib/api.js";
import { LIMITS } from "../lib/validation.js";
import Alert from "./Alert.jsx";
import Button, { ButtonLink } from "./Button.jsx";
import { TextAreaField } from "./Field.jsx";
import { LockIcon, SendIcon } from "./Icons.jsx";

/**
 * Comment composer. Guests see a login prompt; authenticated users get a
 * controlled textarea that POSTs to /api/blog/:postId/comments with the JWT.
 */
export default function CommentForm({ postId, onCreated }) {
  const { isAuthenticated, user, token } = useAuth();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-accent-300">
            <LockIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-white">Log in to join the discussion</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              Comments are linked to your account, so the author can reply to you directly.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <ButtonLink to="/login" state={{ from: `/blog/${postId}` }} size="sm">
            Log in
          </ButtonLink>
          <ButtonLink to="/register" variant="secondary" size="sm">
            Register
          </ButtonLink>
        </div>
      </div>
    );
  }

  const handleChange = (event) => {
    setBody(event.target.value);
    if (error) setError("");
    if (success) setSuccess(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = body.trim();

    if (!trimmed) {
      setError("Please write a comment before posting.");
      return;
    }
    if (trimmed.length > LIMITS.comment.max) {
      setError(`Comments can be at most ${LIMITS.comment.max} characters.`);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const comment = await createComment(postId, { body: trimmed }, token);
      setBody("");
      setSuccess(true);
      onCreated?.(comment);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="surface space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-white">Leave a comment</h2>
        <span className="text-xs text-slate-400">
          Signed in as <span className="font-medium text-slate-200">{user?.username}</span>
        </span>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">Your comment is live — thanks for joining the conversation.</Alert>}

      <TextAreaField
        id="comment-body"
        label="Comment"
        rows={4}
        value={body}
        onChange={handleChange}
        placeholder="Share a thought, a question or some feedback…"
        maxLength={LIMITS.comment.max}
        hint={`${body.length}/${LIMITS.comment.max} characters`}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          <SendIcon className="h-4 w-4" />
          {submitting ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
