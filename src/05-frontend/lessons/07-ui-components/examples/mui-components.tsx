// ============================================
// MUI Components Showcase
// ============================================
// Demonstrates common Material UI components: AppBar, Card, TextField,
// Button, Dialog, List, Grid, Typography, Container, Box.
//
// To run: install @mui/material @emotion/react @emotion/styled @mui/icons-material
// and render this component in a Vite React app.

import { useState } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Container,
  Card,
  CardContent,
  CardActions,
  TextField,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Star,
  CardGiftcard,
  Logout,
} from '@mui/icons-material';

// ---- Custom Theme ----

const theme = createTheme({
  palette: {
    primary: { main: '#d32f2f' },     // Santa red
    secondary: { main: '#2e7d32' },   // Christmas green
  },
});

// ---- AppBar Demo ----

function AppBarDemo() {
  return (
    <AppBar position="static">
      <Toolbar>
        <CardGiftcard sx={{ mr: 2 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Secret Santa
        </Typography>
        <Typography variant="body2" sx={{ mr: 2 }}>
          John Doe
        </Typography>
        <Button color="inherit" startIcon={<Logout />}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}

// ---- Card Grid Demo ----

interface Room {
  id: string;
  name: string;
  members: number;
  status: 'open' | 'drawn';
}

const rooms: Room[] = [
  { id: '1', name: 'Office Party', members: 8, status: 'open' },
  { id: '2', name: 'Family Gift Exchange', members: 5, status: 'drawn' },
  { id: '3', name: 'Friends Xmas', members: 12, status: 'open' },
];

function CardGridDemo() {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        Your Rooms
      </Typography>
      <Grid container spacing={3}>
        {rooms.map((room) => (
          <Grid item xs={12} sm={6} md={4} key={room.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{room.name}</Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  {room.members} members
                </Typography>
                <Chip
                  label={room.status === 'open' ? 'Open' : 'Drawn'}
                  color={room.status === 'open' ? 'success' : 'default'}
                  size="small"
                />
              </CardContent>
              <CardActions>
                <Button size="small">Open</Button>
                <Button size="small" color="secondary">
                  Invite
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ---- Form Demo ----

function FormDemo() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    setError('');
    alert(`Login: ${email}`);
  };

  return (
    <Box sx={{ mt: 4, maxWidth: 400 }}>
      <Typography variant="h5" gutterBottom>
        Login Form
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" fullWidth size="large">
          Sign In
        </Button>
      </form>
    </Box>
  );
}

// ---- Dialog Demo ----

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState('');

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Dialog
      </Typography>
      <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
        Create Room
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <TextField
            label="Room Name"
            fullWidth
            autoFocus
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              alert(`Created room: ${roomName}`);
              setOpen(false);
              setRoomName('');
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ---- List Demo ----

function ListDemo() {
  const [items, setItems] = useState([
    { id: '1', text: 'Warm socks' },
    { id: '2', text: 'Coffee mug' },
    { id: '3', text: 'Book: Clean Code' },
  ]);

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Box sx={{ mt: 4, maxWidth: 400 }}>
      <Typography variant="h5" gutterBottom>
        Wishlist
      </Typography>
      <List>
        {items.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDelete(item.id)}>
                <Delete />
              </IconButton>
            }
          >
            <ListItemIcon>
              <Star color="secondary" />
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {items.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No items in wishlist
        </Typography>
      )}
    </Box>
  );
}

// ---- sx Prop Demo ----

function SxPropDemo() {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        sx Prop Examples
      </Typography>

      {/* Theme-aware spacing and colors */}
      <Box
        sx={{
          p: 3,                          // padding: 24px (theme.spacing(3))
          mb: 2,                         // marginBottom: 16px
          bgcolor: 'primary.main',       // from theme palette
          color: 'white',
          borderRadius: 2,
          '&:hover': {
            bgcolor: 'primary.dark',     // darker on hover
          },
        }}
      >
        Themed box with hover effect
      </Box>

      {/* Responsive width */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'secondary.light',
          color: 'secondary.contrastText',
          borderRadius: 1,
          width: { xs: '100%', sm: '75%', md: '50%' }, // responsive
        }}
      >
        This box is 100% on mobile, 75% on tablet, 50% on desktop
      </Box>
    </Box>
  );
}

// ---- Main App ----

export default function MuiShowcaseApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBarDemo />
      <Container maxWidth="md" sx={{ py: 3 }}>
        <CardGridDemo />
        <FormDemo />
        <DialogDemo />
        <ListDemo />
        <SxPropDemo />
      </Container>
    </ThemeProvider>
  );
}
