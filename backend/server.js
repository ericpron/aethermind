// import OpenAI from "openai";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const bodyParser = require("body-parser");

const app = express();
const port = 3001; // Change this if needed

// Enable CORS for requests from your React app
// Replace 'http://localhost:3000' with the actual origin of your React app
app.use(cors({ origin: "http://localhost:3000" }));

// Ensure you have your OpenAI API key set in your environment variables, or replace process.env.OPENAI_API_KEY with your key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(bodyParser.json());

app.post("/generate-deck", async (req, res) => {
  const commander = req.body.commander;
  const prompt = `Respond with a JSON object containing only a list of 99 Magic: The Gathering cards for a Commander deck with [${
    commander.name
  }] as the commander. The chosen cards must match the color identity [${commander.color_identity.join(
    ", "
  )}], and fit well with the commander's theme and overall strategy. Please consider potential wincons and choose cards that synergize well with each other and the commander.`;

  console.log(prompt);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a machine that only returns and replies with valid, iterable RFC8259 compliant JSON in your responses. You are part of a Deck Building Application for Magic The Gathering's Commander/EDH format. You receive a prompt containing information about the chosen commander and the deck's color identity. You respond with a JSON object containing ONLY the names of 99 unique and carefully chosen cards that together with the given commander make a complete commander deck, including an appropriate mana base with at least 35 land cards. You MUST ONLY return 99 card names, nothing else. Your response MUST contain ONLY the list of card names, without any other keys, values, titles or numbers.\n\nONLY ONE CARD NAME PER LINE.\n\nFor multiple basic lands, list each instance individually.\n\nForbidden characters in response: [:,/'0-9] 
          
          # How to respond to this prompt
          - Your response MUST be a JSON object
          - No other text, just the JSON object please
          - No value pairs, only a single list of strings please
          - Maximum amount of cards in response is 99.
            
          Example response:
          {
            "Sol Ring",
            "Arcane Signet",
            "Korvold, Fae Cursed King",  
            ... 
          }`,
        },
        { role: "user", content: prompt },
      ],
      model: "gpt-4-0125-preview",
      response_format: { type: "json_object" },
    });

    console.log(completion.choices[0].message.content);
    const deckList = completion.choices[0].message.content
      .trim()
      .replace(/:/g, "")
      .replace("true", "")
      .split("\n");

    res.json({ deckList });
    console.log(deckList);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).send("Error generating deck");
  }
});

app.post("/rename-deck", async (req, res) => {
  const commander = req.body.commander;
  const deck = req.body.deck;
  const prompt = `Think of a clever name for the following commander deck with [${commander.name}] as the commander:\n
  ${deck}`;

  console.log(prompt);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a machine that only returns and replies with valid, iterable RFC8259 compliant JSON in your responses. You are clever and imaginative and know all there is to know about magic the gathering and its lore. You receive lists of cards from Commander/EDH decks and respond with the perfect name for the deck. You do not respond with any chat type messages, you only respond with your chosen name for the deck you were provided.
          
          # How to respond to this prompt
          - Your response MUST be a JSON object
          - No other text, just the JSON object please
          - No value pairs, only a single string of text please
          - The deck name must be 5 words or less in total`,
        },
        { role: "user", content: prompt },
      ],
      model: "gpt-4-0125-preview",
      response_format: { type: "json_object" },
    });

    console.log(completion.choices[0].message.content);
    const nameResponse = completion.choices[0].message.content.trim();
    // Convert the JSON string to an object
    let obj = JSON.parse(nameResponse);

    // Get an array of keys from the object
    let keys = Object.keys(obj);

    // Extract the first key name
    let name = keys[0];

    name = name.replace(/\.$/, "");

    res.json({ name });
    console.log(name);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).send("Error renaming deck");
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
