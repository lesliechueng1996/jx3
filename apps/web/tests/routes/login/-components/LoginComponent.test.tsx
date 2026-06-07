import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginComponent } from '../../../../src/routes/login/-components/LoginComponent';

const navigate = vi.fn();
const signInEmail = vi.fn();
const signUpEmail = vi.fn();
const signInSocial = vi.fn();
const toastError = vi.fn();

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useRouter: () => ({ navigate }),
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
  },
}));

vi.mock('../../../../src/lib/auth/auth-client', () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmail(...args),
      social: (...args: unknown[]) => signInSocial(...args),
    },
    signUp: {
      email: (...args: unknown[]) => signUpEmail(...args),
    },
  },
}));

function renderLogin(redirectTo?: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginComponent redirectTo={redirectTo} />
    </QueryClientProvider>,
  );
}

async function submitSignIn(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('邮箱'), 'user@example.com');
  await user.type(screen.getByLabelText('密码'), 'password123');
  const form = screen.getByRole('form', { name: '登录表单' });
  await user.click(within(form).getByRole('button', { name: '登录' }));
}

afterEach(() => {
  cleanup();
});

describe('LoginComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signInEmail.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    signUpEmail.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    signInSocial.mockResolvedValue({ data: null, error: null });
  });

  it('navigates after a successful email sign in', async () => {
    const user = userEvent.setup();
    renderLogin('/settings');

    await submitSignIn(user);

    await waitFor(() => {
      expect(signInEmail).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(navigate).toHaveBeenCalledWith({ to: '/settings' });
    });
  });

  it('shows an error toast when sign in returns an auth error', async () => {
    signInEmail.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });
    const user = userEvent.setup();
    renderLogin();

    await submitSignIn(user);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Invalid credentials');
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('shows a fallback toast when sign in throws', async () => {
    signInEmail.mockRejectedValue(new Error('network'));
    const user = userEvent.setup();
    renderLogin();

    await submitSignIn(user);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('登录失败');
    });
  });

  it('navigates after a successful sign up', async () => {
    const user = userEvent.setup();
    renderLogin('/');

    await user.type(screen.getByLabelText('邮箱'), 'new@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '创建账号' }));

    await waitFor(() => {
      expect(signUpEmail).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        name: 'new@example.com',
      });
      expect(navigate).toHaveBeenCalledWith({ to: '/' });
    });
  });

  it('shows an error toast when sign up returns an auth error', async () => {
    signUpEmail.mockResolvedValue({
      data: null,
      error: { message: 'Email already exists' },
    });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('邮箱'), 'new@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '创建账号' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Email already exists');
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  it('shows a fallback toast when sign up throws', async () => {
    signUpEmail.mockRejectedValue(new Error('network'));
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText('邮箱'), 'new@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '创建账号' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('注册失败');
    });
  });

  it('shows an error toast when GitHub sign in returns an auth error', async () => {
    signInSocial.mockResolvedValue({
      data: null,
      error: { message: 'OAuth failed' },
    });
    const user = userEvent.setup();
    renderLogin('/dashboard');

    await user.click(
      screen.getByRole('button', { name: '使用 GitHub 登录' }),
    );

    await waitFor(() => {
      expect(signInSocial).toHaveBeenCalledWith({
        provider: 'github',
        callbackURL: '/dashboard',
      });
      expect(toastError).toHaveBeenCalledWith('OAuth failed');
    });
  });

  it('shows a fallback toast when GitHub sign in throws', async () => {
    signInSocial.mockRejectedValue(new Error('network'));
    const user = userEvent.setup();
    renderLogin();

    await user.click(
      screen.getByRole('button', { name: '使用 GitHub 登录' }),
    );

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('GitHub 登录失败');
    });
  });

  it('sanitizes unsafe redirect targets before navigation', async () => {
    const user = userEvent.setup();
    renderLogin('https://evil.test');

    await submitSignIn(user);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: '/' });
    });
  });
});
