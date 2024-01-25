// import OpenAI from "openai";

const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const bodyParser = require('body-parser');

const app = express();
const port = 3001; // Change this if needed

// Enable CORS for requests from your React app
// Replace 'http://localhost:3000' with the actual origin of your React app
app.use(cors({ origin: 'http://localhost:3000' }));

// Ensure you have your OpenAI API key set in your environment variables, or replace process.env.OPENAI_API_KEY with your key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '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',
});

app.use(bodyParser.json());

app.post('/generate-deck', async (req, res) => {
  const commander = req.body.commander;
  const prompt = `Respond with a JSON object containing only the names of 99 Magic: The Gathering cards for a Commander deck with [${commander.name}] as the commander. The cards should match the color identity [${commander.color_identity.join(", ")}], and fit well with the deck's theme and commander synergies.`;

  console.log(prompt);

  try {
    const completion = await openai.chat.completions.create({
        messages: [
            { "role": "system", "content": "You are part of a system for creating decklists for Magic The Gathering's Commander/EDH format. You receive a prompt containing information about the chosen commander and the deck's color identity. You respond with a JSON object containing ONLY the names of 99 unique and carefully chosen cards that together with the given commander make a complete commander deck, including an appropriate mana base with at least 35 land cards. Your response MUST contain ONLY the list of card names, without any other keys or titles or numbers. DO NOT INCLUDE ANY NUMBERS. For multiple basic lands, list each instance individually." },
            { "role": "user", "content": prompt }
        ],
        model: "gpt-4-1106-preview", 
        response_format: { type: "json_object" },
    });

    console.log(completion.choices[0].message.content);
    const deckList = completion.choices[0].message.content.trim().split('\n');
    res.json({ deckList });
    console.log(deckList);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).send('Error generating deck');
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});