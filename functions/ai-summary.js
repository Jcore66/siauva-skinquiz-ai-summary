export async function onRequest(context) {
  const { request } = context;

  // Handle OPTIONS preflight request for CORS
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*", // or restrict to your domain for production
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      },
    });
  }

  // Allow only POST requests for your API
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Set CORS headers for actual requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // or your domain
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const reqJson = await request.json();
    // Your AI prompt logic here, e.g., call OpenAI API using your secret

    // Example dummy response:
    const responseJson = { summary: "This is a sample AI summary response." };

    return new Response(JSON.stringify(responseJson), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
}
