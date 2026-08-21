# Authentication & Authorization System
This documentation was generated using Claude Sonnet 4.5 

## Overview

This application implements a complete authentication and authorization system using JWT (JSON Web Tokens). The system handles user registration, login, session management, and protected routes.

## Architecture

### Core Components

1. **API Layer** (`src/services/api.ts`)
2. **Authentication Service** (`src/services/auth.ts`)
3. **Auth Context** (`src/contexts/AuthContext.tsx`)
4. **Routes** (Login, Register, Panel)

---

## 1. API Layer (`src/services/api.ts`)

### Purpose
Centralizes all HTTP requests and handles JWT token injection.

### Key Features

```typescript
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### Request Interceptor
Automatically attaches the JWT token to every request:

```typescript
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

**How it works:**
1. Before each request, the interceptor runs
2. It retrieves the JWT token from `localStorage`
3. If a token exists, it adds an `Authorization` header with format: `Bearer <token>`
4. The backend validates this token on protected endpoints

#### Response Interceptor
Handles authentication errors globally:

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/ingresar';
    }
    return Promise.reject(error);
  }
);
```

**How it works:**
1. If any API request returns a 401 (Unauthorized) status
2. The interceptor automatically:
   - Clears the stored token and user data
   - Redirects the user to the login page
3. This handles expired or invalid tokens globally

---

## 2. Authentication Service (`src/services/auth.ts`)

### Purpose
Provides all authentication-related operations.

### Data Types

```typescript
export interface RegisterData {
  nombre_completo: string;
  afiliacion: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  nombre_completo: string;
  afiliacion: string;
}

export interface LoginResponse {
  status: string;
  token: string;
  user: User;
}
```

### Methods

#### `register(data: RegisterData): Promise<User>`
Registers a new user account.

```typescript
async register(data: RegisterData): Promise<User> {
  const response = await axiosInstance.post('/users/registro/', data);
  return response.data;
}
```

- **Endpoint:** `POST /users/registro/`
- **Input:** User registration data
- **Output:** Created user object
- **Note:** Does NOT automatically log in the user

#### `login(data: LoginData): Promise<LoginResponse>`
Authenticates a user and stores credentials.

```typescript
async login(data: LoginData): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>('/users/login/', data);
  const { token, user } = response.data;
  
  // Store token and user in localStorage
  localStorage.setItem('authToken', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  return response.data;
}
```

- **Endpoint:** `POST /users/login/`
- **Input:** Email and password
- **Output:** `{ status, token, user }`
- **Side effects:** 
  - Stores JWT token in localStorage
  - Stores user object in localStorage
  - Future API requests will include this token automatically

**Example API Response:**
```json
{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@test.com",
    "nombre_completo": "John Doe",
    "afiliacion": "University"
  }
}
```

#### `logout(): void`
Clears the user session.

```typescript
logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}
```

- Removes token and user from localStorage
- Does NOT make an API call
- User must manually navigate after logout

#### `getCurrentUser(): User | null`
Retrieves the stored user from localStorage.

```typescript
getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
```

- Used on app initialization to restore session
- Returns `null` if no user is logged in

#### `isAuthenticated(): boolean`
Checks if a user is currently logged in.

```typescript
isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken');
}
```

- Simple token existence check
- Does NOT validate if token is expired

#### `fetchCurrentUser(): Promise<User>`
Fetches the current user from the backend (validates token).

```typescript
async fetchCurrentUser(): Promise<User> {
  const response = await axiosInstance.get<User>('/users/getUsuario/');
  return response.data;
}
```

- **Endpoint:** `GET /users/getUsuario/`
- **Authentication:** Required (uses stored JWT token)
- **Purpose:** Validate token and get fresh user data

---

## 3. Auth Context (`src/contexts/AuthContext.tsx`)

### Purpose
Provides global authentication state management using React Context.

### Context Type

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}
```

