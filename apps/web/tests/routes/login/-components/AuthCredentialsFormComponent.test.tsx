import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthCredentialsFormComponent } from '../../../../src/routes/login/-components/AuthCredentialsFormComponent';

afterEach(() => {
  cleanup();
});

describe('AuthCredentialsFormComponent', () => {
  it('shows validation errors for invalid input', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    const onSignUp = vi.fn();
    const onGitHubSignIn = vi.fn();

    render(
      <AuthCredentialsFormComponent
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onGitHubSignIn={onGitHubSignIn}
        isSubmitting={false}
      />,
    );

    const form = screen.getByRole('form', { name: 'Sign in form' });
    await user.click(within(form).getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Invalid email address')).toBeTruthy();
    expect(
      screen.getByText('Password must be at least 8 characters'),
    ).toBeTruthy();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('calls onSignIn with validated data', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    const onSignUp = vi.fn();
    const onGitHubSignIn = vi.fn();

    render(
      <AuthCredentialsFormComponent
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onGitHubSignIn={onGitHubSignIn}
        isSubmitting={false}
      />,
    );

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    const form = screen.getByRole('form', { name: 'Sign in form' });
    await user.click(within(form).getByRole('button', { name: 'Sign in' }));

    expect(onSignIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('calls onSignUp with validated data', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    const onSignUp = vi.fn();
    const onGitHubSignIn = vi.fn();

    render(
      <AuthCredentialsFormComponent
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        onGitHubSignIn={onGitHubSignIn}
        isSubmitting={false}
      />,
    );

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(onSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
    });
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('calls onGitHubSignIn when GitHub button is clicked', async () => {
    const user = userEvent.setup();
    const onGitHubSignIn = vi.fn();

    render(
      <AuthCredentialsFormComponent
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onGitHubSignIn={onGitHubSignIn}
        isSubmitting={false}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Sign in with GitHub' }),
    );
    expect(onGitHubSignIn).toHaveBeenCalled();
  });
});
