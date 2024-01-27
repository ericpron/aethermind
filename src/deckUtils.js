// deckUtils.js

import { doc, setDoc, getDoc } from "firebase/firestore";
import db from "./firebase"; // Update the path as necessary

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

export const removeAllCardsFromDeck = (deck, deckId) => {
  return new Promise(async (resolve, reject) => {
    // Preserve the commander
    const commander = deck.Commanders;

    // Create a new deck object with empty categories (except for the commander)
    let updatedDeck = {
      ...deck,
      Commanders: commander,
      Planeswalkers: [],
      Creatures: [],
      Sorceries: [],
      Instants: [],
      Enchantments: [],
      Artifacts: [],
      Lands: [],
      Others: [],
    };

    // Update deck in Firebase
    try {
      await setDoc(doc(db, "decks", deckId), updatedDeck);
      resolve(updatedDeck); // Resolve with the updated deck
    } catch (error) {
      console.error("Error updating deck: ", error);
      reject(error);
    }
  });
};

export const generateDeckWithGPT4 = async (
  commander,
  deckId,
  setLoading,
  navigate
) => {
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
    const first99Cards = deckList.slice(0, 100);

    await addGeneratedCardsToDeck(first99Cards, deckId);
    navigate(`/deck/${deckId}`);
  } catch (error) {
    console.error("Error generating deck: ", error);
    alert("Failed to generate deck. Please try again.");
  } finally {
    setLoading(false); // Hide loading screen
  }
};

export const addGeneratedCardsToDeck = async (deckList, deckId) => {
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
