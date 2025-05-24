export async function onRequest(context) {
  const { request, env } = context;

  // Handle OPTIONS preflight request for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*", // Change "*" to your domain in production
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Allow only POST requests for your API
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { answers } = body;
  if (!answers) {
    return new Response(
      JSON.stringify({ error: "Missing answers" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Construct prompt for OpenAI
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

  // CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Change to your domain in production
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  // Use your OpenAI API key from environment variables
  const openaiKey = env.OPENAI_API_KEY || "YOUR_OPENAI_API_KEY";
  if (!openaiKey || openaiKey === "YOUR_OPENAI_API_KEY") {
    return new Response(
      JSON.stringify({ error: "Missing OpenAI API key" }),
      { status: 500, headers: corsHeaders }
    );
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
      return new Response(
        JSON.stringify({ error: "No response from OpenAI", details: data }),
        { status: 500, headers: corsHeaders }
      );
    }

    const summary = data.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "OpenAI API request failed", details: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}
