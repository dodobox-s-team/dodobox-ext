import React from "react";
import { Col, Container, Row, Button } from "react-bootstrap";
import { FaEnvelope, FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

class PageNotFound extends React.Component<
  { message?: string },
  { counter: number }
> {
  state = {
    counter: 0,
  };

  private _interval?: number = undefined;
  componentDidMount() {
    this._interval = setInterval(() => {
      if (this.state.counter == 404) {
        return clearInterval(this._interval);
      }

      this.setState({
        counter:
          this.state.counter +
          Math.max(Math.ceil((404 - this.state.counter) / 10), 0),
      });
    }, 20);
  }

  componentWillUnmount() {
    if (this._interval !== undefined) {
      clearInterval(this._interval);
    }
  }

  render() {
    const message = this.props.message
      ? this.props.message
      : "Cette page est introuvable";

    return (
      <Container className="mt-5">
        <Row className="justify-content-md-center">
          <Col md="auto">
            <h1>{this.state.counter}</h1>
          </Col>
        </Row>
        <Row className="justify-content-md-center">
          <Col md="auto">{message}</Col>
        </Row>
        <Row className="justify-content-md-center mt-3">
          <Col md="auto">
            <Link to="/">
              <Button variant="primary">
                <FaHome /> Accueil
              </Button>
            </Link>
          </Col>
          <Col md="auto">
            <Button variant="outline-secondary">
              <FaEnvelope /> Support
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default PageNotFound;
