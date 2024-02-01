import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import db from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Header from "../components/Header";
import {
  generateDeckWithGPT4,
  renameDeckWithGPT4,
  removeAllCardsFromDeck,
  parseManaCost,
} from "../deckUtils";

function Deck() {
  let { deckId } = useParams();

  const [deck, setDeck] = useState(null);
  const [deckListString, setDeckListString] = useState("");
  const [commander, setCommander] = useState(null);
  const [loading, setLoading] = useState(false); // State to handle loading screen
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set());
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
        await getDeckListAsString(data);
      } else {
        console.log("No such deck!");
      }
    };

    const getDeckListAsString = async (deckData) => {
      let cardlistdata = "";
      // Assuming your deck's structure has categories with arrays of cards
      const categories = [
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
        if (deckData[category] && deckData[category].length > 0) {
          deckData[category].forEach((card) => {
            cardlistdata += `1 ${card.name}\n`; // Format: '1 Card Name'
          });
        }
      });
      setDeckListString(cardlistdata); // Store the data in state.
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
    // Copy to clipboard
    navigator.clipboard
      .writeText(deckListString)
      .then(() => {
        console.log("Decklist copied to clipboard");
        // Optionally, show a message to the user indicating success
      })
      .catch((err) => {
        console.error("Error in copying text: ", err);
        // Optionally, show an error message to the user
      });
  };

  const reGenerate = () => {
    setLoading(true);
    let shouldRename = false;
    removeAllCardsFromDeck(deck, deckId)
      .then(() => {
        // At this point, all cards except the commander have been removed
        return generateDeckWithGPT4(
          commander,
          deckId,
          setLoading,
          navigate,
          shouldRename
        );
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

  const renameDeck = () => {
    setLoading(true);
    renameDeckWithGPT4(commander, deckId, deckListString, navigate)
      .then(() => {
        // Deck regeneration is complete
        console.log("Deck renaming complete");
        setLoading(false);
        setRefreshFlag((prev) => !prev); // Toggle the flag to trigger refetch
      })
      .catch((error) => {
        console.error("Error during deck renaming process: ", error);
      });
  };

  // ------------------------- //
  //     renderDeck logic      //
  // ------------------------- //

  const cardCounts = getCardCounts();

  const handleCardClick = (index, category) => {
    const cardId = `${category}-${index}`; // Create a unique identifier for each card

    setFlippedCards((prevFlippedCards) => {
      const newFlippedCards = new Set(prevFlippedCards);
      if (newFlippedCards.has(cardId)) {
        newFlippedCards.delete(cardId); // Unflip if already flipped
      } else {
        newFlippedCards.add(cardId); // Flip if not flipped
      }
      return newFlippedCards;
    });
  };

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
          })`}</h3>{" "}
          <ul className="section">
            {deck[category].map((card, index) => {
              const cardId = `${category}-${index}`;
              const isFlipped = flippedCards.has(cardId);
              const isMDFC = card.card_faces && card.card_faces.length > 1;
              const cardImage = isMDFC
                ? isFlipped
                  ? card.card_faces[1].image_uris.normal
                  : card.card_faces[0].image_uris.normal
                : card.image_uris.normal;

              return (
                <li key={index} className="card-item">
                  {card.name}
                  <Link to={card.scryfall_uri} target="_blank">
                    <img
                      src={cardImage}
                      alt={`Card art for ${card.name}`}
                      className="card-image"
                      onClick={() => handleCardClick(index, category)}
                    />
                  </Link>
                  <div className="card-mana-cost">
                    {parseManaCost(
                      card.card_faces
                        ? card.card_faces[0].mana_cost
                        : card.mana_cost
                    )}
                    {/* <button
                    className="delete-button"
                    onClick={() => removeCardFromDeck(card, category)}
                  ></button> */}
                  </div>
                </li>
              );
            })}
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
          <button className="name-button" onClick={renameDeck}>
            Rename
          </button>

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
