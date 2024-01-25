import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import db from './firebase'; // Adjust the path if necessary
import { BrowserRouter as Router, Route, Link, Routes, useParams } from 'react-router-dom';
import Deck from './components/Deck'; // Import Deck component
import './App.css';
import  logo from './assets/mana.png';


function App() {
  const [decks, setDecks] = useState([]);
  const [newDeckName, setNewDeckName] = useState('');

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
  }, []);

  const addDeck = async () => {
    try {
      // Create a new deck object without the id
      const newDeck = { 
        name: newDeckName, 
        // Initialize the categories as empty arrays
        Creatures: [], Sorceries: [], Instants: [], Enchantments: [], Artifacts: [], Lands: [], Others: []
      };
  
      // Add the new deck to Firestore
      const docRef = await addDoc(collection(db, "decks"), newDeck);
  
      // Add the new deck to local state with the Firestore-generated id
      setDecks([...decks, { ...newDeck, id: docRef.id }]);
      setNewDeckName('');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="logo" alt="mana symbols" />
          <h1><Link to='/' className="aethermind">The Aethermind</Link></h1>
          <h3>An AI deck builder for the Commander/EDH format</h3>
        </header>
        <Routes>
          <Route path="/" element={
            <>
              <div className="Deck-creation">
                <input 
                  type="text" 
                  value={newDeckName} 
                  onChange={(e) => setNewDeckName(e.target.value)} 
                  placeholder="New Deck Name" 
                />
                <button onClick={addDeck}>Create Deck</button>
              </div>
              <div className="decks">
                <h2 className="category">Created Decks</h2>
                <ul>
                  {decks.map((deck) => (
                    <li key={deck.id} className="card-item">
                      <Link to={`/deck/${deck.id}`}>{deck.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          } />
          <Route path="/deck/:deckId" element={<Deck decks={decks} setDecks={setDecks} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
