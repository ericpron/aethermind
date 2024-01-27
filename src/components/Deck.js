import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import db from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Header from "../components/Header";
import {
  generateDeckWithGPT4,
  addGeneratedCardsToDeck,
  removeAllCardsFromDeck,
} from "../deckUtils";

function Deck() {
  let { deckId } = useParams();

  const [deck, setDeck] = useState(null);
  const [commander, setCommander] = useState(null);
  const [loading, setLoading] = useState(false); // State to handle loading screen
  const [refreshFlag, setRefreshFlag] = useState(false);
  const navigate = useNavigate();

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
  }, [deckId, refreshFlag]);

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
    } catch (error) {
      console.error("Error writing document: ", error);
    }
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
      "{G/P}": <i className="ms ms-cost ms-gp"></i>,
      "{W/P}": <i className="ms ms-cost ms-wp"></i>,
      "{R/P}": <i className="ms ms-cost ms-rp"></i>,
      "{U/P}": <i className="ms ms-cost ms-up"></i>,
      "{B/P}": <i className="ms ms-cost ms-bp"></i>,
      // ... add more if there are other combinations
    };

    // Split the string into individual mana symbols
    const manaSymbols = manaCostString.match(/{.+?}/g) || [];

    // Map each symbol to its JSX element
    return manaSymbols.map(
      (symbol, index) => manaSymbolToElement[symbol] || symbol
    );
  };

  const reGenerate = () => {
    setLoading(true);
    removeAllCardsFromDeck(deck, deckId)
      .then(() => {
        // At this point, all cards except the commander have been removed
        return generateDeckWithGPT4(commander, deckId, setLoading, navigate);
      })
      .then(() => {
        // Deck regeneration is complete
        console.log("Deck regeneration complete");
        setLoading(false);
        setRefreshFlag((prev) => !prev); // Toggle the flag to trigger refetch
      })
      .catch((error) => {
        console.error("Error during deck regeneration: ", error);
      });
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
                <div className="card-mana-cost">
                  {parseManaCost(card.mana_cost)}
                  {/* <button
                    className="delete-button"
                    onClick={() => removeCardFromDeck(card, category)}
                  ></button> */}
                </div>
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  if (!deck) {
    return (
      <div>
        {" "}
        <Header
          title="Loading..."
          subTitle="Just a moment, fetching deck contents"
          colorIdentity="W, U, B, R, G"
          isloading={loading}
        />
      </div>
    );
  }

  return (
    <div>
      <Header
        title={deck.name}
        subTitle={`${cardCounts.total}-card deck generated by The Aethermind`}
        colorIdentity={commander.color_identity}
        isLoading={loading}
      />
      {/* <button onClick={generateDeckWithGPT4}>Generate deck with GPT-4</button> */}

      {loading ? (
        <div></div>
      ) : (
        <div className="deck-actions">
          {/* <button className="name-button" onClick={copyDecklistToClipboard}>
            Generate name
          </button> */}

          <button className="retry-button" onClick={reGenerate}>
            Regenerate
          </button>

          <button className="copy-button" onClick={copyDecklistToClipboard}>
            Copy decklist
          </button>
        </div>
      )}
      {loading ? <div></div> : <div className="decklist">{renderDeck()}</div>}
    </div>
  );
}

export default Deck;
