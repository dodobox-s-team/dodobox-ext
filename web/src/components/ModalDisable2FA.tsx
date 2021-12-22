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
} from "react-bootstrap";
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
  error?: string;
}

class ModalDisable2FA extends React.Component<Props, State> {
  state: State = {};

  submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      code: { value: string };
    };

    requests
      .post("/auth/2fa/disable", {
        code: target.code.value,
      })
      .then((r) => {
        toast.success("2FA désactivé avec succès");
        this.props.onClose(true);
      })
      .catch((e: AxiosError) => {
        console.log(e);
        const data = e.response?.data as { detail?: string };
        this.setState({ error: data?.detail });
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
                  Veuillez entrer le code de double authentification pour
                  désactiver la fonctionnailté sur votre compte.
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

export default ModalDisable2FA;
