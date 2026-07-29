import { Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Community-first",
    body: "Cursor Northampton brings together local builders, students, and founders shipping real products with AI.",
  },
  {
    title: "Cursor AI credits",
    body: "Every checked-in attendee gets a unique Cursor referral credit to supercharge their next project.",
  },
  {
    title: "Instant access",
    body: "Log in with the email you registered with to reveal your personal QR code and referral link.",
  },
];

export default function Home() {
  return (
    <div className="cn-page">
      <div className="cn-hero">
        <Container>
          <Row className="align-items-center">
            <Col lg={7}>
              <Badge bg="primary" className="mb-3">
                Northampton, UK
              </Badge>
              <h1 className="mb-3">
                Build faster with <span className="cn-gradient-text">Cursor</span> at
                Northampton
              </h1>
              <p className="lead text-secondary mb-4">
                Welcome to the Cursor Northampton community credits portal. Claim your
                Cursor AI referral credit, scan your personal QR code, and start building
                with the most productive AI code editor.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button as={Link} to="/login" size="lg" variant="primary">
                  Access Attendee Portal
                </Button>
                <Button as={Link} to="/admin/login" size="lg" variant="outline-secondary">
                  Admin Login
                </Button>
              </div>
            </Col>
            <Col lg={5} className="mt-5 mt-lg-0 text-center">
              <div className="cn-qr-wrap shadow-lg">
                <svg width="220" height="220" viewBox="0 0 100 100" role="img" aria-label="QR illustration">
                  <rect width="100" height="100" fill="#fff" />
                  <g fill="#1a1a1a">
                    <rect x="6" y="6" width="24" height="24" />
                    <rect x="12" y="12" width="12" height="12" fill="#fff" />
                    <rect x="70" y="6" width="24" height="24" />
                    <rect x="76" y="12" width="12" height="12" fill="#fff" />
                    <rect x="6" y="70" width="24" height="24" />
                    <rect x="12" y="76" width="12" height="12" fill="#fff" />
                    <rect x="40" y="10" width="6" height="6" />
                    <rect x="52" y="10" width="6" height="6" />
                    <rect x="40" y="40" width="20" height="20" fill="#6c5ce7" />
                    <rect x="70" y="46" width="6" height="6" />
                    <rect x="82" y="52" width="6" height="6" />
                    <rect x="46" y="70" width="6" height="6" />
                    <rect x="64" y="82" width="6" height="6" />
                    <rect x="82" y="70" width="6" height="6" fill="#00cec9" />
                  </g>
                </svg>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-5">
        <Row className="g-4">
          {features.map((f) => (
            <Col md={4} key={f.title}>
              <Card className="cn-feature-card shadow-sm">
                <Card.Body>
                  <Card.Title className="h5">{f.title}</Card.Title>
                  <Card.Text className="text-secondary">{f.body}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="mt-5">
          <Col className="text-center">
            <h3 className="fw-bold mb-3">Ready to claim your credit?</h3>
            <p className="text-secondary mb-4">
              Use the email address you registered with at the event.
            </p>
            <Button as={Link} to="/login" size="lg" variant="primary">
              Go to Attendee Portal
            </Button>
          </Col>
        </Row>
      </Container>

      <footer className="border-top py-4">
        <Container className="text-center text-secondary small">
          Cursor Northampton Community &middot; Built for the community, by the community.
        </Container>
      </footer>
    </div>
  );
}
