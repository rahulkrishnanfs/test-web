import { Button, Container, Nav, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Navbar expand="lg" bg={theme} variant={theme} className="border-bottom" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="cn-navbar-brand">
          <span className="cn-gradient-text">Cursor</span> Northampton
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="cn-nav" />
        <Navbar.Collapse id="cn-nav">
          <Nav className="ms-auto align-items-lg-center gap-lg-2">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            {!user && (
              <>
                <Nav.Link as={Link} to="/login">
                  Attendee Login
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/login">
                  Admin
                </Nav.Link>
              </>
            )}
            {user?.role === "attendee" && (
              <Nav.Link as={Link} to="/portal">
                My Credit
              </Nav.Link>
            )}
            {user?.role === "admin" && (
              <Nav.Link as={Link} to="/admin">
                Dashboard
              </Nav.Link>
            )}
            <Button
              variant={theme === "light" ? "outline-secondary" : "outline-light"}
              size="sm"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
            >
              {theme === "light" ? "Dark" : "Light"} mode
            </Button>
            {user && (
              <Button variant="danger" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