### AuthProvider Component

```typescript
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);
  
  // ... methods
}
```

**Initialization:**
1. On app mount, checks localStorage for existing user
2. If found, restores the user to state
3. Sets `isLoading` to `false` once check is complete

### Methods

#### `login(email: string, password: string)`
```typescript
const login = async (email: string, password: string) => {
  const response = await authService.login({ email, password });
  setUser(response.user);
};
```

- Calls the auth service
- Updates the context state with user data
- Throws error if login fails (caught by component)

#### `register(data: RegisterData)`
```typescript
const register = async (data: RegisterData) => {
  await authService.register(data);
  // After registration, auto-login
  await login(data.email, data.password);
};
```

- Registers the user
- Automatically logs them in after successful registration
- Updates context state

#### `logout()`
```typescript
const logout = () => {
  authService.logout();
  setUser(null);
};
```

- Clears localStorage
- Resets user state to `null`

### useAuth Hook

```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

**Usage in components:**
```typescript
const { user, isLoading, login, logout } = useAuth();
```

---

## 4. Root Layout (`src/routes/__root.tsx`)

### Purpose
Wraps the entire application with the AuthProvider.

```typescript
const RootLayout = () => (
  <AuthProvider>
    <div className="p-2 flex gap-2">
      {/* Navigation */}
    </div>
    <Outlet />
    <TanStackRouterDevtools />
  </AuthProvider>
);
```

**Why this matters:**
- Every route has access to the auth context
- User state persists across navigation
- Single source of truth for authentication

---

## 5. Routes

### Login Route (`src/routes/ingresar.tsx`)

#### Key Features

```typescript
function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setErrors(fieldErrors);
      return;
    }

    try {
      await login(formData.email, formData.contraseña);
      navigate({ to: '/panel' });
    } catch (error) {
      window.alert('Error al ingresar: ' + error);
    }
  };
}
```

**Flow:**
1. User enters email and password
2. Form validates with Zod schema
3. Calls `login()` from context
4. On success: redirects to `/panel`
5. On failure: shows error alert

### Register Route (`src/routes/registrarse.tsx`)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const result = registerSchema.safeParse(formData);
  if (!result.success) {
    setErrors(fieldErrors);
    return;
  }

  try {
    const response = await authService.register({
      nombre_completo: formData.nombreCompleto,
      afiliacion: formData.afiliacion,
      email: formData.email,
      password: formData.contraseña,
    });
    navigate({ to: '/ingresar' });
  } catch (error) {
    window.alert('Error al registrarse: ' + error);
  }
};
```

**Flow:**
1. User fills out registration form
2. Validates with Zod schema
3. Calls auth service directly (not context)
4. On success: redirects to login page
5. User must then log in manually

### Panel Route (Protected) (`src/routes/panel.tsx`)

#### Protection Mechanism

```typescript
function PanelPage() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      navigate({ to: '/ingresar' });
    }
  }, [user, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return <div>Cargando...</div>;
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  // Render protected content
  return (
    <Card>
      {/* Display user data */}
      <p>ID: {user.id}</p>
      <p>Name: {user.nombre_completo}</p>
      <p>Email: {user.email}</p>
      <p>Affiliation: {user.afiliacion}</p>
      
      <Button onClick={handleLogout}>Cerrar Sesión</Button>
    </Card>
  );
}
```

**Protection Flow:**
1. Component checks if `isLoading` is complete
2. If no user exists after loading, redirect to `/ingresar`
3. While loading, show loading state
4. Once verified, display user information

#### Logout Handler

```typescript
const handleLogout = () => {
  logout();
  navigate({ to: '/ingresar' });
};
```

---

## Authentication Flow Diagrams

### Registration Flow

```
User → /registrarse Form
  ↓
  Validate with Zod
  ↓
  POST /api/users/registro/
  ↓
  Success → Redirect to /ingresar
  ↓
  User must log in
```

