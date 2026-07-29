import { Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Container className="cn-page d-flex flex-column align-items-center justify-content-center text-center py-5">
      <h1 className="display-4 fw-bold cn-gradient-text">404</h1>
      <p className="text-secondary mb-4">This page could not be found.</p>
      <Button as={Link} to="/" variant="primary">
        Back home
      </Button>
    </Container>
  );
}
