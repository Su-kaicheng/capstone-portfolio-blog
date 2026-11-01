import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { TextField } from "../components/Field.jsx";
import { LockIcon } from "../components/Icons.jsx";
import Loader from "../components/Loader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { isValidEmail } from "../lib/validation.js";

const DEMO_EMAIL = "admin@portfolio.dev";
const DEMO_PASSWORD = "Admin123!";

function validate(values) {
  const errors = {};
  if (!values.email.trim()) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!values.password) {
    errors.password = "Please enter your password.";
  } else if (values.password.length < 6) {
    errors.password = "Passwords are at least 6 characters long.";
  }
  return errors;
}

/** Login page. Authenticated visitors are redirected back to where they came from. */
export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
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
      await login({ email: values.email.trim(), password: values.password });
      // The auth state change above re-renders this page, which redirects below.
    } catch (requestError) {
      setApiError(requestError.message);
      setSubmitting(false);
    }
  };

  const fillDemoCredentials = () => {
    setValues({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setErrors({});
    setApiError("");
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
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">
          Log in to comment on posts or manage the portfolio from the admin dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="surface mt-8 space-y-5 p-6 sm:p-8">
        {apiError && <Alert tone="error" title="Could not log in">{apiError}</Alert>}

        <TextField
          id="login-email"
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
          id="login-password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={values.password}
          onChange={updateField("password")}
          error={errors.password}
          placeholder="Your password"
        />

        <Button type="submit" className="w-full" loading={submitting}>
          <LockIcon className="h-4 w-4" />
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <div className="mt-5 rounded-2xl border border-dashed border-accent-400/30 bg-accent-400/[0.04] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-300">
          Demo admin account
        </p>
        <p className="mt-1.5 font-mono text-xs text-slate-300">
          {DEMO_EMAIL} · {DEMO_PASSWORD}
        </p>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="mt-2 text-xs font-semibold text-accent-300 underline decoration-accent-400/40 underline-offset-4 transition-colors hover:text-accent-200"
        >
          Fill demo credentials
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        New here?{" "}
        <Link
          to="/register"
          className="font-semibold text-accent-300 underline underline-offset-4 transition-colors hover:text-accent-200"
        >
          Create an account
        </Link>
      </p>
    </section>
  );
}
