import { useState } from "react";
import { LIMITS } from "../lib/validation.js";
import Alert from "./Alert.jsx";
import Button from "./Button.jsx";
import { TextAreaField, TextField } from "./Field.jsx";

const EMPTY_POST = { title: "", content: "" };

function toFormValues(post) {
  if (!post) return EMPTY_POST;
  return {
    title: post.title ?? "",
    content: post.content ?? "",
  };
}

function validate(values) {
  const errors = {};
  const title = values.title.trim();
  const content = values.content.trim();

  if (title.length < LIMITS.postTitle.min || title.length > LIMITS.postTitle.max) {
    errors.title = `Title must be between ${LIMITS.postTitle.min} and ${LIMITS.postTitle.max} characters.`;
  }
  if (!content) {
    errors.content = "Content is required.";
  } else if (content.length > LIMITS.postContent.max) {
    errors.content = `Content must be ${LIMITS.postContent.max} characters or fewer.`;
  }
  return errors;
}

/**
 * Create/edit form for blog posts (author only, enforced by the API).
 * The parent remounts this component with `key` when the edited post changes.
 */
export default function AdminPostForm({ post, onSubmit, onCancel, submitting = false, error = "" }) {
  const [values, setValues] = useState(() => toFormValues(post));
  const [errors, setErrors] = useState({});

  const updateField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      title: values.title.trim(),
      content: values.content.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{post ? "Edit post" : "New post"}</h2>
        <p className="mt-1 text-sm text-slate-400">
          Title is 3–120 characters, content up to 10,000. The author is set from your JWT.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <TextField
        id="post-title"
        label="Title"
        required
        value={values.title}
        onChange={updateField("title")}
        error={errors.title}
        maxLength={LIMITS.postTitle.max}
        placeholder="How the JWT middleware protects the API"
      />

      <TextAreaField
        id="post-content"
        label="Content"
        required
        rows={10}
        value={values.content}
        onChange={updateField("content")}
        error={errors.content}
        maxLength={LIMITS.postContent.max}
        placeholder="Write the post. Blank lines start a new paragraph."
        hint={`${values.content.length}/${LIMITS.postContent.max} characters`}
      />

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/5 pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {post ? "Save changes" : "Publish post"}
        </Button>
      </div>
    </form>
  );
}
