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

    render(
      <AuthCredentialsFormComponent onSignIn={onSignIn} isSubmitting={false} />,
    );

    const form = screen.getByRole('form', { name: '登录表单' });
    await user.click(within(form).getByRole('button', { name: '登录' }));

    expect(screen.getByText('邮箱格式无效')).toBeTruthy();
    expect(screen.getByText('密码至少需要 8 个字符')).toBeTruthy();
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('calls onSignIn with validated data', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();

    render(
      <AuthCredentialsFormComponent onSignIn={onSignIn} isSubmitting={false} />,
    );

    await user.type(screen.getByLabelText('邮箱'), 'user@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    const form = screen.getByRole('form', { name: '登录表单' });
    await user.click(within(form).getByRole('button', { name: '登录' }));

    expect(onSignIn).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('disables actions while submitting', () => {
    render(
      <AuthCredentialsFormComponent onSignIn={vi.fn()} isSubmitting={true} />,
    );

    expect(screen.getByLabelText('邮箱')).toHaveProperty('disabled', true);
    expect(screen.getByLabelText('密码')).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: '登录' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  // it('calls onSignUp with validated data', async () => {
  //   ...
  // });

  // it('does not call onSignUp when validation fails', async () => {
  //   ...
  // });

  // it('calls onGitHubSignIn when GitHub button is clicked', async () => {
  //   ...
  // });
});
