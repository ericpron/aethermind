import React from "react";
import { Link } from "react-router-dom";
import W from "../assets/W.svg";
import U from "../assets/U.svg";
import B from "../assets/B.svg";
import R from "../assets/R.svg";
import G from "../assets/G.svg";

const Header = ({ title, subTitle, colorIdentity, isLoading }) => {
  return (
    <header className="App-header">
      <div className="mana-cost">
        {colorIdentity.includes("W") && (
          <img src={W} className="mana" alt="white mana symbol" />
        )}
        {colorIdentity.includes("U") && (
          <img src={U} className="mana" alt="blue mana symbol" />
        )}
        {colorIdentity.includes("B") && (
          <img src={B} className="mana" alt="black mana symbol" />
        )}
        {colorIdentity.includes("R") && (
          <img src={R} className="mana" alt="red mana symbol" />
        )}
        {colorIdentity.includes("G") && (
          <img src={G} className="mana" alt="green mana symbol" />
        )}
      </div>
      <h1 className="title">
        {isLoading ? "Building deck..." : <Link to="/">{title}</Link>}
      </h1>
      <h3 className="subTitle">
        {isLoading
          ? `${"In a cave! With a box of scraps! This might take 1-2 minutes. You won't get 100 cards every time either 🤷‍♂️ LLMs amirite??"}`
          : subTitle}
      </h3>
    </header>
  );
};

export default Header;
