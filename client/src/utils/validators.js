export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateSignup({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = "Enter your full name.";
  if (!email || !isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password || password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match.";
  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email || !isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!password) errors.password = "Enter your password.";
  return errors;
}
