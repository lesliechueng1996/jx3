import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { authClient } from '#/lib/auth-client';
import { safeRedirectPath } from '#/lib/auth-guard';
import { invalidateCachedSession } from '#/lib/session-query';
import { AuthCredentialsFormComponent } from './AuthCredentialsFormComponent';
import type { AuthCredentials } from './auth-credentials-schema';

type LoginComponentProps = {
  redirectTo?: string;
};

type SignInResult = Awaited<ReturnType<typeof authClient.signIn.email>>;
type SignUpResult = Awaited<ReturnType<typeof authClient.signUp.email>>;
type SocialSignInResult = Awaited<ReturnType<typeof authClient.signIn.social>>;

function authErrorMessage(
  result: { error?: { message?: string | null } | null },
  fallback: string,
): string | null {
  if (!result.error) {
    return null;
  }
  return result.error.message ?? fallback;
}

export function LoginComponent({ redirectTo }: LoginComponentProps) {
  const router = useRouter();
  const destination = safeRedirectPath(redirectTo);

  const signInMutation = useMutation<SignInResult, Error, AuthCredentials>({
    mutationFn: (data) => authClient.signIn.email(data),
    onSuccess: async (result) => {
      const message = authErrorMessage(result, '登录失败');
      if (message) {
        toast.error(message);
        return;
      }
      await invalidateCachedSession();
      router.navigate({ to: destination });
    },
    onError: () => {
      toast.error('登录失败');
    },
  });

  const signUpMutation = useMutation<SignUpResult, Error, AuthCredentials>({
    mutationFn: (data) =>
      authClient.signUp.email({ ...data, name: data.email }),
    onSuccess: async (result) => {
      const message = authErrorMessage(result, '注册失败');
      if (message) {
        toast.error(message);
        return;
      }
      await invalidateCachedSession();
      router.navigate({ to: destination });
    },
    onError: () => {
      toast.error('注册失败');
    },
  });

  const githubMutation = useMutation<SocialSignInResult, Error, void>({
    mutationFn: () =>
      authClient.signIn.social({
        provider: 'github',
        callbackURL: destination,
      }),
    onSuccess: (result) => {
      const message = authErrorMessage(result, 'GitHub 登录失败');
      if (message) {
        toast.error(message);
      }
    },
    onError: () => {
      toast.error('GitHub 登录失败');
    },
  });

  const isSubmitting =
    signInMutation.isPending ||
    signUpMutation.isPending ||
    githubMutation.isPending;

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <AuthCredentialsFormComponent
        onSignIn={signInMutation.mutate}
        onSignUp={signUpMutation.mutate}
        onGitHubSignIn={() => githubMutation.mutate()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
