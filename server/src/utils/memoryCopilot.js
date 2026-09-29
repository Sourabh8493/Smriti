/**
 * Caregiver AI Memory Copilot & Clinical Reminiscence Assister
 *
 * Helps caregivers fill out detailed, sensory-grounded autobiographical memories
 * for dementia patients by:
 * 1. Generating observational guiding prompts / questions (e.g., "Looks like a traditional wedding in Assam. Would you like to add who is sitting next to the bride?").
 * 2. Synthesizing a comprehensive, beautifully written Recommended Detailed Description for Cognitive Stimulation Therapy (CST).
 *
 * Runs 100% free locally with a rich clinical rule-based engine, and supports
 * Google Gemini free tier if GEMINI_API_KEY is configured in .env.
 */

function generateDeterministicCopilot({
  title = "",
  tag = "Wedding",
  date = "",
  description = "",
  hasPhoto = false,
  patientContext = {},
}) {
  const patientName = patientContext.fullName || "the patient";
  const state = patientContext.state || "the North East";
  const city = patientContext.city || "";
  const locationStr = [city, state].filter(Boolean).join(", ") || "home";

  const lowerTitle = (title || "").toLowerCase();
  const lowerDesc = (description || "").toLowerCase();
  const dateStr = date ? `in ${date}` : "during this memorable time";

  const guidingPrompts = [];
  let recommendedDescription = "";

  // 1. Generate category-specific and photo-sensitive guiding prompts
  if (tag === "Wedding" || lowerTitle.includes("wedding") || lowerTitle.includes("marriage")) {
    if (hasPhoto) {
      guidingPrompts.push(
        `Looks like a traditional wedding celebration in ${state}. Would you like to add who is sitting or standing next to the bride/groom in this photo?`
      );
    } else {
      guidingPrompts.push(
        `Who were the closest family members or friends gathered with ${patientName} on their wedding day?`
      );
    }
    guidingPrompts.push(
      `Do you recall any traditional music, Biya Naam wedding songs, or special rituals that brought joy and laughter?`
    );
    guidingPrompts.push(
      `What traditional attire (such as Muga Mekhela Sador or ceremonial dress) was worn, and what was the mood of the elders?`
    );

    recommendedDescription =
      `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}, ${patientName} celebrated their wedding day in ${locationStr} amidst beloved family and lifelong friends. ` +
      `The home was filled with traditional blessings, joyful laughter, and the resonant melodies of celebration as elders offered their heartfelt best wishes. ` +
      `${description ? `Caregiver notes recall: "${description.trim()}". ` : ""}` +
      `Everyone gathered to share a lavish celebratory feast and commemorate this sacred life milestone. ` +
      `This day stands out as one of ${patientName}'s most joyful, emotionally grounding memories filled with lifelong love and community.`;
  } else if (tag === "Trip" || lowerTitle.includes("trip") || lowerTitle.includes("travel") || lowerTitle.includes("visit")) {
    if (hasPhoto) {
      guidingPrompts.push(
        `This photo captures a memorable journey. Would you like to add who accompanied ${patientName} and what scenic spot this was?`
      );
    } else {
      guidingPrompts.push(
        `How did ${patientName} travel on this trip (e.g. by train across Assam, mountain road, or bus)?`
      );
    }
    guidingPrompts.push(
      `What sights or nature views (such as tea gardens, the Brahmaputra, or green hills) did ${patientName} talk about afterwards?`
    );
    guidingPrompts.push(
      `Was there a favorite roadside tea stall, local handicraft market, or memorable meal enjoyed along the journey?`
    );

    recommendedDescription =
      `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}, ${patientName} set off on a wonderful journey to ${title || "a cherished destination"}. ` +
      `The trip was marked by fresh open air, changing scenic landscapes, and the excitement of exploring together with loved ones. ` +
      `${description ? `Key moments noted: "${description.trim()}". ` : ""}` +
      `From stopping for hot chai along the route to taking in the scenic vistas, every hour felt refreshing and unhurried. ` +
      `Reflecting on this travel always sparks fond smiles and vivid visual recollections of adventure and companionship.`;
  } else if (tag === "Festival" || lowerTitle.includes("bihu") || lowerTitle.includes("puja") || lowerTitle.includes("diwali")) {
    if (hasPhoto) {
      guidingPrompts.push(
        `Looks like a vibrant festival occasion. Would you like to mention who is pictured celebrating alongside ${patientName}?`
      );
    } else {
      guidingPrompts.push(
        `Which festival was being celebrated (such as Rongali Bihu, Magh Bihu, or Durga Puja), and who visited the house?`
      );
    }
    guidingPrompts.push(
      `What signature festive foods or delicacies (like fresh pitha, laru, payesh, or festive snacks) were prepared?`
    );
    guidingPrompts.push(
      `Do you remember the dhol, pepa, or devotional songs that were playing during the festivities?`
    );

    recommendedDescription =
      `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}, the household came alive for ${title || "the festive celebrations"} in ${locationStr}. ` +
      `The air was fragrant with homemade festive delicacies and the comforting sounds of music and conversation among relatives. ` +
      `${description ? `Notable memories included: "${description.trim()}". ` : ""}` +
      `${patientName} took great pride in participating in the rituals, welcoming guests, and exchanging warm greetings with the neighborhood. ` +
      `It remains an uplifting sensory memory that brings an immediate sense of belonging and cultural warmth.`;
  } else if (tag === "Achievement" || lowerTitle.includes("graduat") || lowerTitle.includes("job") || lowerTitle.includes("award")) {
    guidingPrompts.push(
      `What milestone was achieved (e.g. graduating college, starting a respected career, or building the family home)?`
    );
    guidingPrompts.push(
      `Who stood by ${patientName} to congratulate them and celebrate their dedication?`
    );
    guidingPrompts.push(
      `How did ${patientName} feel when receiving this honor or completing this major work?`
    );

    recommendedDescription =
      `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}, ${patientName} achieved a major personal milestone: ${title || "a proud achievement"}. ` +
      `This represented years of quiet perseverance, skill, and dedication recognized by family, colleagues, and community. ` +
      `${description ? `Caregiver recollection notes: "${description.trim()}". ` : ""}` +
      `The celebration that followed was filled with deep mutual pride and congratulations from everyone who knew their hard work. ` +
      `Revisiting this accomplishment reinforces feelings of personal dignity, confidence, and self-worth.`;
  } else {
    // Family occasion or general memories
    if (hasPhoto) {
      guidingPrompts.push(
        `In this family photo, would you like to identify the people standing close to ${patientName}?`
      );
    } else {
      guidingPrompts.push(
        `Who was present at this special moment, and what relationship did they have to ${patientName}?`
      );
    }
    guidingPrompts.push(
      `What little detail or funny story always makes ${patientName} smile when this day is brought up?`
    );
    guidingPrompts.push(
      `Was there a particular song, shared meal, or tradition associated with this gathering?`
    );

    recommendedDescription =
      `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}, ${patientName} shared a deeply meaningful moment: ${title || "a treasured family memory"}. ` +
      `Surrounded by those dearest to them, the gathering was characterized by ease, laughter, and timeless emotional security. ` +
      `${description ? `Notes from caregiver: "${description.trim()}". ` : ""}` +
      `These shared moments created a lasting tapestry of comfort and family solidarity that endures across generations. ` +
      `This memory serves as an invaluable anchor for therapeutic reminiscing and positive autobiographical recall.`;
  }

  return {
    guidingPrompts,
    recommendedDescription,
    source: "clinical-engine",
  };
}

