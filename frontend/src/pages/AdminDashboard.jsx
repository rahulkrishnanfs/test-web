import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Container,
  Form,
  InputGroup,
  Spinner,
  Tab,
  Table,
  Tabs,
} from "react-bootstrap";
import CsvUpload from "../components/CsvUpload";
import EditAttendeeModal from "../components/EditAttendeeModal";
import ReassignModal from "../components/ReassignModal";
import StatCards from "../components/StatCards";
import client from "../api/client";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loadingRows, setLoadingRows] = useState(false);
  const [mapResult, setMapResult] = useState(null);
  const [mapping, setMapping] = useState(false);
  const [reassignTarget, setReassignTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadStats = useCallback(() => {
    client.get("/admin/stats").then((res) => setStats(res.data));
  }, []);

  const loadRows = useCallback(() => {
    setLoadingRows(true);
    client
      .get("/admin/mappings", {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      })
      .then((res) => setRows(res.data))
      .finally(() => setLoadingRows(false));
  }, [search, statusFilter]);

  const loadAudit = useCallback(() => {
    client.get("/admin/audit-logs").then((res) => setAuditLogs(res.data));
  }, []);

  useEffect(() => {
    loadStats();
    loadAudit();
  }, [loadStats, loadAudit]);

  useEffect(() => {
    const t = setTimeout(loadRows, 250);
    return () => clearTimeout(t);
  }, [loadRows]);

  const refreshAll = () => {
    loadStats();
    loadRows();
    loadAudit();
  };

  const handleMapCredits = async () => {
    setMapping(true);
    setMapResult(null);
    try {
      const { data } = await client.post("/admin/map-credits");
      setMapResult(data);
      refreshAll();
    } finally {
      setMapping(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete attendee ${row.name}? Their code returns to the pool.`))
      return;
    await client.delete(`/admin/attendees/${row.attendee_id}`);
    refreshAll();
  };

  const exportCsv = async () => {
    const res = await client.get("/admin/export.csv", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cursor_northampton_mappings.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container className="cn-page py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h2 className="fw-bold mb-0">Admin Dashboard</h2>
      </div>

      <StatCards stats={stats} />

      <Tabs defaultActiveKey="mappings" className="mb-4">
        <Tab eventKey="mappings" title="Mappings">
          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
            <InputGroup style={{ maxWidth: 320 }}>
              <Form.Control
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
            <Form.Select
              style={{ maxWidth: 200 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="mapped">Mapped</option>
              <option value="unmapped">Unmapped</option>
            </Form.Select>
            <div className="ms-auto d-flex gap-2">
              <Button variant="success" onClick={handleMapCredits} disabled={mapping}>
                {mapping ? <Spinner size="sm" animation="border" /> : "Map Credits"}
              </Button>
              <Button variant="outline-primary" onClick={exportCsv}>
                Export CSV
              </Button>
            </div>
          </div>

          {mapResult && (
            <Alert variant="info" onClose={() => setMapResult(null)} dismissible>
              Assigned {mapResult.newly_assigned} new credit(s). Total mapped:{" "}
              {mapResult.total_mapped}. Unmapped attendees:{" "}
              {mapResult.unmapped_attendees.length}. Unused codes:{" "}
              {mapResult.unused_codes.length}.
            </Alert>
          )}

          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingRows && (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <Spinner animation="border" size="sm" />
                    </td>
                  </tr>
                )}
                {!loadingRows && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary py-4">
                      No attendees yet. Upload the attendee CSV to get started.
                    </td>
                  </tr>
                )}
                {!loadingRows &&
                  rows.map((row) => (
                    <tr key={row.attendee_id}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td className="cn-code-pill">{row.code || "—"}</td>
                      <td>
                        <Badge bg={row.status === "mapped" ? "success" : "secondary"}>
                          {row.status}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-1"
                          onClick={() => setReassignTarget(row)}
                        >
                          {row.status === "mapped" ? "Reassign" : "Assign"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          className="me-1"
                          onClick={() => setEditTarget(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(row)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="attendees" title="Upload Attendees">
          <CsvUpload
            title="Import attendees CSV"
            endpoint="/admin/import/attendees"
            columns={["name", "email", "phone_number", "ticket_name"]}
            onImported={refreshAll}
          />
        </Tab>

        <Tab eventKey="codes" title="Upload Credits">
          <CsvUpload
            title="Import Cursor referral codes CSV"
            endpoint="/admin/import/codes"
            columns={["code", "url"]}
            onImported={refreshAll}
          />
        </Tab>

        <Tab eventKey="audit" title="Audit Log">
          <div className="d-flex justify-content-end mb-2">
            <Button size="sm" variant="outline-secondary" onClick={loadAudit}>
              Refresh
            </Button>
          </div>
          <div className="table-responsive">
            <Table size="sm" hover>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary py-3">
                      No actions logged yet.
                    </td>
                  </tr>
                )}
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="small">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="small">{log.actor_email}</td>
                    <td>
                      <Badge bg="light" text="dark">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="small">
                      {log.entity}
                      {log.entity_id ? ` #${log.entity_id}` : ""}
                    </td>
                    <td className="small text-secondary">
                      {log.detail ? JSON.stringify(log.detail) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Tab>
      </Tabs>

      <ReassignModal
        show={!!reassignTarget}
        attendee={reassignTarget}
        onHide={() => setReassignTarget(null)}
        onSaved={refreshAll}
      />
      <EditAttendeeModal
        show={!!editTarget}
        attendee={editTarget}
        onHide={() => setEditTarget(null)}
        onSaved={refreshAll}
      />
    </Container>
  );
}
