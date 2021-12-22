import React from "react";
import {
  Alert,
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  InputGroup,
  Modal,
  Row,
} from "react-bootstrap";
import { requests } from "../env";
import { toast } from "react-toastify";
import { AxiosError, AxiosRequestConfig } from "axios";
import { FaExclamationTriangle } from "react-icons/fa";
import Domain from "../common/domain";

interface CloseCallback {
  (success: boolean): void;
}

interface Props {
  show: boolean;
  domain?: Domain;
  onClose: CloseCallback;
}

interface State {
  error?: string;
}

class ModalEditDomain extends React.Component<Props, State> {
  state: State = {};

  submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      ipv4: { value: string };
    };

    requests
      .put(`/domains/${this.props.domain.name}`, {
        ipv4: target.ipv4.value.trim(),
      })
      .then((r) => {
        toast.success("Domaine modifié avec succès.");
        this.props.onClose(true);
      })
      .catch((e: AxiosError) => {
        const data = e.response?.data as { detail?: string };
        this.setState({ error: data?.detail });
      });
  };

  render(): React.ReactNode {
    if (!this.props.domain) return <></>;

    return (
      <Modal show={this.props.show}>
        <Form onSubmit={this.submit}>
          <Modal.Header>Ajout d'un domaine</Modal.Header>
          <Modal.Body>
            {this.state.error && (
              <Alert variant="danger">{this.state.error}</Alert>
            )}
            <Container>
              <Form.Label htmlFor="domain">Nom de domaine</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  id="domain"
                  aria-label="Nom de domaine"
                  placeholder="Nom de domaine"
                  value={this.props.domain.name.replace(/\.dodobox\.site$/, "")}
                  readOnly
                />
                <InputGroup.Text>.dodobox.site</InputGroup.Text>
              </InputGroup>
              <Form.Group controlId="ipv4" className="mt-2">
                <Form.Label>Adresse IPv4</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="192.168.1.254"
                  defaultValue={this.props.domain.ipv4}
                  pattern="^(?:(?:25[0-5]|2[0-4]\d|1?\d{0,2})\.){3}(25[0-5]|2[0-4]\d|1?\d{1,2})$"
                  spellCheck={false}
                  autoComplete="off"
                  required
                />
              </Form.Group>
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
              Ajouter
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
}

export default ModalEditDomain;
