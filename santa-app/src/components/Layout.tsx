import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/useAuth'
import { api } from '../services/api'
import { Button } from './ui/button'
import { Input } from './ui/input'

type DialogMode = 'create' | 'join'

export function Layout() {
  const auth = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [dialogMode, setDialogMode] = useState<DialogMode>('create')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [dialogError, setDialogError] = useState('')

  const handleLogout = () => {
    auth.logout()
    navigate('/login')
  }

  const openCreate = () => {
    setDialogMode('create')
    setRoomName('')
    setDialogError('')
    setDialogOpen(true)
  }

  const handleClose = () => {
    setRoomName('')
    setInviteCode('')
    setDialogError('')
    setDialogOpen(false)
  }

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post<{ id: string }>('/api/rooms', { name }),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      handleClose()
      navigate(`/rooms/${room.id}`)
    },
    onError: (err) => {
      setDialogError(err instanceof Error ? err.message : 'Failed to create room')
    },
  })

  const joinMutation = useMutation({
    mutationFn: (code: string) =>
      api.post<{ id: string }>(`/api/rooms/${code}/join`, {}),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      qc.invalidateQueries({ queryKey: ['rooms', room.id] })
      handleClose()
      navigate(`/rooms/${room.id}`)
    },
    onError: (err) => {
      setDialogError(err instanceof Error ? err.message : 'Failed to join room')
    },
  })

  const handleSubmit = () => {
    setDialogError('')
    if (dialogMode === 'create') {
      if (roomName.trim()) createMutation.mutate(roomName.trim())
    } else {
      if (inviteCode.trim()) joinMutation.mutate(inviteCode.trim())
    }
  }

  const isPending = createMutation.isPending || joinMutation.isPending

  return (
    <>
      <header className="bg-primary text-primary-foreground">
        <div className="flex items-center gap-4 px-6 py-3">
          <Link to="/rooms" className="mr-4 text-lg font-semibold">
            Secret Santa
          </Link>
          <NavLink
            to="/rooms"
            style={({ isActive }) => ({
              textDecoration: isActive ? 'underline' : 'none',
              fontWeight: isActive ? 700 : 400,
            })}
          >
            Rooms
          </NavLink>
          <div className="ml-auto flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={openCreate} aria-label="Create room">
              + Create
            </Button>
            <span className="text-sm opacity-85">{auth.user?.displayName}</span>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-100 p-6">
        <Outlet />
      </main>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xs rounded-xl bg-background p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {dialogMode === 'create' ? 'Create Room' : 'Join Room'}
            </h2>

            {dialogError && (
              <p className="mb-3 rounded border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {dialogError}
              </p>
            )}

            <div className="mb-4 flex gap-2">
              <Button
                size="sm"
                variant={dialogMode === 'create' ? 'default' : 'outline'}
                onClick={() => { setDialogMode('create'); setDialogError('') }}
              >
                Create
              </Button>
              <Button
                size="sm"
                variant={dialogMode === 'join' ? 'default' : 'outline'}
                onClick={() => { setDialogMode('join'); setDialogError('') }}
              >
                Join
              </Button>
            </div>

            {dialogMode === 'create' ? (
              <Input
                autoFocus
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && roomName.trim() && handleSubmit()}
              />
            ) : (
              <Input
                autoFocus
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteCode.trim() && handleSubmit()}
              />
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isPending}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending || (dialogMode === 'create' ? !roomName.trim() : !inviteCode.trim())}
              >
                {isPending ? '…' : dialogMode === 'create' ? 'Create' : 'Join'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
