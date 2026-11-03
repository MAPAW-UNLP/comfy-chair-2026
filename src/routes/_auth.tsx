import axios from 'axios'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authService } from '@/services/auth'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    // Check if user is authenticated
    let user
    try {
      user = await authService.getCurrentUser()
    } catch (error) {
      if (axios.isAxiosError(error) &&
          error.response?.data?.code === 'account_disabled') {
        throw redirect({
          to: '/login',
          search: {
            redirect: undefined,
            registered: undefined,
            disabled: 'true',
          },
        })
      }
      throw error
    }
    
    if (!user) {
      // Redirect to login if not authenticated
      throw redirect({
        to: '/login',
        search: {
          // Store the redirect location so we can send them back after login
          redirect: location.href as string,
          registered: undefined,
          disabled: undefined,
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
