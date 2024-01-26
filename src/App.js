import React, { useState, useEffect } from "react";
import db from "./firebase"; // Adjust the path if necessary
import { collection, getDocs } from "firebase/firestore";
import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import Deck from "./components/Deck";
import CommanderSearch from "./components/CommanderSearch";
import Header from "./components/Header";
import "./App.css";

function App() {
  const [decks, setDecks] = useState([]);

  const CreatedDecks = () => {
    useEffect(() => {
      const fetchDecks = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, "decks"));
          const decksArray = [];
          querySnapshot.forEach((doc) => {
            decksArray.push({ id: doc.id, ...doc.data() });
          });
          setDecks(decksArray);
        } catch (error) {
          console.error("Error fetching decks: ", error);
        }
      };

      fetchDecks();
    }, []);

    if (!decks) {
      return <div>Loading decks...</div>;
    }

    return (
      <div className="decks">
        <h2 className="category">Created Decks</h2>
        <ul>
          {decks.map((deck) => (
            <li key={deck.id} className="card-item">
              <Link to={`/deck/${deck.id}`}>{deck.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

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
                  />
                  <CommanderSearch setDecks={setDecks} decks={decks} />
                  <CreatedDecks />
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