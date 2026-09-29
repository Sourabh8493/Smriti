import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import { Field, Input, Button } from "../components/common/UI.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateLogin } from "../utils/validators.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateLogin(form);
    setErrors(validation);
    setFormError("");
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(err.message || "Couldn't log you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-head">
        <h2>Welcome back</h2>
        <p className="auth-form-sub">Log in to continue caring for your patient.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email address" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
          />
        </Field>

        <Field label="Password" htmlFor="password" required error={errors.password}>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
          />
        </Field>

        {formError && <p className="field__error" style={{ marginBottom: 12 }}>{formError}</p>}

        <Button type="submit" size="lg" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="auth-switch">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
