import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';
import type { Session } from '#/lib/auth-client';
import { authClient } from '#/lib/auth-client';
import { avatarBackgroundColor, avatarInitial } from '#/lib/avatar-color';
import { invalidateCachedSession } from '#/lib/session-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type UserMenuComponentProps = {
  user: Session['user'];
};

export function UserMenuComponent({ user }: UserMenuComponentProps) {
  const router = useRouter();
  const seed = user.id ?? user.email ?? 'anonymous';
  const initial = avatarInitial(user.name, user.email);
  const backgroundColor = avatarBackgroundColor(seed);

  const signOutMutation = useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: async () => {
      await invalidateCachedSession();
      router.navigate({ to: '/login', search: { redirect: undefined } });
    },
  });

  return (
    <div className="group/user-menu relative">
      <button
        type="button"
        className="rounded-full outline-none ring-offset-background transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="用户菜单"
      >
        <Avatar size="default">
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name ?? '用户头像'} />
          ) : null}
          <AvatarFallback
            className="font-medium text-white"
            style={{ backgroundColor }}
          >
            {initial}
          </AvatarFallback>
        </Avatar>
      </button>
      <div
        className={cn(
          'pointer-events-none absolute top-full right-0 z-50 w-40 pt-2',
          'opacity-0 transition-opacity duration-150',
          'group-hover/user-menu:pointer-events-auto group-hover/user-menu:opacity-100',
          'group-focus-within/user-menu:pointer-events-auto group-focus-within/user-menu:opacity-100',
        )}
      >
        <div className="overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          <Link
            to="/profile"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <User className="size-4" />
            个人中心
          </Link>
          <button
            type="button"
            disabled={signOutMutation.isPending}
            onClick={() => signOutMutation.mutate()}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 disabled:opacity-50"
          >
            <LogOut className="size-4" />
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
