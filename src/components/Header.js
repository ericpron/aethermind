import React from "react";
import { Link } from "react-router-dom";
import W from "../assets/W.svg";
import U from "../assets/U.svg";
import B from "../assets/B.svg";
import R from "../assets/R.svg";
import G from "../assets/G.svg";

const Header = ({ title, subTitle, colorIdentity }) => {
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
      <h1>
        <Link to="/" className="title">
          {title}
        </Link>
      </h1>
      <h3>{subTitle}</h3>
    </header>
  );
};

export default Header;
