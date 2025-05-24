export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Replace * with domain for prod
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { answers } = req.body || {};
  if (!answers) {
    res.status(400).json({ error: "Missing answers" });
    return;
  }

  const prompt = `
You are a luxury skincare advisor named "Siauva AI". Write a short, empathetic summary for a customer based on their answers below. Reference their skin type, concerns, texture preference, routine time, and goals. Be positive, supportive, and professional—like a real high-end consultant.

Answers:
Skin type: ${answers.skin_type?.join(", ") || "N/A"}
Concerns: ${answers.concern?.join(", ") || "N/A"}
Routine steps: ${answers.routine_step?.join(", ") || "N/A"}
Preferred ingredients: ${answers.ingredient?.join(", ") || "N/A"}
Texture: ${answers.texture?.join(", ") || "N/A"}
Routine time: ${answers.routine_time?.join(", ") || "N/A"}
Features: ${answers.features?.join(", ") || "N/A"}

Summary:
`;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    res.status(500).json({ error: "Missing OpenAI API key" });
    return;
  }

  try {
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 120,
        temperature: 0.8,
      }),
    });

    const data = await apiRes.json();

    if (!data.choices || data.choices.length === 0) {
      res.status(500).json({ error: "No response from OpenAI", details: data });
      return;
    }

    const summary = data.choices[0].message.content.trim();
    res.status(200).json({ summary });
  } catch (err) {
    res.status(500).json({ error: "OpenAI request failed", details: err.message });
  }
}
