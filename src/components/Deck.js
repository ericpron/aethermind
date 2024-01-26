import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import db from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Header from "../components/Header";

function Deck() {
  let { deckId } = useParams();

  const [deck, setDeck] = useState(null);
  const [cardSearch, setCardSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [commander, setCommander] = useState(null);

  // Fetch deck data from Firebase
  useEffect(() => {
    const fetchDeck = async () => {
      const deckRef = doc(db, "decks", deckId);
      const docSnap = await getDoc(deckRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setDeck({ id: docSnap.id, ...data });
        commander ? setCommander(data.Commanders[0]) : setCommander(commander); // Set the commander if it exists
      } else {
        console.log("No such deck!");
      }
    };

    fetchDeck();
  }, [deckId]);

  // Basic search function for Scryfall API
  useEffect(() => {
    if (cardSearch.length > 2) {
      fetch(`https://api.scryfall.com/cards/search?q=${cardSearch}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          if (data && Array.isArray(data.data)) {
            setSearchResults(data.data);
          } else {
            setSearchResults([]); // Set to empty array if response is not in expected format
          }
        })
        .catch((error) => {
          console.error("Error fetching data: ", error);
          setSearchResults([]); // Set to empty array in case of error
        });
    } else {
      setSearchResults([]); // Clear results if search term is too short
    }
  }, [cardSearch]);

  const addCardToDeck = async (card) => {
    let category = getCategory(card);

    const isCardLegalInCommander = (card) => {
      return card.legalities && card.legalities.commander === "legal";
    };

    const isCardAllowed = (card) => {
      return (
        isSingleton(card) &&
        matchesColorIdentity(card) &&
        isCardLegalInCommander(card)
      );
    };

    const isSingleton = (card) => {
      if (card.type_line.includes("Basic Land")) {
        return true;
      }
      return !isCardInDeck(card);
    };

    const matchesColorIdentity = (card) => {
      if (!commander) {
        return true; // Allow all cards if no commander is selected
      }
      return card.color_identity.every((color) =>
        commander.color_identity.includes(color)
      );
    };

    const isCardInDeck = (card) => {
      // Check if the card exists in any category of the deck
      return Object.values(deck).some(
        (category) =>
          Array.isArray(category) && category.some((c) => c.name === card.name)
      );
    };

    if (!isCardAllowed(card)) {
      console.log("Card not allowed due to color identity or singleton rule");
      return;
    }

    let updatedDeck = { ...deck };
    if (!updatedDeck[category]) {
      updatedDeck[category] = [];
    }

    updatedDeck[category].push(card);

    // Update deck in Firebase
    try {
      await setDoc(doc(db, "decks", deckId), updatedDeck);
      setDeck(updatedDeck);
      setSearchResults([]); // Clear the search results after adding the card
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  };

  const removeCardFromDeck = async (card, category) => {
    let updatedDeck = { ...deck };

    // Find the index of the first card that matches
    const indexToRemove = updatedDeck[category].findIndex(
      (c) => c.id === card.id
    );

    if (indexToRemove > -1) {
      // Remove only the first matching card
      updatedDeck[category].splice(indexToRemove, 1);
    }

    // Update deck in Firebase
    try {
      await setDoc(doc(db, "decks", deckId), updatedDeck);
      setDeck(updatedDeck);
      setSearchResults([]); // Clear the search results after adding the card
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  };

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

  const getCardCounts = () => {
    const commanderCounts = commander ? "1" : "0";

    const counts = {
      total: 0,
      Commanders: commanderCounts,
      Planeswalkers: 0,
      Creatures: 0,
      Sorceries: 0,
      Instants: 0,
      Enchantments: 0,
      Artifacts: 0,
      Lands: 0,
      Others: 0,
    };

    if (commander) {
      Object.keys(counts).forEach((category) => {
        if (category !== "total" && deck[category]) {
          counts[category] = deck[category].length;
          counts.total += deck[category].length;
        }
      });
    }

    return counts;
  };

  const addGeneratedCardsToDeck = async (deckList) => {
    let updatedDeck = { ...deck, commander };

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
    setDoc(doc(db, "decks", deckId), updatedDeck)
      .then(() => setDeck(updatedDeck))
      .catch((error) => console.error("Error updating deck: ", error));
  };

  const generateDeckWithGPT4 = async () => {
    if (!commander) {
      alert("Please select a commander first.");
      return;
    }

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
      addGeneratedCardsToDeck(deckList);
    } catch (error) {
      console.error("Error generating deck: ", error);
      alert("Failed to generate deck. Please try again.");
    }
  };

  const copyDecklistToClipboard = () => {
    let decklistString = "";

    // Assuming your deck's structure has categories with arrays of cards
    const categories = [
      "Commanders",
      "Planeswalkers",
      "Creatures",
      "Sorceries",
      "Instants",
      "Enchantments",
      "Artifacts",
      "Lands",
      "Others",
    ];
    categories.forEach((category) => {
      if (deck[category] && deck[category].length > 0) {
        deck[category].forEach((card) => {
          decklistString += `1 ${card.name}\n`; // Format: '1 Card Name'
        });
      }
    });

    // Copy to clipboard
    navigator.clipboard
      .writeText(decklistString)
      .then(() => {
        console.log("Decklist copied to clipboard");
        // Optionally, show a message to the user indicating success
      })
      .catch((err) => {
        console.error("Error in copying text: ", err);
        // Optionally, show an error message to the user
      });
  };

  const cardCounts = getCardCounts();

  const renderDeck = () => {
    const categories = [
      "Commanders",
      "Creatures",
      "Sorceries",
      "Instants",
      "Enchantments",
      "Artifacts",
      "Lands",
      "Others",
    ];
    return categories.map((category) => {
      if (!deck || !deck[category] || deck[category].length === 0) {
        return null;
      }
      return (
        <div key={category}>
          <h3 className="category">{`${category} (${
            cardCounts[category] || 0
          })`}</h3>
          <ul className="section">
            {deck[category].map((card, index) => (
              <li key={index} className="card-item">
                {card.name + " — "}
                <img
                  src={
                    card.image_uris
                      ? card.image_uris.normal
                      : card.card_faces[0].image_uris.normal
                  }
                  alt={`Card art for ${card.name}`}
                  className="card-image"
                />
                <button onClick={() => removeCardFromDeck(card, category)}>
                  x
                </button>
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  if (!deck) {
    return <div>Loading deck...</div>;
  }

  return (
    <div>
      <Header title={deck.name} subTitle="Deck generated by The Aethermind" />

      <button onClick={generateDeckWithGPT4}>Generate Deck with GPT-4</button>

      <input
        type="text"
        value={cardSearch}
        onChange={(e) => setCardSearch(e.target.value)}
        placeholder="Add cards"
      />
      <div>
        {searchResults.map((card, index) => (
          <div key={index}>
            {card.name}
            <button onClick={() => addCardToDeck(card)}>Add to Deck</button>
          </div>
        ))}
      </div>
      <button onClick={copyDecklistToClipboard}>Copy Decklist</button>
      <div className="decklist">{renderDeck()}</div>
    </div>
  );
}

export default Deck;