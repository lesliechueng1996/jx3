import { useState } from 'react';
import type { ZodIssue } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  type AuthCredentials,
  authCredentialsSchema,
} from './auth-credentials-schema';

type AuthCredentialsFormProps = {
  onSignIn: (data: AuthCredentials) => void;
  onSignUp: (data: AuthCredentials) => void;
  onGitHubSignIn: () => void;
  isSubmitting: boolean;
};

type FieldErrors = Partial<Record<keyof AuthCredentials, string>>;

function parseFieldErrors(issues: ZodIssue[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === 'email' || key === 'password') {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function AuthCredentialsFormComponent({
  onSignIn,
  onSignUp,
  onGitHubSignIn,
  isSubmitting,
}: AuthCredentialsFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function validate(): AuthCredentials | null {
    const result = authCredentialsSchema.safeParse({ email, password });
    if (!result.success) {
      setFieldErrors(parseFieldErrors(result.error.issues));
      return null;
    }
    setFieldErrors({});
    return result.data;
  }

  function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = validate();
    if (data) onSignIn(data);
  }

  function handleSignUp() {
    const data = validate();
    if (data) onSignUp(data);
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your email or GitHub account to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form
          className="flex flex-col gap-4"
          aria-label="Sign in form"
          onSubmit={handleSignIn}
        >
          <FieldGroup>
            <Field data-invalid={fieldErrors.email ? true : undefined}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={fieldErrors.email ? true : undefined}
                disabled={isSubmitting}
                onChange={(event) => setEmail(event.target.value)}
              />
              {fieldErrors.email && (
                <FieldError>{fieldErrors.email}</FieldError>
              )}
            </Field>
            <Field data-invalid={fieldErrors.password ? true : undefined}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                aria-invalid={fieldErrors.password ? true : undefined}
                disabled={isSubmitting}
                onChange={(event) => setPassword(event.target.value)}
              />
              {fieldErrors.password && (
                <FieldError>{fieldErrors.password}</FieldError>
              )}
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={isSubmitting}>
            Sign in
          </Button>
        </form>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleSignUp}
        >
          Create account
        </Button>
        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onGitHubSignIn}
        >
          Sign in with GitHub
        </Button>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Password must be at least 8 characters.
      </CardFooter>
    </Card>
  );
}
