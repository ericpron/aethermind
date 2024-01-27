import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, setDoc, getDoc, doc } from "firebase/firestore";
import db from "../firebase";
import search from "../assets/search.svg";

const CommanderSearch = ({ setDecks, decks }) => {
  const [commanderSearch, setCommanderSearch] = useState("");
  const [commanderSearchResults, setCommanderSearchResults] = useState([]);
  const [loading, setLoading] = useState(false); // State to handle loading screen
  const navigate = useNavigate();

  // Commander search logic
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

  const getCategory = (card) => {
    if (card.type_line.includes("Creature")) return "Creatures";
    if (card.type_line.includes("Planeswalker")) return "Planeswalkers";
    if (card.type_line.includes("Sorcery")) return "Sorceries";
    if (card.type_line.includes("Instant")) return "Instants";
    if (card.type_line.includes("Enchantment")) return "Enchantments";
    if (card.type_line.includes("Artifact")) return "Artifacts";
    if (card.type_line.includes("Land")) return "Lands";
    return "Others";
  };

  const generateDeckWithGPT4 = async (commander, deckId) => {
    setLoading(true); // Show loading screen
    try {
      const response = await fetch("http://localhost:3001/generate-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commander }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const { deckList } = await response.json();

      // Take only the first 99 cards from the deckList
      const first99Cards = deckList.slice(0, 99);

      await addGeneratedCardsToDeck(first99Cards, deckId);
      navigate(`/deck/${deckId}`);
    } catch (error) {
      console.error("Error generating deck: ", error);
      alert("Failed to generate deck. Please try again.");
    } finally {
      setLoading(false); // Hide loading screen
    }
  };

  const addGeneratedCardsToDeck = async (deckList, deckId) => {
    // Fetch the newly created deck
    const deckRef = doc(db, "decks", deckId);
    const docSnap = await getDoc(deckRef);
    let updatedDeck = { ...docSnap.data() };

    const isCardLegalInCommander = (card) => {
      return card.legalities && card.legalities.commander === "legal";
    };

    for (const cardName of deckList) {
      try {
        const cardResponse = await fetch(
          `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(
            cardName
          )}`
        );
        if (!cardResponse.ok) {
          throw new Error(`Error fetching card: ${cardName}`);
        }
        const cardData = await cardResponse.json();

        if (isCardLegalInCommander(cardData)) {
          // Check if card is legal in Commander
          let category = getCategory(cardData);
          if (!updatedDeck[category]) {
            updatedDeck[category] = [];
          }
          updatedDeck[category].push(cardData);
        }
      } catch (error) {
        console.error("Error fetching card details: ", error);
      }
    }
    // Save the updated deck to Firebase
    await setDoc(doc(db, "decks", deckId), updatedDeck);
  };

  const addCommanderAndCreateDeck = async (selectedCommander) => {
    setLoading(true); // Show loading screen
    try {
      const newDeck = {
        name: `${selectedCommander.name} & friends`,
        Commanders: [selectedCommander],
        // ... other categories
      };

      const docRef = await addDoc(collection(db, "decks"), newDeck);
      setDecks((decks) => [...decks, { ...newDeck, id: docRef.id }]);

      await generateDeckWithGPT4(selectedCommander, docRef.id);
    } catch (error) {
      console.error("Error creating deck with commander: ", error);
      setLoading(false); // Hide loading screen in case of error
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Replace with your loading component or logic
  }

  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Select a commander..."
        value={commanderSearch}
        onChange={(e) => setCommanderSearch(e.target.value)}
      />
      <i className="search-icon">
        <img src={search} alt="search icon" />
      </i>
      {commanderSearchResults.length > 0 && (
        <div className="search-results">
          {commanderSearchResults.map((card, index) => (
            <div key={index} className="search-result-item">
              <div className="search-result-text">{card.name}</div>
              <img
                src={
                  card.image_uris
                    ? card.image_uris.normal
                    : card.card_faces[0].image_uris.normal
                }
                alt={`Card art for ${card.name}`}
                className="commander-image"
              />
              <button
                className="select-button"
                onClick={() => addCommanderAndCreateDeck(card)}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommanderSearch;
