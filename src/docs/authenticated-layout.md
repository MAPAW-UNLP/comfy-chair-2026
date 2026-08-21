# Authenticated Layout with TanStack Router

## Overview

This project uses TanStack Router's layout route pattern to protect authenticated routes. The `_auth` layout ensures that only authenticated users can access its child routes.

## How It Works

### 1. Layout Route (`_auth.tsx`)

The `_auth.tsx` file creates a layout route that:
- Uses `beforeLoad` hook to check authentication before rendering
- Fetches the current user from the backend
- Redirects unauthenticated users to `/ingresar` (login page)
- Passes user data to child routes via route context
- Stores the original URL in search params for post-login redirect

```typescript
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const user = await authService.getCurrentUser()
    
    if (!user) {
      throw redirect({
        to: '/ingresar',
        search: {
          redirect: location.href,
        },
      })
    }
    
    return { user }
  },
  component: AuthLayout,
})
```

### 2. Protected Child Routes

Child routes like `_auth.panel.tsx` are automatically protected:
- They can access user data from the parent route context
- No need for manual authentication checks
- Simplified component logic

```typescript
function PanelPage() {
  const { user } = useRouteContext({ from: '/_auth/panel' })
  // user is guaranteed to exist here
}
```

### 3. Login Flow with Redirect

The login page (`ingresar.tsx`):
- Accepts a `redirect` search parameter
- After successful login, redirects to the original destination
- Falls back to `/panel` if no redirect is specified

```typescript
export const Route = createFileRoute('/ingresar')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
    }
  },
  component: LoginPage,
})

// In component:
const { redirect } = Route.useSearch()
navigate({ to: redirect || '/panel' })
```

## File Naming Convention

TanStack Router uses file naming conventions for route structure:

- `_auth.tsx` - Layout route (underscore prefix means it's a layout)
- `_auth.panel.tsx` - Child route under `_auth` layout (accessible at `/panel`)
- Routes starting with `_` are "pathless" - they don't add to the URL path

## Adding New Protected Routes

To add a new protected route:

1. Create a file with the pattern `_auth.{routeName}.tsx`
2. Use `createFileRoute('/_auth/{routeName}')`
3. Access user data via `useRouteContext({ from: '/_auth/{routeName}' })`

Example:
```typescript
// src/routes/_auth.profile.tsx
import { createFileRoute, useRouteContext } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = useRouteContext({ from: '/_auth/profile' })
  return <div>Profile for {user.nombre_completo}</div>
}
```

## Benefits

1. **Centralized Authentication**: All auth logic in one place
2. **Type Safety**: TypeScript ensures proper route context usage
3. **Better UX**: Automatic redirects preserve user intent
4. **Cleaner Code**: Child components don't need auth checks
5. **SSR Ready**: `beforeLoad` runs on both client and server

