// Symptom analysis using the existing Supabase chat function
export interface SymptomAnalysis {
  conditions: string[];
  severity: "low" | "medium" | "high";
  recommendations: string[];
  seekDoctor: boolean;
  reasoning: string;
}

export async function analyzeSymptoms(symptoms: string): Promise<SymptomAnalysis> {
  try {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
    
    const analysisPrompt = `Analyze these symptoms and provide a medical assessment: ${symptoms}

Please respond in the following JSON format only, without any additional text:
{
  "conditions": ["list of 2-4 possible conditions"],
  "severity": "low|medium|high",
  "recommendations": ["list of 4-6 self-care recommendations"],
  "seekDoctor": true/false,
  "reasoning": "brief explanation of the assessment"
}

Guidelines:
- Severity "high" for serious symptoms requiring immediate attention
- Severity "medium" for symptoms that should be monitored closely
- Severity "low" for minor, self-treatable conditions
- Set seekDoctor to true for concerning symptoms
- Provide practical, actionable recommendations`;

    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: analysisPrompt }],
        module: "predictguard"
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze symptoms");
    }

    // Parse streaming response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let fullResponse = "";
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      
      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const jsonStr = line.slice(6).trim();
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
              }
            } catch {
              // Skip parsing errors
            }
          }
        }
      }
    }

    // Extract JSON from response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }

    const analysis = JSON.parse(jsonMatch[0]);
    
    // Validate response structure
    if (!analysis.conditions || !analysis.severity || !analysis.recommendations) {
      throw new Error("Incomplete analysis");
    }

    return {
      conditions: analysis.conditions,
      severity: analysis.severity,
      recommendations: analysis.recommendations,
      seekDoctor: analysis.seekDoctor || false,
      reasoning: analysis.reasoning || ""
    };
  } catch (error) {
    console.error("Symptom analysis error:", error);
    throw new Error("Unable to analyze symptoms. Please try again or consult a healthcare professional.");
  }
}
