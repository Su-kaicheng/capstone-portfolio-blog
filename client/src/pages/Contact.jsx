import { useState } from "react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { TextAreaField, TextField } from "../components/Field.jsx";
import PageHeader from "../components/PageHeader.jsx";
import {
  CheckCircleIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  SendIcon,
  ShieldCheckIcon,
  UserIcon,
} from "../components/Icons.jsx";
import { sendContactMessage } from "../lib/api.js";
import { formatDateTime, shortId } from "../lib/format.js";
import { LIMITS, isValidEmail } from "../lib/validation.js";

const EMPTY_FORM = { name: "", email: "", message: "" };

function validate(values) {
  const errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();

  if (!name) {
    errors.name = "Please enter your name.";
  } else if (name.length > LIMITS.contactName.max) {
    errors.name = `Name must be ${LIMITS.contactName.max} characters or fewer.`;
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address, e.g. you@example.com.";
  }

  if (!message) {
    errors.message = "Please write a short message.";
  } else if (message.length > LIMITS.contactMessage.max) {
    errors.message = `Message must be ${LIMITS.contactMessage.max} characters or fewer.`;
  }

  return errors;
}

const INFO_ITEMS = [
  {
    icon: ClockIcon,
    title: "Response time",
    body: "I reply to every message within two working days — usually sooner.",
  },
  {
    icon: UserIcon,
    title: "Availability",
    body: "Open to internship and junior developer roles, plus small freelance builds.",
  },
  {
    icon: MapPinIcon,
    title: "Location",
    body: "Based on campus, happy to work remotely with teams in any time zone.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Privacy",
    body: "Your message is stored in this project's own database and never shared or exported.",
  },
];

/** Public contact form → POST /api/contact, with success receipt and API errors. */
export default function Contact() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

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

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    };

    setSubmitting(true);
    setApiError("");

    try {
      const data = await sendContactMessage(payload);
      setReceipt({
        id: data?.id,
        name: payload.name,
        email: payload.email,
        sentAt: new Date().toISOString(),
      });
      setValues(EMPTY_FORM);
      setErrors({});
    } catch (requestError) {
      setApiError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Let's build something"
        description="Questions about the project, feedback on the code, or an opportunity you'd like to discuss — this form is the fastest way to reach me."
      />

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            {receipt ? (
              <div className="surface p-6 sm:p-8">
                <div
                  role="status"
                  aria-live="polite"
                  className="flex flex-col items-start gap-4 sm:flex-row"
                >
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                    <CheckCircleIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Message received</h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Thanks, {receipt.name}. Your message is in the inbox and I will reply to{" "}
                      <span className="font-medium text-slate-100">{receipt.email}</span> within two
                      working days.
                    </p>
                    <dl className="mt-4 space-y-1.5 text-xs text-slate-400">
                      <div className="flex gap-2">
                        <dt>Reference</dt>
                        <dd className="font-mono text-accent-300">{shortId(receipt.id)}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt>Received</dt>
                        <dd>
                          <time dateTime={receipt.sentAt}>{formatDateTime(receipt.sentAt)}</time>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3 border-t border-white/5 pt-5">
                  <Button variant="secondary" onClick={() => setReceipt(null)}>
                    Send another message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="surface space-y-5 p-6 sm:p-8">
                <div>
                  <h2 className="text-lg font-semibold text-white">Send a message</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    No account needed — the form posts straight to the API inbox.
                  </p>
                </div>

                {apiError && <Alert tone="error" title="Message not sent">{apiError}</Alert>}

                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField
                    id="contact-name"
                    label="Name"
                    required
                    autoComplete="name"
                    value={values.name}
                    onChange={updateField("name")}
                    error={errors.name}
                    maxLength={LIMITS.contactName.max}
                    placeholder="Your name"
                  />
                  <TextField
                    id="contact-email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    value={values.email}
                    onChange={updateField("email")}
                    error={errors.email}
                    placeholder="you@example.com"
                  />
                </div>

                <TextAreaField
                  id="contact-message"
                  label="Message"
                  required
                  rows={6}
                  value={values.message}
                  onChange={updateField("message")}
                  error={errors.message}
                  maxLength={LIMITS.contactMessage.max}
                  placeholder="Tell me about the project, question or opportunity…"
                  hint={`${values.message.length}/${LIMITS.contactMessage.max} characters`}
                />

                <div className="flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Rate limited to 5 submissions per 15 minutes.
                  </p>
                  <Button type="submit" loading={submitting}>
                    <SendIcon className="h-4 w-4" />
                    {submitting ? "Sending…" : "Send message"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-4" aria-label="Contact information">
            <div className="surface p-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-400/25 bg-accent-400/10 text-accent-300">
                  <MailIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-semibold text-white">What happens next</h2>
                  <ol className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-400">
                    <li>1. You submit the form and get a reference number.</li>
                    <li>2. The message is stored in this project's database.</li>
                    <li>3. I read it from the admin inbox and reply by email.</li>
                  </ol>
                </div>
              </div>
            </div>

            <ul className="space-y-3">
              {INFO_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink-900/40 p-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-accent-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{item.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-xl border border-dashed border-accent-400/25 bg-accent-400/[0.04] p-4">
              <p className="text-xs leading-relaxed text-slate-400">
                Student details: <span className="text-slate-200">Su Kaicheng (苏楷程)</span> · ID
                24998094 · Web Data Management and Application.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
