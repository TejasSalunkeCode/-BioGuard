import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, module } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Create system prompts based on module
    const systemPrompts: Record<string, string> = {
      medguard: "You are MedGuard, a helpful medical information assistant. Help users with medicine information, interactions, dosage, side effects, and suggest alternatives. Always remind users to consult healthcare professionals for medical decisions.",
      predictguard: "You are PredictGuard, an AI symptom checker. Help users understand their symptoms and provide possible conditions. Always emphasize consulting a doctor for proper diagnosis. Be careful not to cause alarm.",
      mindguard: "You are MindGuard, a mental health companion. Provide supportive guidance for mental wellness, stress management, and emotional health. Always encourage professional help when needed.",
      fitguard: "You are FitGuard, a fitness and wellness coach. Help users with BMI calculations, personalized diet plans, and workout routines. Provide practical and safe fitness advice.",
      rescueguard: "You are RescueGuard, an emergency assistance guide. Help users find emergency services, hospitals, and provide first-aid guidance. Always prioritize calling emergency services for serious situations.",
      fundguard: "You are FundGuard, a healthcare financial advisor. Help users understand insurance options, financial support for medical expenses, and emergency loan information.",
    };

    const systemPrompt = systemPrompts[module] || "You are BioGuard.AI, a helpful health companion. Provide accurate, caring health information while always encouraging users to consult healthcare professionals for medical decisions.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
