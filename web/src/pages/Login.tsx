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

interface LoginState {
  redirect?: string;
  error?: string;
  has2fa: boolean;
}

class Login extends React.Component<{}, LoginState> {
  state: LoginState = { has2fa: false };

  load() {
    const has2fa = localStorage.getItem("has2fa");
    const token = localStorage.getItem("token");

    if (token && has2fa) {
      this.setState({ has2fa: has2fa == "true" });
    }
  }

  handleResponse(req: Promise<AxiosResponse>) {
    req
      .then((r) => {
        const data = r.data as {
          access_token: string;
          requires_2fa: boolean;
          token_type: string;
        };
        // Capitalize the token type
        const type = data.token_type
          .toLowerCase()
          .replace(/^./, data.token_type[0].toUpperCase());
        const token = `${type} ${data.access_token}`;

        // Set the default Authorization headers
        localStorage.setItem("token", token);
        localStorage.setItem("has2fa", String(data.requires_2fa));
        requests.defaults.headers.common["Authorization"] = token;

        if (data.requires_2fa) {
          this.setState({ has2fa: true, error: undefined });
        } else {
          this.setState({ redirect: "/", error: undefined });
        }
      })
      .catch((e: AxiosError) => {
        if (e.response?.status == 401)
          this.setState({ error: e.response.data.detail });
      });
  }

  login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      username: { value: string };
      password: { value: string };
    };
    const data = new FormData();
    data.append("username", target.username.value.trim());
    data.append("password", target.password.value.trim());

    this.handleResponse(
      requests.post("/auth", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  }

  login2fa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      code: { value: string };
    };

    this.handleResponse(
      requests.post("/auth/2fa/verify", { code: target.code.value.trim() })
    );
  }

  render() {
    const flex = "d-flex justify-content-center align-items-center ";
    return (
      <Container className={flex + "vh-100"}>
        {this.state.redirect && <Redirect to={this.state.redirect} />}
        <Card style={{ maxWidth: "500px" }} className="flex-grow-1">
          <Card.Header className="text-center">
            <h3>Connexion</h3>
            <small>Connectez-vous pour gérer votre compte</small>
          </Card.Header>
          <Card.Body>
            <Container>
              {this.state.has2fa && (
                <small className="p-3">
                  <FaArrowLeft />
                  <Link className="m-1" to="/login">
                    Retour à la connexion
                  </Link>
                </small>
              )}
              <Form
                onSubmit={
                  this.state.has2fa
                    ? (e) => this.login2fa(e)
                    : (e) => this.login(e)
                }
                className="p-3"
              >
                <Alert variant="danger" show={!!this.state.error}>
                  {this.state.error}
                </Alert>
                {this.state.has2fa ? (
                  <FloatingLabel
                    label="Code de double authentification à 6 chiffres"
                    className="mb-3"
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
                ) : (
                  <>
                    <FloatingLabel
                      label="Nom d'utilisateur"
                      className="mb-3"
                      controlId="username"
                    >
                      <Form.Control
                        type="text"
                        placeholder="username"
                        autoComplete="username"
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
                        autoComplete="current-password"
                        required
                      />
                    </FloatingLabel>
                  </>
                )}
                <Container className={flex + "flex-column"}>
                  <Col>
                    <Button variant="primary" type="submit">
                      Se connecter
                    </Button>
                  </Col>
                  {!this.state.has2fa && (
                    <>
                      <Col>
                        <small>
                          <i>Vous n'avez pas de compte ?</i>
                        </small>
                      </Col>
                      <Col>
                        <Link to="/signin">S'inscrire</Link>
                      </Col>
                    </>
                  )}
                </Container>
              </Form>
            </Container>
          </Card.Body>
        </Card>
      </Container>
    );
  }
}

export default Login;
