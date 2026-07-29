import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Container, Spinner } from "react-bootstrap";
import { QRCodeCanvas } from "qrcode.react";
import client from "../api/client";

export default function AttendancePortal() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    let active = true;
    client
      .get("/attendee/me/referral")
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch((err) => {
        if (active)
          setError(err.response?.data?.detail || "Could not load your referral.");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const copyLink = async () => {
    if (!data?.referral?.url) return;
    await navigator.clipboard.writeText(data.referral.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `cursor-referral-${data.referral.code}.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center cn-page">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="cn-page py-5">
      <div className="mx-auto" style={{ maxWidth: 560 }}>
        <h2 className="fw-bold mb-1">Hi {data?.name} 👋</h2>
        <p className="text-secondary mb-4">Here is your personal Cursor AI credit.</p>

        {error && <Alert variant="danger">{error}</Alert>}

        {!error && !data?.has_referral && (
          <Alert variant="warning">
            You don&apos;t have a referral credit assigned yet. Please check back later
            or ask an event organizer.
          </Alert>
        )}

        {data?.has_referral && (
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4 text-center">
              <div ref={qrRef} className="cn-qr-wrap shadow-sm mb-4">
                <QRCodeCanvas
                  value={data.referral.url}
                  size={240}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="mb-3">
                <div className="text-secondary small text-uppercase">Referral code</div>
                <div className="cn-code-pill h4 mb-0">{data.referral.code}</div>
              </div>

              <div className="mb-4">
                <div className="text-secondary small text-uppercase mb-1">
                  Referral URL
                </div>
                <a href={data.referral.url} target="_blank" rel="noreferrer">
                  {data.referral.url}
                </a>
              </div>

              <div className="d-flex flex-wrap justify-content-center gap-2">
                <Button variant="primary" onClick={copyLink}>
                  {copied ? "Copied!" : "Copy referral link"}
                </Button>
                <Button variant="outline-secondary" onClick={downloadQR}>
                  Download QR code
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </div>
    </Container>
  );
}
