import React from "react";

import { Navbar, Title } from "rbx";

export function Header() {
  return (
    <Navbar color="twitter">
      <Navbar.Brand>
        <Navbar.Item href="/">
          <Title className="twitter-invert-color">tweet2img</Title>
        </Navbar.Item>
        <Navbar.Burger />
      </Navbar.Brand>
    </Navbar>
  );
}
