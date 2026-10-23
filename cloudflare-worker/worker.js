/**
 * Sapa AI - Cloudflare Worker Proxy
 * Berfungsi sebagai perantara aman untuk Groq (OpenAI gpt-oss-120b) & Google Gemini.
 * Disimpan di Cloudflare agar API Key tidak terekspos di HP pengguna.
 */
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // 1. Tangani CORS Preflight (OPTIONS request dari mobile/browser)
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
      const groqKey = env.GROQ_API_KEY;
      const geminiKey = env.GEMINI_API_KEY;

      const body = await request.json();
      const prompt = body.prompt;

      if (!prompt) {
        return new Response(JSON.stringify({ error: "Parameter 'prompt' wajib dikirim." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // =====================================================================
      // 1. PRIORITAS UTAMA: Groq LPU (OpenAI gpt-oss-120b / 120 Miliar Parameter)
      // Kecepatan kilat (~1 detik), kuota ribuan request/hari, super cerdas.
      // =====================================================================
      if (groqKey) {
        try {
          const groqModel = body.model && (body.model.startsWith("openai/") || body.model.startsWith("qwen/"))
            ? body.model
            : "openai/gpt-oss-120b";

          const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: groqModel,
              messages: [
                {
                  role: "system",
                  content: "Anda adalah asisten cerdas WhatsApp Sapaan Silaturahmi. Kembalikan HANYA format JSON ARRAY murni tanpa backtick markdown.",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: body.temperature ?? 0.85,
            }),
          });

          if (groqResp.ok) {
            const data = await groqResp.json();
            if (data?.choices?.[0]?.message?.content) {
              return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        } catch (_groqErr) {
          // Otomatis lanjut ke fallback Gemini di bawah jika Groq bermasalah
        }
      }

      // =====================================================================
      // 2. CADANGAN OTOMATIS: Google Gemini (jika Groq sedang sibuk)
      // =====================================================================
      if (geminiKey) {
        const geminiModels = [
          "gemini-2.5-flash-lite",
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-3.5-flash-lite",
          "gemini-3.6-flash",
        ];
        const geminiPayload = {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: body.temperature ?? 0.85 },
        };

        for (const m of geminiModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`;
            const geminiResp = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(geminiPayload),
            });
            if (geminiResp.ok) {
              const data = await geminiResp.json();
              if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return new Response(JSON.stringify(data), {
                  status: 200,
                  headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
            }
          } catch (_e) {}
        }
      }

      return new Response(
        JSON.stringify({ error: "Layanan AI sedang sibuk. Silakan coba kembali sesaat lagi." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
