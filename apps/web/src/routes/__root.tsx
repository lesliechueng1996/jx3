import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  HeadContent,
  redirect,
  Scripts,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { NotFoundComponent } from '#/components/NotFoundComponent';
import { isPublicPath } from '#/lib/auth-guard';
import { getSessionFn } from '#/lib/get-session';
import { queryClient } from '#/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import appCss from '../styles.css?url';

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (isPublicPath(location.pathname)) {
      return;
    }

    const session = await getSessionFn();

    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname + location.search },
      });
    }

    return { session };
  },
  notFoundComponent: NotFoundComponent,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors closeButton />
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
