import React, { useState, useEffect } from "react";
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
                    subTitle="An AI deck builder for the Commander / EDH format"
                    colorIdentity=""
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
                      <div className="disclaimer">
                        <p>
                          This is a simple tool for building commander decks
                          using OpenAI's GPT-4 LLM. As a large language model,
                          it doesn't always give you what you want or expect,
                          but most of the time you get a pretty interesting deck
                          out of it. Use the copy decklist button to export it
                          to Moxfield or Arkidekt.
                        </p>
                        <p>
                          It costs me real world money every time a deck is
                          generated, so please use it sparingly. Buy me a coffee
                          if you want. Enjoy!{" "}
                        </p>
                      </div>
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
