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
  )}], and fit well with the commander's theme and overall strategy. Please consider potential win conditions and choose cards that synergize well with each other and the commander. Ensure the deck has a coherent game plan and that the chosen cards work together to achieve this plan. The deck must contain exactly 99 cards, including at least 35 land cards.`;

  console.log(prompt);

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Magic: The Gathering deck-building assistant. Your task is to generate a list of 99 cards for a Commander/EDH deck. The deck must be valid according to the rules of Commander format and should synergize with the given commander and its color identity.
          
          # Response Guidelines
          - Provide a JSON object with exactly 99 card names.
          - Each card name should be a string value in the JSON object.
          - Include at least 35 land cards.
          - Ensure all cards match the commander's color identity.
          - List each card name on a new line.
          - Ensure the deck has a coherent game plan and that the chosen cards work together to achieve this plan.
          - Do not include any additional text or numbers, only the card names.
            
          Example response:
          {
            "Sol Ring",
            "Arcane Signet",
            ...
          }`,
        },
        { role: "user", content: prompt },
      ],
      model: "gpt-4o",
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
};
