import { useState } from "react";
import { Alert, Button, Form, Spinner, Table } from "react-bootstrap";
import client from "../api/client";

export default function CsvUpload({ title, endpoint, columns, onImported }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await client.post(endpoint, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(data);
      onImported?.();
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h5 className="fw-bold mb-3">{title}</h5>
      <Form onSubmit={handleUpload} className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <Form.Group controlId={`file-${endpoint}`}>
          <Form.Label className="small text-secondary">Choose CSV file</Form.Label>
          <Form.Control
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </Form.Group>
        <Button type="submit" variant="primary" disabled={!file || loading}>
          {loading ? <Spinner size="sm" animation="border" /> : "Upload & Import"}
        </Button>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      {result && (
        <>
          <Alert variant="success">
            Imported {result.imported}, updated {result.updated}, skipped{" "}
            {result.skipped} of {result.total_rows} rows.
          </Alert>
          {result.errors?.length > 0 && (
            <Alert variant="warning">
              <ul className="mb-0">
                {result.errors.slice(0, 8).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </Alert>
          )}
          {result.preview?.length > 0 && (
            <>
              <div className="small text-secondary mb-1">Preview (first rows)</div>
              <div className="table-responsive">
                <Table size="sm" bordered hover>
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i}>
                        {columns.map((c) => (
                          <td key={c}>{String(row[c] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
