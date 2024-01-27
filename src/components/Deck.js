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
        setCommander(data.Commanders[0]); // Set the commander if it exists
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

    const isCardAllowed = (card) => {
      return (
        isSingleton(card) &&
        matchesColorIdentity(card) &&
        isCardLegalInCommander(card)
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

  const parseManaCost = (manaCostString) => {
    // Check if manaCostString is defined
    if (typeof manaCostString !== "string") {
      console.error("manaCostString is not a string:", manaCostString);
      return null; // Return null or an appropriate fallback
    }

    console.log(manaCostString);
    // Define a mapping from symbol to JSX element
    const manaSymbolToElement = {
      "{W}": <i className="ms ms-cost ms-w"></i>,
      "{U}": <i className="ms ms-cost ms-u"></i>,
      "{B}": <i className="ms ms-cost ms-b"></i>,
      "{R}": <i className="ms ms-cost ms-r"></i>,
      "{G}": <i className="ms ms-cost ms-g"></i>,
      "{C}": <i className="ms ms-cost ms-c"></i>,
      "{P}": <i className="ms ms-cost ms-p"></i>, // Phyrexian mana
      "{S}": <i className="ms ms-cost ms-s"></i>, // Snow mana
      "{X}": <i className="ms ms-cost ms-x"></i>,
      "{0}": <i className="ms ms-cost ms-0"></i>,
      "{1}": <i className="ms ms-cost ms-1"></i>,
      "{2}": <i className="ms ms-cost ms-2"></i>,
      "{3}": <i className="ms ms-cost ms-3"></i>,
      "{4}": <i className="ms ms-cost ms-4"></i>,
      "{5}": <i className="ms ms-cost ms-5"></i>,
      "{6}": <i className="ms ms-cost ms-6"></i>,
      "{7}": <i className="ms ms-cost ms-7"></i>,
      "{8}": <i className="ms ms-cost ms-8"></i>,
      "{9}": <i className="ms ms-cost ms-9"></i>,
      "{10}": <i className="ms ms-cost ms-10"></i>,
      "{11}": <i className="ms ms-cost ms-11"></i>,
      "{12}": <i className="ms ms-cost ms-12"></i>,
      "{13}": <i className="ms ms-cost ms-13"></i>,
      "{2/W}": <i className="ms ms-cost ms-2w"></i>, // Hybrid mana
      "{2/U}": <i className="ms ms-cost ms-2u"></i>,
      "{2/B}": <i className="ms ms-cost ms-2b"></i>,
      "{2/R}": <i className="ms ms-cost ms-2r"></i>,
      "{2/G}": <i className="ms ms-cost ms-2g"></i>,
      "{W/U}": <i className="ms ms-cost ms-wu"></i>, // Two-color hybrid mana
      "{W/B}": <i className="ms ms-cost ms-wb"></i>,
      "{U/B}": <i className="ms ms-cost ms-ub"></i>,
      "{U/R}": <i className="ms ms-cost ms-ur"></i>,
      "{B/R}": <i className="ms ms-cost ms-br"></i>,
      "{B/G}": <i className="ms ms-cost ms-bg"></i>,
      "{R/G}": <i className="ms ms-cost ms-rg"></i>,
      "{R/W}": <i className="ms ms-cost ms-rw"></i>,
      "{G/W}": <i className="ms ms-cost ms-gw"></i>,
      "{G/U}": <i className="ms ms-cost ms-gu"></i>,
      // ... add more if there are other combinations
    };

    // Split the string into individual mana symbols
    const manaSymbols = manaCostString.match(/{.+?}/g) || [];

    // Map each symbol to its JSX element
    return manaSymbols.map(
      (symbol, index) => manaSymbolToElement[symbol] || symbol
    );
  };

  const cardCounts = getCardCounts();

  const renderDeck = () => {
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
                {card.name}
                <img
                  src={
                    card.image_uris
                      ? card.image_uris.normal
                      : card.card_faces[0].image_uris.normal
                  }
                  alt={`Card art for ${card.name}`}
                  className="card-image"
                />
                <button
                  className="delete-button"
                  onClick={() => removeCardFromDeck(card, category)}
                ></button>
                <div className="card-mana-cost">
                  {parseManaCost(card.mana_cost)}
                </div>
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
      <Header
        title={deck.name}
        subTitle={`${cardCounts.total} card deck generated by The Aethermind`}
        colorIdentity={commander.color_identity}
      />

      <button onClick={generateDeckWithGPT4}>Generate deck with GPT-4</button>

      {/* <input
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
      </div> */}
      <button onClick={copyDecklistToClipboard}>Copy decklist</button>
      <div className="decklist">{renderDeck()}</div>
    </div>
  );
}

export default Deck;