### Login Flow

```
User → /ingresar Form
  ↓
  Validate with Zod
  ↓
  POST /api/users/login/
  ↓
  Receive { token, user }
  ↓
  Store in localStorage
  ↓
  Update AuthContext state
  ↓
  Redirect to /panel
```

### Protected Route Access

```
User visits /panel
  ↓
  useAuth() checks user state
  ↓
  Is user logged in?
  ├─ YES → Render page content
  └─ NO → Redirect to /ingresar
```

### API Request with JWT

```
Component makes API call
  ↓
  axiosInstance intercepts request
  ↓
  Reads token from localStorage
  ↓
  Adds "Authorization: Bearer {token}" header
  ↓
  Sends request to backend
  ↓
  Backend validates JWT
  ├─ Valid → Return data
  └─ Invalid → 401 response
      ↓
      Response interceptor catches 401
      ↓
      Clear localStorage
      ↓
      Redirect to /ingresar
```

---

## Security Considerations

### Token Storage

**Current Implementation:** localStorage

**Pros:**
- Persists across browser sessions
- Easy to implement
- Automatic token inclusion in requests

**Cons:**
- Vulnerable to XSS attacks
- Not as secure as httpOnly cookies

**Best Practices:**
- ✅ Tokens are not logged to console in production
- ✅ Automatic expiration handling with 401 responses
- ⚠️ Consider httpOnly cookies for production

### Token Expiration

The backend JWT includes an `exp` claim:
```json
{
  "user_id": 1,
  "rol": "user",
  "exp": 1759370911,
  "iat": 1759367311
}
```

- When expired, API returns 401
- Response interceptor handles automatic logout
- User is redirected to login page

### Protected Routes

Current implementation uses **client-side protection**:
- ✅ Prevents rendering of protected content
- ✅ Redirects unauthorized users
- ⚠️ Not foolproof (can be bypassed with dev tools)

**Backend must also validate the JWT token on all protected endpoints.**

---

## Usage Examples

### Using Auth in a Component

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <p>Welcome, {user.nombre_completo}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Making Authenticated API Calls

```typescript
import { axiosInstance } from '@/services/api';

// Token is automatically included!
const response = await axiosInstance.get('/some-protected-endpoint');
```

### Creating a New Protected Route

```typescript
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/my-protected-route')({
  component: MyProtectedPage,
});

function MyProtectedPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: '/ingresar' });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return <div>Loading...</div>;
  if (!user) return null;

  return <div>Protected content here</div>;
}
```

---

## Troubleshooting

### Common Issues

#### "Token not being sent with requests"
- Check that token is stored in localStorage: `localStorage.getItem('authToken')`
- Verify the request interceptor is working
- Check browser network tab for `Authorization` header

#### "Always redirected to login"
- Check if `authToken` and `user` are in localStorage
- Verify token hasn't expired
- Check console for errors in AuthContext initialization

#### "401 errors on protected routes"
- Token may be expired
- Backend may not be validating token correctly
- Check token format: should be `Bearer <token>`

---

## File Structure Summary

```
src/
├── contexts/
│   └── AuthContext.tsx          # Global auth state management
├── services/
│   ├── api.ts                   # Axios instance with interceptors
│   └── auth.ts                  # Authentication API calls
├── routes/
│   ├── __root.tsx               # AuthProvider wrapper
│   ├── ingresar.tsx             # Login page
│   ├── registrarse.tsx          # Registration page
│   └── panel.tsx                # Protected user panel
└── lib/
    └── validations.ts           # Zod schemas for forms
```

---

## Summary

This authentication system provides:

✅ JWT-based authentication
✅ Automatic token injection in requests
✅ Global auth state management
✅ Protected routes with redirects
✅ Persistent sessions via localStorage
✅ Automatic logout on token expiration
✅ Type-safe API interactions

All components work together to create a secure, user-friendly authentication experience.

