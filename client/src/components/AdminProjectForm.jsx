import { useState } from "react";
import { LIMITS, isValidOptionalHttpsUrl } from "../lib/validation.js";
import Alert from "./Alert.jsx";
import Button from "./Button.jsx";
import { TextAreaField, TextField } from "./Field.jsx";

const EMPTY_PROJECT = {
  title: "",
  description: "",
  imageUrl: "",
  repoUrl: "",
  liveUrl: "",
};

function toFormValues(project) {
  if (!project) return EMPTY_PROJECT;
  return {
    title: project.title ?? "",
    description: project.description ?? "",
    imageUrl: project.imageUrl ?? "",
    repoUrl: project.repoUrl ?? "",
    liveUrl: project.liveUrl ?? "",
  };
}

function validate(values) {
  const errors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (title.length < LIMITS.projectTitle.min || title.length > LIMITS.projectTitle.max) {
    errors.title = `Title must be between ${LIMITS.projectTitle.min} and ${LIMITS.projectTitle.max} characters.`;
  }
  if (!description) {
    errors.description = "A description is required.";
  } else if (description.length > LIMITS.projectDescription.max) {
    errors.description = `Description must be ${LIMITS.projectDescription.max} characters or fewer.`;
  }
  if (!isValidOptionalHttpsUrl(values.imageUrl)) {
    errors.imageUrl = "Image URL must be an https:// address.";
  }
  if (!isValidOptionalHttpsUrl(values.repoUrl)) {
    errors.repoUrl = "Repository URL must be an https:// address.";
  }
  if (!isValidOptionalHttpsUrl(values.liveUrl)) {
    errors.liveUrl = "Live URL must be an https:// address.";
  }
  return errors;
}

/**
 * Create/edit form for projects (admin only).
 * The parent remounts this component with `key` when the edited record changes.
 */
export default function AdminProjectForm({ project, onSubmit, onCancel, submitting = false, error = "" }) {
  const [values, setValues] = useState(() => toFormValues(project));
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
      description: values.description.trim(),
      imageUrl: values.imageUrl.trim(),
      repoUrl: values.repoUrl.trim(),
      liveUrl: values.liveUrl.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">
          {project ? "Edit project" : "New project"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Title is 3–120 characters, description up to 2000. Links must use https:// or stay empty.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <TextField
        id="project-title"
        label="Title"
        required
        value={values.title}
        onChange={updateField("title")}
        error={errors.title}
        maxLength={LIMITS.projectTitle.max}
        placeholder="Portfolio & Blog Platform"
      />

      <TextAreaField
        id="project-description"
        label="Description"
        required
        rows={5}
        value={values.description}
        onChange={updateField("description")}
        error={errors.description}
        maxLength={LIMITS.projectDescription.max}
        placeholder="What the project does, which stack it uses and what you learned."
        hint={`${values.description.length}/${LIMITS.projectDescription.max} characters`}
      />

      <TextField
        id="project-image"
        label="Image URL"
        type="url"
        value={values.imageUrl}
        onChange={updateField("imageUrl")}
        error={errors.imageUrl}
        placeholder="https://…"
        hint="Optional — leave empty to use the generated gradient cover."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="project-repo"
          label="Repository URL"
          type="url"
          value={values.repoUrl}
          onChange={updateField("repoUrl")}
          error={errors.repoUrl}
          placeholder="https://github.com/…"
        />
        <TextField
          id="project-live"
          label="Live URL"
          type="url"
          value={values.liveUrl}
          onChange={updateField("liveUrl")}
          error={errors.liveUrl}
          placeholder="https://…"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/5 pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {project ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
