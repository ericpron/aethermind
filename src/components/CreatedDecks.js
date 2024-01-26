// CreatedDecks.js
import React, { useState, useEffect } from "react";
import db from "../firebase"; // Adjust the path if necessary
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";

const CreatedDecks = ({ setDecks, decks }) => {
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
  }, [setDecks]);

  if (!decks) {
    return <div>Loading decks...</div>;
  }

  const removeDeck = async (deckId) => {
    try {
      // Delete the deck from Firestore
      await deleteDoc(doc(db, "decks", deckId));

      // Filter out the removed deck from the local state
      const updatedDecks = decks.filter((deck) => deck.id !== deckId);
      setDecks(updatedDecks);
    } catch (error) {
      console.error("Error removing deck: ", error);
    }
  };

  return (
    <div className="decks">
      <h2 className="category">Created Decks</h2>
      <ul>
        {decks.map((deck) => (
          <li key={deck.id} className="card-item">
            <Link to={`/deck/${deck.id}`}>{deck.name}</Link>
            <button
              className="delete-button"
              onClick={() => removeDeck(deck.id)}
            >
              x
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreatedDecks;
