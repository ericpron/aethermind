// deckUtils.js

import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
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

const renameDeck = async (deckId, newName) => {
  const deckRef = doc(db, "decks", deckId);

  try {
    await updateDoc(deckRef, {
      name: newName,
    });
    console.log(`Deck ${deckId} renamed to ${newName}`);
  } catch (error) {
    console.error("Error updating deck name: ", error);
  }
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

export const renameDeckWithGPT4 = async (commander, deckId, deck, navigate) => {
  console.log(deck);
  try {
    const response = await fetch("/api/rename-deck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commander, deck }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const { name } = await response.json();
    await renameDeck(deckId, name);
    navigate(`/deck/${deckId}`);
  } catch (error) {
    console.error("Error renaming deck: ", error);
    alert("Failed to rename deck. Please try again.");
  } finally {
  }
};

export const generateDeckWithGPT4 = async (
  commander,
  deckId,
  setLoading,
  navigate,
  shouldRename
) => {
  setLoading(true); // Show loading screen
  const abortController = new AbortController(); // Create an instance of AbortController
  const signal = abortController.signal; // Get the signal from the controller

  // Set a timeout to cancel the request after 60 seconds
  const timeoutId = setTimeout(() => {
    abortController.abort(); // Cancel the request
    setLoading(false); // Hide loading screen
    alert("Request timed out. Please try again."); // Notify the user
    navigate(`/deck/${deckId}`);
  }, 120000);

  try {
    const response = await fetch("/api/generate-deck", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commander }),
    });

    clearTimeout(timeoutId); // Clear the timeout if the response is successful

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const { deckList } = await response.json();

    // Take only the first 99 cards from the deckList
    const first99Cards = deckList.slice(0, 100);

    await addGeneratedCardsToDeck(first99Cards, deckId);
    if (shouldRename) {
      await renameDeckWithGPT4(commander, deckId, first99Cards, navigate);
    }
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

export const parseManaCost = (manaCostString) => {
  // Check if manaCostString is defined
  if (typeof manaCostString !== "string") {
    console.error("manaCostString is not a string:", manaCostString);
    return null; // Return null or an appropriate fallback
  }

  const standardizeManaSymbol = (input) => {
    // Split the string by commas
    const symbols = input.split(",");

    // Map each symbol to add braces and then join them back together with commas
    return symbols.map((input) => `{${input.trim()}}`).join(", ");
  };

  let standardizedSymbol = standardizeManaSymbol(manaCostString);

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
  const manaSymbols = standardizedSymbol.match(/{.+?}/g) || [];

  // Map each symbol to its JSX element
  return manaSymbols.map(
    (symbol, index) => manaSymbolToElement[symbol] || symbol
  );
};
