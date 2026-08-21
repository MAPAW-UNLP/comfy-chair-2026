import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authService } from '@/services/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    // Check if user is authenticated
    const user = await authService.getCurrentUser()
    
    if (!user) {
      // Redirect to login if not authenticated
      throw redirect({
        to: '/login',
        search: {
          // Store the redirect location so we can send them back after login
          redirect: location.href as string,
          registered: undefined,
        },
      })
    }
    
    // Return user data to be available in child routes
    return { user }
  },
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div>
      <Outlet />
    </div>
  )
}
