import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import LogoutIcon from '@mui/icons-material/Logout'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/useAuth'
import { api } from '../services/api'

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
    mutationFn: (inviteCode: string) =>
      api.post<{ id: string }>(`/api/rooms/${inviteCode}/join`, {}),
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
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            component={Link}
            to="/rooms"
            variant="h6"
            sx={{ flexGrow: 0, color: 'inherit', textDecoration: 'none', mr: 2 }}
          >
            Secret Santa
          </Typography>

          <NavLink
            to="/rooms"
            style={({ isActive }) => ({
              color: 'inherit',
              textDecoration: isActive ? 'underline' : 'none',
              fontWeight: isActive ? 700 : 400,
            })}
          >
            Rooms
          </NavLink>

          <IconButton
            color="inherit"
            onClick={openCreate}
            aria-label="Create room"
            sx={{ ml: 'auto' }}
          >
            <AddIcon />
          </IconButton>

          <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.85 }}>
            {auth.user?.displayName}
          </Typography>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <main className="min-h-screen bg-gray-100 p-6">
        <Outlet />
      </main>

      <Dialog open={dialogOpen} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>{dialogMode === 'create' ? 'Create Room' : 'Join Room'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          {dialogError && <Alert severity="error">{dialogError}</Alert>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant={dialogMode === 'create' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { setDialogMode('create'); setDialogError('') }}
            >
              Create
            </Button>
            <Button
              variant={dialogMode === 'join' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => { setDialogMode('join'); setDialogError('') }}
            >
              Join
            </Button>
          </div>
          {dialogMode === 'create' ? (
            <TextField
              autoFocus
              label="Room name"
              fullWidth
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && roomName.trim() && handleSubmit()}
            />
          ) : (
            <TextField
              autoFocus
              label="Invite code"
              fullWidth
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inviteCode.trim() && handleSubmit()}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isPending || (dialogMode === 'create' ? !roomName.trim() : !inviteCode.trim())}
          >
            {isPending ? '…' : dialogMode === 'create' ? 'Create' : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
