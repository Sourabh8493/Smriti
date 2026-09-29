import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import { Field, Input, Button } from "../components/common/UI.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateSignup } from "../utils/validators.js";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateSignup(form);
    setErrors(validation);
    setFormError("");
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await signup(form);
      navigate("/questionnaire", { replace: true });
    } catch (err) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-head">
        <h2>Create your caretaker account</h2>
        <p className="auth-form-sub">
          You'll set up the patient's profile right after this — no email verification
          needed to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Full name" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            placeholder="e.g. Dr. Ranjita Bora"
            value={form.name}
            onChange={update("name")}
            error={errors.name}
          />
        </Field>

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

        <Field
          label="Password"
          htmlFor="password"
          required
          hint="At least 8 characters."
          error={errors.password}
        >
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={form.password}
            onChange={update("password")}
            error={errors.password}
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
            error={errors.confirmPassword}
          />
        </Field>

        {formError && <p className="field__error" style={{ marginBottom: 12 }}>{formError}</p>}

        <Button type="submit" size="lg" style={{ width: "100%" }} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
