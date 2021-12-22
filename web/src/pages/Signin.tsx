import { AxiosError, AxiosResponse } from "axios";
import React from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  FloatingLabel,
  Form,
} from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import { Link, Redirect } from "react-router-dom";
import { requests } from "../env";

interface SigninState {
  redirect?: string;
  error?: string;
}

class Signin extends React.Component<{}, SigninState> {
  state: SigninState = {};

  signin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      email: { value: string };
      username: { value: string };
      password: { value: string };
      password_confirm: { value: string; setCustomValidity: Function };
    };

    if (target.password_confirm.value != target.password.value) {
      target.password_confirm.setCustomValidity(
        "Les deux mots de passes doivent être identique !"
      );
      return;
    }
    target.password_confirm.setCustomValidity("");

    const data = {
      email: target.email.value.trim(),
      username: target.username.value.trim(),
      password: target.password.value.trim(),
    };

    requests
      .post("/users/create", data)
      .then((r) => this.setState({ redirect: "/login", error: undefined }))
      .catch((e: AxiosError) => {
        if (e.response?.status == 401) {
          this.setState({ error: e.response.data.detail });
        } else if (e.response?.status == 409) {
          this.setState({
            error: "Ce nom d'utilisateur n'est pas disponible",
          });
        } else if (e.response?.status == 422) {
          const data = e.response.data as {
            detail: {
              loc: string[];
              msg: string;
              type: string;
            }[];
          };
          const message = data.detail
            .map((d) => `${d.loc.join(".")}: ${d.msg}`)
            .join("\n");

          this.setState({ error: message });
        }
      });
  }

  render() {
    const flex = "d-flex justify-content-center align-items-center ";
    return (
      <Container className={flex + "vh-100"}>
        {this.state.redirect && <Redirect to={this.state.redirect} />}
        <Card style={{ maxWidth: "500px" }} className="flex-grow-1">
          <Card.Header className="text-center">
            <h3>Inscription</h3>
            <small>Créez un compte pour accéder au tableau de bord</small>
          </Card.Header>
          <Card.Body>
            <Container>
              <Form onSubmit={(e) => this.signin(e)} className="p-3">
                <Alert variant="danger" show={!!this.state.error}>
                  {this.state.error}
                </Alert>
                <FloatingLabel
                  label="E-mail"
                  className="mb-3"
                  controlId="email"
                >
                  <Form.Control
                    type="email"
                    placeholder="email"
                    autoComplete="email"
                    required
                  />
                </FloatingLabel>
                <FloatingLabel
                  label="Nom d'utilisateur"
                  className="mb-3"
                  controlId="username"
                >
                  <Form.Control
                    type="text"
                    placeholder="username"
                    autoComplete="username"
                    minLength={3}
                    required
                  />
                </FloatingLabel>
                <FloatingLabel
                  label="Mot de passe"
                  className="mb-3"
                  controlId="password"
                >
                  <Form.Control
                    type="password"
                    placeholder="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={64}
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).*"
                    required
                  />
                  <Container>
                    <small>
                      Le mot de passe doit contenir au moins 8 caractères, une
                      majuscule, une minuscule et un chiffre.
                    </small>
                  </Container>
                </FloatingLabel>
                <FloatingLabel
                  label="Confirmation du mot de passe"
                  className="mb-3"
                  controlId="password_confirm"
                >
                  <Form.Control
                    type="password"
                    placeholder="password"
                    autoComplete="new-password"
                    required
                  />
                </FloatingLabel>
                <Container className={flex + "flex-column"}>
                  <Col>
                    <Button variant="primary" type="submit">
                      S'inscrire
                    </Button>
                  </Col>
                  <Col>
                    <small>
                      <i>Vous avez déjà un compte ?</i>
                    </small>
                  </Col>
                  <Col>
                    <Link to="/login">Se connecter</Link>
                  </Col>
                </Container>
              </Form>
            </Container>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default Signin;
