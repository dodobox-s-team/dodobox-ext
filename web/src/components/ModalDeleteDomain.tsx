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

class ModalDeleteDomain extends React.Component<Props, State> {
  state: State = {};

  submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    requests
      .delete(`/domains/${this.props.domain.name}`)
      .then((r) => {
        toast.success("Domaine supprimé avec succès.");
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
          <Modal.Header>Supression d'un domaine</Modal.Header>
          <Modal.Body>
            {this.state.error && (
              <Alert variant="danger">{this.state.error}</Alert>
            )}
            <Container>
              Voulez-vous vraiment supprimer le domaine {this.props.domain.name}{" "}
              ?
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => this.props.onClose(false)}
            >
              Annuler
            </Button>
            <Button variant="danger" type="submit">
              Supprimer
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  }
}

export default ModalDeleteDomain;
