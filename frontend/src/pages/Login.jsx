import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Container from '../components/layout/Container';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { useForm } from '../hooks/useForm';
import { validators } from '../utils/validation';
import { ROUTES } from '../constants/routes';

const validationRules = {
  email: [
    (v) => validators.required(v, 'Email'),
    validators.email,
  ],
  password: [
    (v) => validators.required(v, 'Password'),
  ],
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || ROUTES.APPLICANT;

  const { values, errors, touched, isSubmitting, submitError, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    validationRules,
    onSubmit: async (data) => {
      const authUser = await login(data.email, data.password);
      const destination = authUser.role === 'officer' ? '/officer' : ROUTES.APPLICANT;
      navigate(location.state?.from?.pathname || destination, { replace: true });
    },
  });

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar />

      <Container className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-charcoal-900">
              Welcome back
            </h1>
            <p className="mt-2 text-charcoal-500 text-sm">
              Sign in to your LoanLens account
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                placeholder="Enter your password"
                required
                autoComplete="current-password"
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
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-charcoal-500">
              Don&apos;t have an account?{' '}
              <Link
                to={ROUTES.REGISTER}
                className="font-medium text-charcoal-900 hover:underline"
              >
                Create one
              </Link>
            </p>
          </Card>
        </div>
      </Container>
    </div>
  );
}
