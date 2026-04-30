import { render, screen } from '@testing-library/react'
import LoginPage from '@/app/login/page'
import { vi, describe, it, expect } from 'vitest'

// Mock the next/navigation and next-auth
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}))

vi.mock('next-auth/react', () => ({
  signIn: vi.fn()
}))

describe('LoginPage Component (Integration)', () => {
  it('renders the login form properly', () => {
    render(<LoginPage />)
    
    // Check for essential elements
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })
})
