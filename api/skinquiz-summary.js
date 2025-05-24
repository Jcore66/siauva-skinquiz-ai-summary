export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const { answers } = req.body;
  if (!answers) {
    res.status(400).json({ error: "Missing answers" });
    return;
  }

  const prompt = `
You are a luxury skincare advisor named "Siauva AI". Write a short, empathetic summary for a customer based on their answers below. Reference their skin type, concerns, texture preference, routine time, and goals. Be positive, supportive, and professional—like a real high-end consultant. Example: "Your main concerns are redness and dark spots, and you prefer gel textures for your morning routine. Products that soothe and brighten, with lightweight hydration, will be perfect for your skin."

Answers (raw, comma-separated):
Skin type: ${answers.q1.join(", ")}
Concerns: ${answers.q2.join(", ")}
Routine time: ${answers.q3.join(", ")}
Texture: ${answers.q4.join(", ")}
Goals: ${answers.q5.join(", ")}

Summary:
`;

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    res.status(500).json({ error: "Missing OpenAI key" });
    return;
  }

  // Call OpenAI
  const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.8,
    })
  });
  const data = await apiRes.json();
  if (!data.choices) {
    res.status(500).json({ error: "No response from OpenAI", details: data });
    return;
  }
  const summary = data.choices[0].message.content.trim();
  res.status(200).json({ summary });
}
