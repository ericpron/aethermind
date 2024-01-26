import React from "react";
import { Link } from "react-router-dom";
import W from "../assets/W.svg";
import U from "../assets/U.svg";
import B from "../assets/B.svg";
import R from "../assets/R.svg";
import G from "../assets/G.svg";

const Header = ({ title, subTitle }) => {
  return (
    <header className="App-header">
      <div className="mana-cost">
        <img src={W} className="mana" alt="white mana symbol" />
        <img src={U} className="mana" alt="blue mana symbol" />
        <img src={B} className="mana" alt="black mana symbol" />
        <img src={R} className="mana" alt="red mana symbol" />
        <img src={G} className="mana" alt="green mana symbol" />
      </div>
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
