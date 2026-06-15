import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../contexts/AuthContext";

export function Layout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  const handleCreate = () => {
    console.log({ name: roomName });
    setRoomName("");
    setDialogOpen(false);
  };

  const handleClose = () => {
    setRoomName("");
    setDialogOpen(false);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            component={Link}
            to="/rooms"
            variant="h6"
            sx={{ flexGrow: 0, color: "inherit", textDecoration: "none", mr: 2 }}
          >
            Secret Santa
          </Typography>

          <NavLink
            to="/rooms"
            style={({ isActive }) => ({
              color: "inherit",
              textDecoration: isActive ? "underline" : "none",
              fontWeight: isActive ? 700 : 400,
            })}
          >
            Rooms
          </NavLink>

          <IconButton
            color="inherit"
            onClick={() => setDialogOpen(true)}
            aria-label="Create room"
            sx={{ ml: "auto" }}
          >
            <AddIcon />
          </IconButton>

          <Typography variant="body2" sx={{ color: "inherit", opacity: 0.85 }}>
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
        <DialogTitle>Create Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Room name"
            fullWidth
            required
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && roomName.trim() && handleCreate()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!roomName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
