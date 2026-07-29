import { useState } from "react";
import { Alert, Button, Card, Container, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AttendeeLogin() {
  const { loginAttendee } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAttendee(email.trim());
      navigate("/portal");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to log in. Please check your email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="cn-page d-flex align-items-center justify-content-center py-5">
      <Card className="shadow-sm border-0" style={{ maxWidth: 440, width: "100%" }}>
        <Card.Body className="p-4 p-md-5">
          <h2 className="h4 fw-bold mb-1">Attendee Portal</h2>
          <p className="text-secondary mb-4">
            Enter the email you registered with to view your Cursor credit.
          </p>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="attendeeEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : "Access my credit"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
