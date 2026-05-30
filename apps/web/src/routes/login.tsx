import { createFileRoute, useRouter } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';
import { z } from 'zod';
import { authClient } from '#/lib/auth-client';

export const Route = createFileRoute('/login')({ component: LoginPage });

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>, mode: 'in' | 'up') {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const parsed = credentials.safeParse({
      email: form.get('email'),
      password: form.get('password'),
    });
    if (!parsed.success) {
      setError('Invalid email or password (min 8 chars)');
      return;
    }
    const fn =
      mode === 'in' ? authClient.signIn.email : authClient.signUp.email;
    const { error } = await fn(
      mode === 'up' ? { ...parsed.data, name: parsed.data.email } : parsed.data,
    );
    if (error) setError(error.message ?? 'Failed');
    else router.navigate({ to: '/' });
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Sign in</h1>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={(e) => onSubmit(e, 'in')}
      >
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2"
        />
        <button type="submit" className="bg-black p-2 text-white">
          Sign in
        </button>
        <button
          type="button"
          className="border p-2"
          onClick={(e) => onSubmit(e as never, 'up')}
        >
          Sign up
        </button>
      </form>
      <button
        type="button"
        className="mt-4 w-full border p-2"
        onClick={() =>
          authClient.signIn.social({ provider: 'github', callbackURL: '/' })
        }
      >
        Sign in with GitHub
      </button>
    </div>
  );
}
