import { describe, test, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import RegisterForm from './RegisterForm'

describe('RegisterForm', () => {
  test('renders all fields', () => {
    renderApp(<RegisterForm />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  test('shows Zod error when passwords do not match', async () => {
    const user = userEvent.setup()
    renderApp(<RegisterForm />)

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/^email/i), 'new@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different456')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  test('calls auth.register and triggers onSuccess on valid submit', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    renderApp(<RegisterForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/^email/i), 'newuser@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
  })

  test('shows server error on 409 email taken', async () => {
    const user = userEvent.setup()
    renderApp(<RegisterForm />)

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/^email/i), 'taken@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/email already taken/i)).toBeInTheDocument()
  })
})
