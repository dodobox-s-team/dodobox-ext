import React from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { FaCopy, FaEdit, FaLock, FaTrash, FaUnlock } from "react-icons/fa";
import { Redirect } from "react-router-dom";
import ModalAddDomain from "../components/ModalAddDomain";
import ModalDeleteAccount from "../components/ModalDeleteAccount";
import ModalDisable2FA from "../components/ModalDisable2FA";
import ModalEnable2FA from "../components/ModalEnable2FA";
import { requests } from "../env";
import Domain from "../common/domain";
import ModalEditDomain from "../components/ModalEditDomain";
import ModalDeleteDomain from "../components/ModalDeleteDomain";
import { toast } from "react-toastify";

interface User {
  id: number;
  email: string;
  username: string;
  has2fa: boolean;
  domains: Domain[];
}

interface DashboardState {
  user?: User;
  redirect?: string;
  domain?: Domain;
  modal?:
    | "enable2fa"
    | "disable2fa"
    | "deleteAccount"
    | "addDomain"
    | "editDomain"
    | "deleteDomain";
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
  addDomain = () => this.setState({ modal: "addDomain" });
  getToken = async (i: number) => {
    if (!this.state.user) return;
    try {
      const domain = this.state.user.domains[i];
      const r = await requests.get(`/domains/${domain.name}/token`);
      const token = r.data.token;

      await navigator.clipboard.writeText(token);
      toast.success(`Le token a ??t?? copi?? dans le presse papier !`);
    } catch (e) {
      toast.error(`Une erreur est survenue: ${e}`);
    }
  };
  editDomain = (i: number) => {
    if (!this.state.user) return;
    this.setState({
      modal: "editDomain",
      domain: this.state.user.domains[i],
    });
  };
  deleteDomain = (i: number) => {
    if (!this.state.user) return;
    this.setState({
      modal: "deleteDomain",
      domain: this.state.user.domains[i],
    });
  };
  closeModal = (success: boolean) => {
    if (success) this.load();
    this.setState({ modal: undefined, domain: undefined });
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
          <Card.Body className="w-sm-100">
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
                      <Col>Authentification ?? deux facteurs</Col>
                      <Col>
                        {this.state.user?.has2fa ? (
                          <Button
                            className="w-auto"
                            onClick={() => this.disable2fa()}
                            variant="danger"
                          >
                            <FaUnlock className="me-1" />
                            D??sactiver
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
                <Card.Header>
                  <Container className="d-flex justify-content-between align-items-center">
                    <span>Domaine</span>
                    <Button onClick={() => this.addDomain()}>
                      Ajouter un domaine
                    </Button>
                  </Container>
                </Card.Header>
                <Card.Body>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>IPv4</th>
                        <th align="right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.user.domains.map((domain, i) => (
                        <tr key={i}>
                          <td>{domain.name}</td>
                          <td>{domain.ipv4}</td>
                          <td align="right">
                            <Button
                              onClick={() => this.getToken(i)}
                              className="me-1"
                            >
                              <FaCopy />
                            </Button>
                            <Button
                              onClick={() => this.editDomain(i)}
                              className="me-1"
                              variant="secondary"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              onClick={() => this.deleteDomain(i)}
                              variant="danger"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
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
        <ModalAddDomain
          show={this.state.modal == "addDomain"}
          uid={this.state.user.id}
          onClose={this.closeModal}
        />
        <ModalEditDomain
          show={this.state.modal == "editDomain"}
          domain={this.state.domain}
          onClose={this.closeModal}
        />
        <ModalDeleteDomain
          show={this.state.modal == "deleteDomain"}
          domain={this.state.domain}
          onClose={this.closeModal}
        />
      </Container>
    );
  }
}

export default Dashboard;
