import React from "react";
import { Container } from "react-bootstrap";
import { Redirect } from "react-router-dom";
import { requests } from "../env";

class RedirectPage extends React.Component<{}, {}> {
  render() {
    const token = requests.defaults.headers.common["Authorization"];
    const redirect = !token || token.length == 0 ? "/login" : "/dashboard";

    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Redirect to={redirect} />
      </Container>
    );
  }
}

export default RedirectPage;
