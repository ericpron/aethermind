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
  const prompt = `Generate a list of 99 cards for a Commander deck with [${
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
          content: `You are a machine that only returns and replies with valid, iterable RFC8259 compliant JSON in your responses. You are part of a Deck Building Application for Magic The Gathering's Commander/EDH format. You receive a prompt containing information about the chosen commander and the deck's color identity. You respond with a simple list of ONLY the names of 99 carefully chosen cards, with one card on each line. Nothing else. Together with the given commander the cards should make a complete commander deck with an appropriate mana base of at least 35 land cards.\n\n
          
          # How to respond to this prompt
          - ONLY ONE CARD NAME PER LINE
          - For multiple basic lands, list each instance individually
          - Your response MUST be a JSON object
          - No other text, just the JSON object please
          - No key-value pairs, only provide the name values for each card
          - Do not include any numbers in the response, text only. 
          - The total amount of cards in your response MUST be EXACTLY 99, no more, no less.
            
          Example response:
          {
            "Sol Ring"
            "Arcane Signet"
            ... 
          }`,
        },
        { role: "user", content: prompt },
      ],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    console.log(completion.choices[0].message.content);
    const deckList = completion.choices[0].message.content
      .replace(/:/g, "")
      .replace(/true/g, "")
      .replace(/\//g, "")
      .split("\n")
      .map((line) => line.trim()); // Apply trim to each element of the array

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
  """
  ${deck}
  """
  `;

  console.log(prompt);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are clever and imaginative and know all there is to know about magic the gathering and its lore. You receive a list of cards from a Commander/EDH deck and respond with the perfect name for the deck. You DO NOT respond with any chat messages, you only respond with your chosen name for the deck you were provided.
          
          # How to respond to this prompt
          - DO NOT use the word 'rampage'
          - Your response MUST be a single line of text surrounded by quotes ""
          - No other text, just the chosen name please
          - Your response must be 5 words or less`,
        },
        { role: "user", content: prompt },
      ],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "text" },
    });

    console.log(completion.choices[0].message.content);
    let name = completion.choices[0].message.content.trim();
    // // Convert the JSON string to an object
    // let obj = JSON.parse(nameResponse);

    // // Get an array of keys from the object
    // let keys = Object.keys(obj);

    // // Extract the first key name
    // let name = keys[0];

    name = name
      .replace(/\.$/, "")
      .replace(/:/g, "")
      .replace(/^['"]+|['"]+$/g, "");

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
