import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { authClient } from '#/lib/auth-client';
import { AuthCredentialsFormComponent } from './AuthCredentialsFormComponent';
import type { AuthCredentials } from './auth-credentials-schema';

export function LoginComponent() {
  const router = useRouter();

  const signInMutation = useMutation({
    mutationFn: (data: AuthCredentials) => authClient.signIn.email(data),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error(error.message ?? 'Sign in failed');
        return;
      }
      router.navigate({ to: '/' });
    },
    onError: () => {
      toast.error('Sign in failed');
    },
  });

  const signUpMutation = useMutation({
    mutationFn: (data: AuthCredentials) =>
      authClient.signUp.email({ ...data, name: data.email }),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error(error.message ?? 'Sign up failed');
        return;
      }
      router.navigate({ to: '/' });
    },
    onError: () => {
      toast.error('Sign up failed');
    },
  });

  const githubMutation = useMutation({
    mutationFn: () =>
      authClient.signIn.social({ provider: 'github', callbackURL: '/' }),
    onSuccess: ({ error }) => {
      if (error) {
        toast.error(error.message ?? 'GitHub sign in failed');
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
