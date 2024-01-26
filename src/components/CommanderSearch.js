import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import db from "../firebase"; // Adjust the path if necessary

const CommanderSearch = ({ setDecks, decks }) => {
  const [commanderSearch, setCommanderSearch] = useState("");
  const [commanderSearchResults, setCommanderSearchResults] = useState([]);
  const navigate = useNavigate();

  // Commander search logic...
  // Logic for commander specific search
  useEffect(() => {
    if (commanderSearch.length > 2) {
      fetch(
        `https://api.scryfall.com/cards/search?q=${commanderSearch}+t:legendary+t:creature`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          if (data && Array.isArray(data.data)) {
            setCommanderSearchResults(data.data);
          } else {
            setCommanderSearchResults([]); // Set to empty array if response is not in expected format
          }
        })
        .catch((error) => {
          console.error("Error fetching data: ", error);
          setCommanderSearchResults([]); // Set to empty array in case of error
        });
    } else {
      setCommanderSearchResults([]); // Clear results if search term is too short
    }
  }, [commanderSearch]);

  const addCommanderAndCreateDeck = async (selectedCommander) => {
    try {
      const newDeck = {
        name: "New Deck", // You might want to prompt the user for a name or generate a default name
        Commanders: [selectedCommander],
        Planeswalkers: [],
        Creatures: [],
        Sorceries: [],
        Instants: [],
        Artifacts: [],
        Enchantments: [],
        Lands: [],
        Others: [],
      };

      const docRef = await addDoc(collection(db, "decks"), newDeck);
      setDecks([...decks, { ...newDeck, id: docRef.id }]);

      // Navigate to the new deck's detail page
      navigate(`/deck/${docRef.id}`);
    } catch (error) {
      console.error("Error creating deck with commander: ", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={commanderSearch}
        onChange={(e) => setCommanderSearch(e.target.value)}
        placeholder="Search for a commander"
      />
      <ul>
        {commanderSearchResults.map((card, index) => (
          <li key={index} className="commander-item">
            {card.name}
            <img
              src={
                card.image_uris
                  ? card.image_uris.normal
                  : card.card_faces[0].image_uris.normal
              }
              alt={`Card art for ${card.name}`}
              className="commander-image"
            />
            <button onClick={() => addCommanderAndCreateDeck(card)}>
              Select
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommanderSearch;
