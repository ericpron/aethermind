import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/mana.png";

const Header = ({ title, subTitle }) => {
  return (
    <header className="App-header">
      <img src={logo} className="logo" alt="mana symbols" />
      <h1>
        <Link to="/" className="aethermind">
          {title}
        </Link>
      </h1>
      <h3>{subTitle}</h3>
    </header>
  );
};

export default Header;
