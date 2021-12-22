import "./App.scss";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import PageNotFound from "./pages/errors/404";
import RedirectPage from "./pages/RedirectPage";
import Signin from "./pages/Signin";
import { requests } from "./env";

function App() {
  const token = localStorage.getItem("token");
  if (token) {
    requests.defaults.headers.common["Authorization"] = token;
  }

  return (
    <Router>
      <Container className="d-flex">
        <Container style={{ width: "100%" }}>
          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/signin">
              <Signin />
            </Route>
            <Route path="/dashboard">
              <Dashboard />
            </Route>
            <Route exact path="/">
              <RedirectPage />
            </Route>
            <Route path="/">
              <PageNotFound />
            </Route>
          </Switch>
        </Container>
        <ToastContainer />
      </Container>
    </Router>
  );
}

export default App;
