// /api/generate-deck.js
const { OpenAI } = require("openai");

module.exports = async (req, res) => {
  // Ensure only POST requests are handled
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  // Load environment variables
  require("dotenv").config();
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Extract the commander from the request body
  const commander = req.body.commander;
  if (!commander) {
    res.status(400).send("Commander is required");
    return;
  }

  // Construct the prompt for the OpenAI API
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
          content: `You are a helpful assistant that ONLY responds with valid, iterable RFC8259 compliant JSON. You are part of a Deck Building Application for Magic The Gathering's Commander/EDH format. You receive a prompt containing information about the chosen commander and the deck's color identity. You respond with a simple list of ONLY the names of 99 carefully chosen cards, with one card on each line. Nothing else.
          
          # How to respond to this prompt
          - ONLY ONE CARD NAME PER LINE.
          - For multiple basic lands, list each instance individually.
          - The chosen cards must be the correct color identity for the deck.
          - Include at least 35 land cards.
          - Your response MUST be a JSON object.
          - No other text, just the JSON object please.
          - No key-value pairs, only provide the name values for each card.
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
      model: "gpt-4o",
      response_format: { type: "json" },
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
};
