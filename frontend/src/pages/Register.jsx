import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validation';
import { ROUTES } from '../constants/routes';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const validationRules = {
    name: [
      (v) => validators.required(v, 'Full name'),
      validators.minLength(2, 'Name'),
      validators.maxLength(100, 'Name'),
    ],
    email: [
      (v) => validators.required(v, 'Email'),
      validators.email,
    ],
    password: [
      (v) => validators.required(v, 'Password'),
      validators.minLength(8, 'Password'),
    ],
    confirmPassword: [
      (v) => validators.required(v, 'Password confirmation'),
    ],
  };

  // Add dynamic password match rule
  const dynamicRules = {
    ...validationRules,
    confirmPassword: [
      ...validationRules.confirmPassword,
    ],
  };

  const { values, errors, touched, isSubmitting, submitError, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validationRules: dynamicRules,
    onSubmit: async (data) => {
      // Validate password match
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      await register(data.name, data.email, data.password);
      navigate(ROUTES.APPLICANT, { replace: true });
    },
  });

  // Derive password match error
  const confirmPasswordError = touched.confirmPassword
    ? errors.confirmPassword || (values.confirmPassword && values.password !== values.confirmPassword ? 'Passwords do not match' : null)
    : null;

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <Container className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-charcoal-900">
              Create your account
            </h1>
            <p className="mt-2 text-charcoal-500 text-sm">
              Start your loan application with LoanLens AI
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Input
                label="Full name"
                name="name"
                type="text"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name ? errors.name : null}
                placeholder="Your full name"
                required
                autoComplete="name"
              />

              <Input
                label="Email address"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email ? errors.email : null}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password ? errors.password : null}
                placeholder="Minimum 8 characters"
                helperText="Must be at least 8 characters"
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={confirmPasswordError}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />

              {submitError && (
                <div className="p-3 rounded-lg bg-error-100 text-error-600 text-sm" role="alert">
                  {submitError}
                </div>
              )}

              <Button
                type="submit"
                loading={isSubmitting}
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-charcoal-500">
              Already have an account?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-medium text-charcoal-900 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </Container>
    </div>
  );
}
