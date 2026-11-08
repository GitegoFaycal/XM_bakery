import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Croissant } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (form.password.length < 6) errors.password = 'Use at least 6 characters';
  if (form.confirm !== form.password) errors.confirm = 'Passwords do not match';
  return errors;
}

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={from || (user?.role === 'admin' ? '/dashboard' : '/orders')} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const created = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(`Account created. Welcome, ${created.name}!`);
      navigate(from || (created.role === 'admin' ? '/dashboard' : '/products'), { replace: true });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <span className="inline-flex rounded-xl bg-brand-600 p-3 text-white">
          <Croissant className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-stone-900">Create your account</h1>
        <p className="mt-1 text-sm text-stone-500">Keep your order history and check out faster.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        noValidate
      >
        <Input
          label="Full name"
          autoComplete="name"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          placeholder="Jane Doe"
          required
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="you@example.com"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            required
          />
        </div>
        {serverError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Create account
        </Button>
        <p className="text-center text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
