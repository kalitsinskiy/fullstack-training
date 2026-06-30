import { describe, test, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  test('renders email and password fields', () => {
    renderApp(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('shows Zod validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderApp(<LoginForm />)

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument()
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  test('shows validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderApp(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'notanemail')
    await user.tab()

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument()
  })

  test('calls auth.login and triggers onSuccess on valid submit', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    renderApp(<LoginForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/email/i), 'user@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  test('shows server error message on 401', async () => {
    const user = userEvent.setup()
    renderApp(<LoginForm />)

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })
})
