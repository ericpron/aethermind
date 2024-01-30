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
                          This tool uses OpenAI's GPT-4 to help you build unique
                          commander decks. Results may vary, but you'll often
                          get an interesting starting point for a new deck.
                          Export to Moxfield or Arkidekt with the copy decklist
                          button.
                        </p>
                        <p>
                          Generating decks incurs costs, so please use sparingly
                          and consider buying me a coffee if you like the tool.
                          Enjoy!
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
