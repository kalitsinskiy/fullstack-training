import { describe, test, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test/renderApp'
import RegisterPage from './RegisterPage'

describe('RegisterPage', () => {
  test('renders the register form', () => {
    renderApp(<RegisterPage />, { route: '/register' })
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  test('successful registration navigates away', async () => {
    const user = userEvent.setup()
    renderApp(<RegisterPage />, { route: '/register' })

    await user.type(screen.getByLabelText(/name/i), 'Alice')
    await user.type(screen.getByLabelText(/^email/i), 'alice@test.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument(),
    )
  })
})
