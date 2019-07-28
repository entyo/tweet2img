// import "firebase/auth";
import React from "react";
import { render } from "react-dom";
import {
  Navbar,
  Title,
  Container,
  Control,
  Button,
  Input,
  Field,
  Section
} from "rbx";
import "./index.scss";
import { ThemeContext, themeValue } from "./context";

function Header() {
  return (
    <Navbar color="twitter">
      <Navbar.Brand>
        <Navbar.Item href="/">
          <Title className="twitter-invert-color">tweet2pdf</Title>
        </Navbar.Item>
        <Navbar.Burger />
      </Navbar.Brand>
    </Navbar>
  );
}

function App() {
  return (
    <>
      <Header />
      <Section>
        <Container>
          <Field kind="group">
            <Control expanded>
              <Input placeholder="https://twitter.com/e_ntyo/status/1152897532621516800" />
            </Control>
            <Control>
              <Button color="info">PDFファイルを生成</Button>
            </Control>
          </Field>
        </Container>
      </Section>
    </>
  );
}

function WithContext() {
  return (
    <ThemeContext.Provider value={themeValue}>
      <App />
    </ThemeContext.Provider>
  );
}

render(<WithContext />, document.getElementById("root"));
