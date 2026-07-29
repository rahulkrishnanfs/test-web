import { useEffect, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import client from "../api/client";

export default function ReassignModal({ show, onHide, attendee, onSaved }) {
  const [codes, setCodes] = useState([]);
  const [codeId, setCodeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setError("");
    setCodeId(attendee?.code_id ? String(attendee.code_id) : "");
    // Load available codes plus the attendee's current one.
    client
      .get("/admin/codes", { params: { only_available: true } })
      .then((res) => setCodes(res.data))
      .catch(() => setCodes([]));
  }, [show, attendee]);

  const save = async () => {
    if (!codeId) return;
    setLoading(true);
    setError("");
    try {
      await client.post("/admin/reassign", {
        attendee_id: attendee.attendee_id,
        code_id: Number(codeId),
      });
      onSaved?.();
      onHide();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reassign.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">Reassign credit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-secondary">
          Assign a referral code to <strong>{attendee?.name}</strong> (
          {attendee?.email}).
        </p>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Select value={codeId} onChange={(e) => setCodeId(e.target.value)}>
          <option value="">Select an available code…</option>
          {attendee?.code_id && attendee?.code && (
            <option value={attendee.code_id}>{attendee.code} (current)</option>
          )}
          {codes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}
            </option>
          ))}
        </Form.Select>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={save} disabled={!codeId || loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Save"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
