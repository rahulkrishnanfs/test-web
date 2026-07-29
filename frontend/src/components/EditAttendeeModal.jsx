import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import client from "../api/client";

export default function EditAttendeeModal({ show, onHide, attendee, onSaved }) {
  const [form, setForm] = useState({ name: "", email: "", phone_number: "", ticket_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (attendee) {
      setForm({
        name: attendee.name || "",
        email: attendee.email || "",
        phone_number: attendee.phone_number || "",
        ticket_name: attendee.ticket_name || "",
      });
      setError("");
    }
  }, [attendee, show]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      await client.patch(`/admin/attendees/${attendee.attendee_id}`, form);
      onSaved?.();
      onHide();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">Edit attendee</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-2">
          <Form.Label>Name</Form.Label>
          <Form.Control value={form.name} onChange={update("name")} />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Email</Form.Label>
          <Form.Control type="email" value={form.email} onChange={update("email")} />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Phone</Form.Label>
          <Form.Control value={form.phone_number} onChange={update("phone_number")} />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Ticket</Form.Label>
          <Form.Control value={form.ticket_name} onChange={update("ticket_name")} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
