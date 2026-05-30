import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { authClient } from '#/lib/auth-client';
import { safeRedirectPath } from '#/lib/auth-guard';
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
    onSuccess: (result) => {
      const message = authErrorMessage(result, 'Sign in failed');
      if (message) {
        toast.error(message);
        return;
      }
      router.navigate({ to: destination });
    },
    onError: () => {
      toast.error('Sign in failed');
    },
  });

  const signUpMutation = useMutation<SignUpResult, Error, AuthCredentials>({
    mutationFn: (data) =>
      authClient.signUp.email({ ...data, name: data.email }),
    onSuccess: (result) => {
      const message = authErrorMessage(result, 'Sign up failed');
      if (message) {
        toast.error(message);
        return;
      }
      router.navigate({ to: destination });
    },
    onError: () => {
      toast.error('Sign up failed');
    },
  });

  const githubMutation = useMutation<SocialSignInResult, Error, void>({
    mutationFn: () =>
      authClient.signIn.social({
        provider: 'github',
        callbackURL: destination,
      }),
    onSuccess: (result) => {
      const message = authErrorMessage(result, 'GitHub sign in failed');
      if (message) {
        toast.error(message);
      }
    },
    onError: () => {
      toast.error('GitHub sign in failed');
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
