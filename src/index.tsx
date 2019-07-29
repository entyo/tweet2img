// import "firebase/auth";
import React from "react";
import { render } from "react-dom";
import { Container, Section } from "rbx";
import "./index.scss";
import { ThemeContext, themeValue } from "./context";
import { Header } from "./header";
import { TweetForm } from "./tweet-form";

function App() {
  return (
    <>
      <Header />
      <Section>
        <Container>
          <TweetForm />
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
