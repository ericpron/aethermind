// api/rename-deck.js

const { OpenAI } = require("openai");

module.exports = async (req, res) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { commander, deck } = req.body;
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
          content: `You are clever and imaginative and know all there is to know about Magic the Gathering and its lore. You receive a list of cards from a Commander/EDH deck and respond with the perfect name for the deck. You DO NOT respond with any chat messages, you only respond with your chosen name for the deck you were provided.
          
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
};
