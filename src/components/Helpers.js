// helper functions

const [cardSearch, setCardSearch] = useState("");
const [searchResults, setSearchResults] = useState([]);

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
