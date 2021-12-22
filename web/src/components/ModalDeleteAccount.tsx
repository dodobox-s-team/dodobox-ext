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
import { AxiosError, AxiosRequestConfig } from "axios";
import { FaExclamationTriangle } from "react-icons/fa";

interface CloseCallback {
  (success: boolean): void;
}

interface Props {
  show: boolean;
  has2fa: boolean;
  onClose: CloseCallback;
}

interface State {
  error?: string;
}

class ModalDeleteAccount extends React.Component<Props, State> {
  state: State = {};

  submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let config: AxiosRequestConfig = { data: {} };

    if (this.props.has2fa) {
      const target = e.target as typeof e.target & {
        code: { value: string };
      };
      config.data.code = target.code.value;
    }

    requests
      .delete("/users/me", config)
      .then((r) => {
        toast.success("Compte supprimé avec succès.");
        this.props.onClose(true);
      })
      .catch((e: AxiosError) => {
        const data = e.response?.data as { detail?: string };
        this.setState({ error: data?.detail });
      });
  };

  render(): React.ReactNode {
    return (
      <Modal show={this.props.show}>
        <Form onSubmit={this.submit}>
          <Modal.Header>Suppression du compte</Modal.Header>
          <Modal.Body>
            {this.state.error && (
              <Alert variant="danger">{this.state.error}</Alert>
            )}
            <Container className="m-2 fw-bold text-danger">
              <Row xs={2}>
                <Col xs={3} md={2}>
                  <FaExclamationTriangle className="w-100 h-100" />
                </Col>
                <Col xs={9} md={10}>
                  Vous êtes sur le point de supprimer votre compte. Cette action
                  est irréversible. Êtes-vous certain de vouloir le supprimer ?
                </Col>
              </Row>
            </Container>
            {this.props.has2fa && (
              <Container>
                <Row className="m-2">
                  <Col>
                    Veuillez entrer le code de double authentification pour
                    supprimer sur votre compte.
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
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => this.props.onClose(false)}
            >
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Supprimer
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
}

export default ModalDeleteAccount;
