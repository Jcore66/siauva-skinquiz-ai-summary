export async function onRequest(context) {
  // Only allow POST
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const { answers } = body;
  if (!answers) {
    return new Response(JSON.stringify({ error: "Missing answers" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const prompt = `
You are a luxury skincare advisor named "Siauva AI". Write a short, empathetic summary for a customer based on their answers below. Reference their skin type, concerns, texture preference, routine time, and goals. Be positive, supportive, and professional—like a real high-end consultant.

Answers:
Skin type: ${answers.skin_type?.join(", ")}
Concerns: ${answers.concern?.join(", ")}
Routine steps: ${answers.routine_step?.join(", ")}
Preferred ingredients: ${answers.ingredient?.join(", ")}
Texture: ${answers.texture?.join(", ")}
Routine time: ${answers.routine_time?.join(", ")}
Features: ${answers.features?.join(", ")}

Summary:
`;

  // (Best Practice) Use Cloudflare environment variable, fallback to placeholder
  const openaiKey = context.env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";

  if (!openaiKey || openaiKey === "YOUR_OPENAI_API_KEY") {
    return new Response(JSON.stringify({ error: "Missing OpenAI key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

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
    return new Response(JSON.stringify({ error: "No response from OpenAI", details: data }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  const summary = data.choices[0].message.content.trim();
  return new Response(JSON.stringify({ summary }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
