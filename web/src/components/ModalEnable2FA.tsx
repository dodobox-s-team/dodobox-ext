import React from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import QRCode from "qrcode.react";
import { requests } from "../env";
import { toast } from "react-toastify";
import { AxiosError } from "axios";

interface CloseCallback {
  (success: boolean): void;
}

interface Props {
  show: boolean;
  onClose: CloseCallback;
}

interface State {
  totp_url?: string;
  token?: string;
  error?: string;
}

class ModalEnable2FA extends React.Component<Props, State> {
  state: State = {};

  componentDidMount() {
    this.load();
  }

  load() {
    requests.get("/auth/2fa/new").then((r) => {
      const data = r.data as {
        uri: string;
        token: string;
      };

      this.setState({ totp_url: data.uri, token: data.token });
    });
  }

  submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      code: { value: string };
    };

    requests
      .post("/auth/2fa/enable", {
        code: target.code.value,
        token: this.state.token,
      })
      .then((r) => {
        toast.success("2FA activé avec succès");
        this.props.onClose(true);
        this.setState({ error: undefined });
      })
      .catch((e: AxiosError) => {
        const data = e.response?.data as { detail?: string };
        this.setState({ error: data.detail });
      });
  };

  render(): React.ReactNode {
    return (
      <Modal show={this.props.show}>
        <Form onSubmit={this.submit}>
          <Modal.Header>Authentification à deux facteurs</Modal.Header>
          <Modal.Body>
            {this.state.error && (
              <Alert variant="danger">{this.state.error}</Alert>
            )}
            <Container>
              <Row className="m-2">
                <Col>
                  Veuillez scanner le QR Code avec votre application de double
                  authentification (Google Authenticator, Authy, ...)
                </Col>
              </Row>
              <Row className="m-2">
                <Col className="w-100 d-flex justify-content-center">
                  {this.state.totp_url ? (
                    <QRCode
                      value={this.state.totp_url}
                      // fgColor="#FF1493"
                      level="H"
                      renderAs="svg"
                      size={128}
                    />
                  ) : (
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  )}
                </Col>
              </Row>
              <Row>
                <Col className="w-100 d-flex justify-content-center">
                  <FloatingLabel
                    label="Code à 6 chiffres"
                    className="mb-3 mt-3 w-auto"
                    controlId="code"
                  >
                    <Form.Control
                      type="text"
                      placeholder="Code à 6 chiffres"
                      maxLength={6}
                      minLength={6}
                      onKeyPress={(e) => {
                        if (isNaN(+e.key)) e.preventDefault();
                      }}
                      spellCheck={false}
                      autoComplete="one-time-code"
                      autoFocus
                      required
                    />
                  </FloatingLabel>
                </Col>
              </Row>
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => this.props.onClose(false)}
            >
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Activer
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
}

export default ModalEnable2FA;
