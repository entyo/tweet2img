// import "firebase/auth";
import React from "react";
import { render } from "react-dom";
import { Container, Section, Footer, Content } from "rbx";
import "./index.scss";
import { ThemeContext, themeValue } from "./context";
import { Header } from "./header";
import { TweetForm } from "./tweet-form";

function App() {
  return (
    <>
      <header className="header">
        <Header />
      </header>
      <main className="content">
        <Section>
          <Container>
            <TweetForm />
          </Container>
        </Section>
      </main>
      <Footer className="footer">
        <Content textAlign="centered">
          <p>
            つくったひと: <a href="https://twitter.com/e_ntyo">e_ntyo</a>
          </p>
        </Content>
      </Footer>
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
