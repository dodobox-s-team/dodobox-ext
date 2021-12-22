import React from "react";
import { Button, Card, Col, Container, Row, Spinner } from "react-bootstrap";
import { FaLock, FaTrash, FaUnlock } from "react-icons/fa";
import { Redirect } from "react-router-dom";
import ModalDeleteAccount from "../components/ModalDeleteAccount";
import ModalDisable2FA from "../components/ModalDisable2FA";
import ModalEnable2FA from "../components/ModalEnable2FA";
import { requests } from "../env";

interface User {
  id: number;
  email: string;
  username: string;
  has2fa: boolean;
}

interface DashboardState {
  user?: User;
  redirect?: string;
  modal?: "enable2fa" | "disable2fa" | "deleteAccount";
}

class Dashboard extends React.Component<{}, DashboardState> {
  state: DashboardState = {};

  componentDidMount() {
    this.load();
  }

  load() {
    requests
      .get(`/users/me`)
      .then((r) => this.setState({ user: r.data }))
      .catch((err) => {
        if (err.response.status == 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("hash2fa");
          this.setState({ redirect: "/login" });
        }
      });
  }

  enable2fa = () => this.setState({ modal: "enable2fa" });
  disable2fa = () => this.setState({ modal: "disable2fa" });
  deleteAccount = () => this.setState({ modal: "deleteAccount" });
  closeModal = (success: boolean) => {
    if (success) this.load();
    this.setState({ modal: undefined });
  };
  closeModalAccount = (success: boolean) => {
    let state: DashboardState = { modal: undefined };
    if (success) state.redirect = "/";
    this.setState(state);
  };

  render() {
    if (this.state.redirect) return <Redirect to={this.state.redirect} />;
    if (!this.state.user)
      return (
        <Container className="d-flex justify-content-center align-items-center vh-100">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Container>
      );

    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Card className="w-100 h-75">
          <Card.Body>
            <Container>
              <Container className="d-flex justify-content-center mb-2">
                <h3>Tableau de bord</h3>
              </Container>
              <Card className="mb-4">
                <Card.Header>
                  Utilisateur: {this.state.user?.username}
                </Card.Header>
                <Card.Body className="p-1">
                  <Container className="w-100">
                    <Row className="m-1">
                      <Col>Authentification à deux facteurs</Col>
                      <Col>
                        {this.state.user?.has2fa ? (
                          <Button
                            className="w-auto"
                            onClick={() => this.disable2fa()}
                            variant="danger"
                          >
                            <FaUnlock className="me-1" />
                            Désactiver
                          </Button>
                        ) : (
                          <Button
                            className="w-auto"
                            onClick={() => this.enable2fa()}
                            variant="primary"
                          >
                            <FaLock className="me-1" />
                            Activer
                          </Button>
                        )}
                      </Col>
                    </Row>
                    <Row className="m-1">
                      <Col>Supprimer mon compte</Col>
                      <Col>
                        <Button
                          className="w-auto"
                          onClick={() => this.deleteAccount()}
                          variant="danger"
                        >
                          <FaTrash className="me-1" />
                          Supprimer
                        </Button>
                      </Col>
                    </Row>
                  </Container>
                </Card.Body>
              </Card>
              <Card className="m-2 mb-4">
                <Card.Header>Domaine</Card.Header>
                <Card.Body></Card.Body>
              </Card>
            </Container>
          </Card.Body>
        </Card>
        <ModalEnable2FA
          show={this.state.modal == "enable2fa"}
          onClose={this.closeModal}
        />
        <ModalDisable2FA
          show={this.state.modal == "disable2fa"}
          onClose={this.closeModal}
        />
        <ModalDeleteAccount
          show={this.state.modal == "deleteAccount"}
          has2fa={this.state.user.has2fa}
          onClose={this.closeModalAccount}
        />
      </Container>
    );
  }
}

export default Dashboard;
