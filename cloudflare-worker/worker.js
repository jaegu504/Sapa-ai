/**
 * Sapa AI - Cloudflare Worker Proxy
 * Berfungsi sebagai perantara aman agar API Key Gemini tersimpan di Cloudflare,
 * bukan di dalam APK HP pengguna.
 */
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // 1. Tangani CORS Preflight (OPTIONS request dari browser/mobile)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Gunakan method POST." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const apiKey = env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "GEMINI_API_KEY belum dipasang di Settings > Variables Cloudflare." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await request.json();
      const prompt = body.prompt;
      const requestedModel = body.model || "gemini-3.5-flash-lite";

      if (!prompt) {
        return new Response(JSON.stringify({ error: "Parameter 'prompt' wajib dikirim." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Teruskan permintaan ke Google Gemini API dengan auto-fallback & retry
      const modelsToTry = [
        requestedModel,
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
      ].filter((m, i, arr) => arr.indexOf(m) === i); // unique

      const geminiPayload = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: body.temperature ?? 0.85,
        },
      };

      let lastResponse = null;
      let lastData = null;

      for (const model of modelsToTry) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        // Coba panggil model
        let geminiResponse = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
        });

        // Jika terjadi lonjakan beban sesaat (503), tunggu 800ms dan coba ulang sekali
        if (geminiResponse.status === 503) {
          await new Promise((res) => setTimeout(res, 800));
          geminiResponse = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiPayload),
          });
        }

        const data = await geminiResponse.json();
        lastResponse = geminiResponse;
        lastData = data;

        // Jika berhasil (200 OK), langsung kembalikan ke klien
        if (geminiResponse.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Jika seluruh model gagal, kembalikan response terakhir
      return new Response(JSON.stringify(lastData), {
        status: lastResponse ? lastResponse.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