/**
 * Optional Gemini LLM Copilot (utilizes Gemini 1.5 Flash free tier if API key is present).
 * Seamlessly falls back to the deterministic reminiscence generator on failure.
 */
async function generateGeminiCopilot({
  title = "",
  tag = "Wedding",
  date = "",
  description = "",
  hasPhoto = false,
  patientContext = {},
}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) return null;

  const patientName = patientContext.fullName || "the patient";
  const state = patientContext.state || "Assam / North East India";

  const prompt = `You are a compassionate geriatric memory specialist and Cognitive Stimulation Therapy (CST) copilot helping a family caregiver document a dementia patient's happiest life memories.

MEMORY DETAILS SUBMITTED BY CAREGIVER:
- Title: "${title}"
- Category: "${tag}"
- Approximate Date: "${date || "Not specified"}"
- Caregiver's Initial Notes: "${description || "None yet"}"
- Photo Attached: ${hasPhoto ? "Yes (a family/memory photograph is uploaded)" : "No"}
- Patient Name: ${patientName}
- Region/Culture: ${state}

YOUR TASK:
Provide assistance in valid JSON format with two keys:
1. "guidingPrompts": An array of 3 friendly, highly specific questions to ask the caregiver to jog their memory (e.g. if photo is attached or wedding/festival in Assam, suggest questions like "Looks like a traditional wedding in Assam. Would you like to add who is sitting next to the bride?" or about traditional songs, dishes like pitha, or specific family relatives).
2. "recommendedDescription": A rich, sensory-grounded 3-5 sentence autobiographical narrative that beautifully expands the caregiver's notes into a therapeutic reminiscence memory. Ground it in sensory details (sounds, weather, foods, emotions) suitable for Cognitive Stimulation Therapy without making up wild facts.

Respond ONLY with valid JSON with keys "guidingPrompts" and "recommendedDescription". No markdown backticks or commentary.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 600,
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Gemini Copilot returned status ${res.status}. Falling back to clinical engine.`);
      return null;
    }

    const data = await res.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Clean JSON if Gemini wrapped in code fences
    text = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.guidingPrompts) && parsed.recommendedDescription) {
      return {
        guidingPrompts: parsed.guidingPrompts,
        recommendedDescription: parsed.recommendedDescription,
        source: "gemini",
      };
    }
    return null;
  } catch (err) {
    console.warn("Gemini Copilot call bypassed/failed:", err.message);
    return null;
  }
}

/**
 * Main entry point for Memory Copilot
 */
async function analyzeMemoryWithCopilot(memoryInput) {
  const geminiResult = await generateGeminiCopilot(memoryInput);
  if (geminiResult) return geminiResult;
  return generateDeterministicCopilot(memoryInput);
}

module.exports = {
  analyzeMemoryWithCopilot,
};
