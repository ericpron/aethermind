import React, { useState, useEffect } from "react";
import db from "./firebase"; // Adjust the path if necessary
import { collection, getDocs } from "firebase/firestore";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Deck from "./components/Deck";
import DeckGenerator from "./components/DeckGenerator";
import Header from "./components/Header";
import CreatedDecks from "./components/CreatedDecks"; // Import the new component
import "./App.css";
import "./mana.min.css";

function App() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <Router>
      <>
        <div className="App">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Header
                    title="The Aethermind"
                    subTitle="An AI deck builder for the Commander/EDH format"
                    colorIdentity="W, U, B, R, G"
                    isLoading={loading}
                  />
                  {loading ? (
                    <div></div>
                  ) : (
                    <>
                      <DeckGenerator
                        setDecks={setDecks}
                        decks={decks}
                        setLoading={setLoading}
                      />
                      <CreatedDecks setDecks={setDecks} decks={decks} />
                    </>
                  )}
                </>
              }
            />

            <Route
              path="/deck/:deckId"
              element={<Deck decks={decks} setDecks={setDecks} />}
            />
          </Routes>
        </div>
      </>
    </Router>
  );
}

export default App;
