import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { TextField } from "../components/Field.jsx";
import { UserIcon } from "../components/Icons.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { LIMITS, isValidEmail, isValidUsername } from "../lib/validation.js";

const EMPTY_FORM = { username: "", email: "", password: "", confirmPassword: "" };

function validate(values) {
  const errors = {};

  if (!values.username.trim()) {
    errors.username = "Please choose a username.";
  } else if (!isValidUsername(values.username)) {
    errors.username = "Use 3–30 letters, digits or underscores (no spaces).";
  }

  if (!values.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Please choose a password.";
  } else if (values.password.length < LIMITS.password.min) {
    errors.password = `Passwords need at least ${LIMITS.password.min} characters.`;
  } else if (values.password.length > LIMITS.password.max) {
    errors.password = `Passwords can be at most ${LIMITS.password.max} characters.`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/** Registration page: creates an account, auto-logs in and redirects. */
export default function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || "/";

  const updateField = (field) => (event) => {
    const { value } = event.target;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    if (apiError) setApiError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setApiError("");

    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      // Successful registration signs the user in; this page then redirects.
    } catch (requestError) {
      setApiError(requestError.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader className="py-32" label="Checking your session…" />;
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <section className="mx-auto w-full max-w-md px-5 py-16 sm:px-8">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-aqua-400 font-mono text-base font-bold text-ink-950">
          SK
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Accounts can comment on posts and publish their own writing. Projects stay admin-only.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="surface mt-8 space-y-5 p-6 sm:p-8">
        {apiError && <Alert tone="error" title="Could not create the account">{apiError}</Alert>}

        <TextField
          id="register-username"
          label="Username"
          required
          autoComplete="username"
          value={values.username}
          onChange={updateField("username")}
          error={errors.username}
          hint="3–30 letters, digits or underscores."
          maxLength={LIMITS.username.max}
          placeholder="sukaicheng"
        />

        <TextField
          id="register-email"
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={updateField("email")}
          error={errors.email}
          placeholder="you@example.com"
        />

        <TextField
          id="register-password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={values.password}
          onChange={updateField("password")}
          error={errors.password}
          hint={`At least ${LIMITS.password.min} characters.`}
          maxLength={LIMITS.password.max}
          placeholder="Create a password"
        />

        <TextField
          id="register-confirm"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={updateField("confirmPassword")}
          error={errors.confirmPassword}
          placeholder="Repeat the password"
        />

        <Button type="submit" className="w-full" loading={submitting}>
          <UserIcon className="h-4 w-4" />
          {submitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-xs text-slate-500">
          New accounts always get the standard user role. Demo admin access uses the seeded
          account.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link
          to="/login"
          state={location.state}
          className="font-semibold text-accent-300 underline underline-offset-4 transition-colors hover:text-accent-200"
        >
          Log in
        </Link>
      </p>
    </section>
  );
}
