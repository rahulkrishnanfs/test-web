import { Card, Col, Row } from "react-bootstrap";

const items = [
  { key: "total_attendees", label: "Attendees", variant: "primary" },
  { key: "total_codes", label: "Total Credits", variant: "info" },
  { key: "assigned_codes", label: "Assigned", variant: "success" },
  { key: "remaining_codes", label: "Remaining", variant: "warning" },
  { key: "redeemed_codes", label: "Redeemed", variant: "secondary" },
];

export default function StatCards({ stats }) {
  if (!stats) return null;
  return (
    <Row className="g-3 mb-4">
      {items.map((item) => (
        <Col xs={6} md={4} lg key={item.key}>
          <Card className={`cn-stat-card shadow-sm text-bg-${item.variant}`}>
            <Card.Body>
              <div className="cn-stat-value">{stats[item.key]}</div>
              <div className="text-uppercase small opacity-75">{item.label}</div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
