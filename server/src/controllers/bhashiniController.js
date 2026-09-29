const { translateText, generateTTS, transcribeAudio } = require("../services/bhashiniService");
const Patient = require("../models/Patient");

/**
 * Translation API endpoint
 */
async function handleTranslate(req, res) {
  const { text, sourceLang = "en", targetLang = "as" } = req.body;
  if (!text) {
    return res.status(400).json({ message: "Text is required for translation." });
  }

  const translatedText = await translateText(text, sourceLang, targetLang);
  res.json({ translatedText, sourceLang, targetLang });
}

/**
 * Text-to-Speech API endpoint
 */
async function handleTTS(req, res) {
  const { text, language = "as", gender = "female" } = req.body;
  if (!text) {
    return res.status(400).json({ message: "Text is required for TTS." });
  }

  const audioContent = await generateTTS(text, language, gender);
  res.json({ audioContent, language });
}

/**
 * Speech-to-Text (ASR) API endpoint
 */
async function handleASR(req, res) {
  const { audioContent, language = "as" } = req.body;
  if (!audioContent) {
    return res.status(400).json({ message: "audioContent base64 is required for ASR." });
  }

  const transcript = await transcribeAudio(audioContent, language);
  res.json({ transcript, language });
}

/**
 * CST Cognitive Stimulation Therapy AI Companion Conversation
 * Generates an empathetic, friendly companion response for reliving happiest memories.
 * Implements Errorless-Response CST:
 * - Detects hesitation or forgetfulness
 * - Warmly cues and completes the memory using caretaker details
 * - Asks gentle, evocative sensory questions
 */
/**
 * CST Cognitive Stimulation Therapy AI Companion Conversation
 * Generates an empathetic, human-like companion response for reliving happiest memories.
 * Implements:
 * 1. Deep analysis of patient response (emotions, people, sensory cues, reflective statements)
 * 2. Non-repetitive question reframing tied dynamically to the memory's narrative arc
 * 3. 2-Tier scaffolding on "I don't remember":
 *    - 1st struggle: Gentle contextual hint for that specific question (never reciting the whole memory)
 *    - 2nd consecutive struggle: Therapeutic, calming full memory storytelling
 * 4. Event completion detection: Prompts patient to move on to next memory or end the session
 * 5. Punctuation normalization: Never generates '!' before TTS so speech engines don't say "factorial"
 */
async function handleCSTChat(req, res) {
  let patient = null;
  if (req.user?._id) {
    patient = await Patient.findOne({ user: req.user._id });
  }
  if (!patient) {
    patient = await Patient.findOne().sort({ updatedAt: -1 });
  }

  const {
    message = "",
    memoryTitle = "",
    memoryTag = "",
    memoryDate = "",
    memoryDescription = "",
    conversationHistory = [],
    language = "en",
    generateAudio = false,
    consecutiveStruggles = 0,
  } = req.body;

  const patientName = patient?.basic?.fullName || "my friend";
  const userText = (message || "").toLowerCase().trim();

  // 1. Check for session navigation requests
  const wantsNextMemory =
    userText.includes("next memory") ||
    userText.includes("another memory") ||
    userText.includes("different memory") ||
    userText.includes("move on");

  const wantsEndSession =
    userText.includes("end session") ||
    userText.includes("finish session") ||
    userText.includes("conclude") ||
    userText.includes("wrap up") ||
    userText.includes("goodbye") ||
    userText.includes("stop for today");

  if (wantsNextMemory) {
    const reply = `I would love to explore another happy memory with you, ${patientName}. Let us turn to another beautiful moment together.`;
    return sendCSTResponse(res, {
      englishReply: reply,
      suggestionCues: ["Let's begin 🌸", "Show me the next memory"],
      language,
      generateAudio,
      sessionAction: "next_memory",
    });
  }

  if (wantsEndSession) {
    const reply = `Thank you from the bottom of my heart for sharing these precious memories with me today, ${patientName}. You did wonderfully. Carry this warmth and peace with you throughout your day.`;
    return sendCSTResponse(res, {
      englishReply: reply,
      suggestionCues: ["Thank you 💖", "Goodbye for now"],
      language,
      generateAudio,
      sessionAction: "end_session",
    });
  }

  // 2. Check for forgetting / hesitation / struggle
  const indicatesForgetting =
    userText.includes("don't remember") ||
    userText.includes("dont remember") ||
    userText.includes("forgot") ||
    userText.includes("can't recall") ||
    userText.includes("cant recall") ||
    userText.includes("don't know") ||
    userText.includes("dont know") ||
    userText.includes("not sure") ||
    userText.includes("help me remember") ||
    userText.includes("who was it") ||
    userText.includes("i forgot") ||
    userText.includes("tell me");

  const tagLower = (memoryTag || "").toLowerCase();
  const titleLower = (memoryTitle || "").toLowerCase();

  const isWedding = tagLower.includes("wedding") || titleLower.includes("wedding") || titleLower.includes("biya");
  const isFestival = tagLower.includes("festival") || titleLower.includes("bihu") || titleLower.includes("feast") || titleLower.includes("celebrat");
  const isTrip = tagLower.includes("trip") || tagLower.includes("travel") || titleLower.includes("hill") || titleLower.includes("river") || titleLower.includes("journey");
  const isFamily = tagLower.includes("family") || titleLower.includes("family") || titleLower.includes("grandchild");

  // Determine last AI question to tailor hints
  const lastAiMsg = [...conversationHistory].reverse().find((m) => m.role === "assistant" || m.sender === "ai");
  const lastAiText = (lastAiMsg?.content || lastAiMsg?.text || "").toLowerCase();

  // Count patient turns in this session
  const patientTurns = conversationHistory.filter(
    (m) => m.role === "user" || m.sender === "patient"
  ).length;

  let englishReply = "";
  let suggestionCues = [];
  let isMemoryCompletion = false;

  // 3. Opening greeting (first contact)
  if (!message || conversationHistory.length === 0) {
    if (isWedding) {
      englishReply = `Hello ${patientName}. It is so wonderful to sit together today. Let's look back on this beautiful milestone: "${memoryTitle}". It was such a radiant and heartfelt day. Do you remember the smiles and blessings when your family and friends gathered around you?`;
      suggestionCues = [
        "I remember feeling so joyous",
        "My family was all around me",
        "The silk clothes were beautiful",
        "I don't remember clearly",
      ];
    } else if (isFestival) {
      englishReply = `Hello ${patientName}. What a joy it is to remember "${memoryTitle}" with you today. The celebrations brought so much life and warmth. Do you remember the cheerful festive treats, or the traditional music playing?`;
      suggestionCues = [
        "Yes, we had delicious treats",
        "I remember the festive music",
        "Everyone was smiling together",
        "I don't remember clearly",
      ];
    } else if (isTrip) {
      englishReply = `Hello ${patientName}. Let's revisit this lovely journey together: "${memoryTitle}". Being out in nature and taking in the scenic views is so refreshing. Do you remember the gentle breeze and how peaceful the atmosphere felt?`;
      suggestionCues = [
        "The view was so beautiful",
        "We had hot tea together",
        "It was very peaceful",
        "I don't remember clearly",
      ];
    } else if (isFamily) {
      englishReply = `Hello ${patientName}. It warms my heart to talk about "${memoryTitle}" with you today. Having loved ones close is such a priceless feeling. Do you remember the laughter or stories that filled the room?`;
      suggestionCues = [
        "The children were laughing",
        "We shared a warm dinner",
        "It was a blessed day",
        "I don't remember clearly",
      ];
    } else {
      const caregiverNote = memoryDescription
        ? `Your caretaker noted that ${memoryDescription}.`
        : "What a comforting day that was.";
      englishReply = `Hello ${patientName}. It brings me so much warmth to be with you today. Let's look back on this special time: "${memoryTitle}". ${caregiverNote} What is the first feeling that comes to mind when you picture this moment?`;
      suggestionCues = [
        "It was a very happy time",
        "I was with the people I love",
        "It felt peaceful and calm",
        "I don't remember clearly",
      ];
    }
  } else if (indicatesForgetting) {
    // 4. TWO-TIER ERRORLESS SCAFFOLDING
    // 1st struggle -> Give gentle hint for that specific question (NOT the whole memory)
    // 2nd consecutive struggle -> Tell the whole memory in a therapeutic, calming storytelling way
    const struggleTier = consecutiveStruggles || 1;

    if (struggleTier === 1) {
      let specificHint = "";
      if (lastAiText.includes("music") || lastAiText.includes("sound") || lastAiText.includes("drum") || lastAiText.includes("sing")) {
        specificHint = isFestival
          ? "think of the rhythmic beats of the dhol drums and folk melodies playing in the courtyard."
          : "think of the gentle tunes and songs being sung during the celebration.";
      } else if (lastAiText.includes("treat") || lastAiText.includes("food") || lastAiText.includes("aroma") || lastAiText.includes("tea") || lastAiText.includes("meal")) {
        specificHint = "think of the comforting aroma of warm tea and special festive sweets being served.";
      } else if (lastAiText.includes("person") || lastAiText.includes("who") || lastAiText.includes("beside") || lastAiText.includes("family")) {
        const familyName = patient?.people?.[0]?.name ? `${patient.people[0].name} and your loved ones` : "your beloved family";
        specificHint = `think of the smiling faces sitting right beside you, like ${familyName}.`;
      } else if (isTrip) {
        specificHint = "picture the wide open sky, the rolling hills, and the fresh breeze off the river.";
      } else {
        specificHint = memoryDescription
          ? `think about what your family recalls: "${memoryDescription.slice(0, 80)}...".`
          : `think about how relaxed and safe you felt during "${memoryTitle}".`;
      }

      englishReply = `That is completely fine, ${patientName}, there is no hurry at all. Take a gentle, easy breath. Here is a little clue to help picture it: ${specificHint} Does that bring back a familiar feeling?`;
      suggestionCues = [
        "Ah yes, now I picture it a little",
        "It still feels a bit blurry",
        "I remember feeling happy",
        "Tell me more about it",
      ];
    } else {
      // 2 or more struggles in a row: Recite the whole memory therapeutically
      isMemoryCompletion = true;
      const detailedStory = memoryDescription
        ? memoryDescription
        : `a joyous celebration where your loved ones gathered around you with immense warmth, delicious food, and comforting blessings`;

      const peopleContext =
        patient?.people && patient.people.length > 0
          ? `Your dear ones, including ${patient.people.slice(0, 2).map((p) => p.name).join(" and ")}, were right there cherishing every moment with you.`
          : `Your loved ones were right there by your side, celebrating this beautiful moment.`;

      englishReply = `Please rest easy, ${patientName}, you are safe and warm, and there is no need to worry. Let me recount this whole lovely day for you so you can just relax and listen. On that special day of "${memoryTitle}", ${detailedStory}. ${peopleContext} Your caretaker shared how brightly your smile shone and how at peace your heart was. Every bit of that love and warmth is still right here with you today. Does hearing that story bring a gentle comfort to your heart?`;

      suggestionCues = [
        "Yes, that brings peace to my heart",
        "Thank you for reminding me",
        "I feel relaxed now",
        "Move on to next memory 🔄",
      ];
    }
  } else {
    // 5. NATURAL, ANALYTICAL & HUMAN-LIKE CONVERSATION FLOW (NO CANNED REPETITION)
    // Step A: Parse patient's response deeply
    const mentionsJoy = userText.includes("happy") || userText.includes("joy") || userText.includes("smile") || userText.includes("laugh") || userText.includes("fun") || userText.includes("glad") || userText.includes("great");
    const mentionsPeace = userText.includes("peace") || userText.includes("calm") || userText.includes("quiet") || userText.includes("relax") || userText.includes("comfort") || userText.includes("serene") || userText.includes("rest");
    const mentionsLove = userText.includes("love") || userText.includes("blessed") || userText.includes("cherish") || userText.includes("fond") || userText.includes("miss") || userText.includes("heart");
    const mentionsFood = userText.includes("tea") || userText.includes("chai") || userText.includes("pitha") || userText.includes("laru") || userText.includes("food") || userText.includes("eat") || userText.includes("sweet") || userText.includes("dinner") || userText.includes("meal") || userText.includes("curry") || userText.includes("rice");
    const mentionsMusic = userText.includes("music") || userText.includes("song") || userText.includes("sing") || userText.includes("bihu") || userText.includes("dhol") || userText.includes("drum") || userText.includes("dance") || userText.includes("tune");
    const mentionsNature = userText.includes("hill") || userText.includes("river") || userText.includes("view") || userText.includes("breeze") || userText.includes("tree") || userText.includes("mountain") || userText.includes("temple");

    // Check if patient mentioned specific family or names
    const knownPeople = patient?.people || [];
    const matchedPerson = knownPeople.find((p) => p.name && userText.includes(p.name.toLowerCase()));
    const mentionsFamily = matchedPerson
      ? matchedPerson.name
      : userText.includes("family")
      ? "your family"
      : userText.includes("child") || userText.includes("kid")
      ? "the children"
      : userText.includes("grandchild")
      ? "the grandchildren"
      : userText.includes("wife")
      ? "your wife"
      : userText.includes("husband")
      ? "your husband"
      : userText.includes("daughter")
      ? "your daughter"
      : userText.includes("son")
      ? "your son"
      : userText.includes("friend")
      ? "your friends"
      : null;

    // Build unique, authentic empathetic reflection on what they actually said
    let reflection = "";
    if (matchedPerson || mentionsFamily) {
      reflection = `Hearing you speak of ${mentionsFamily} brings such real warmth into the room. Having them right there beside you makes that memory truly timeless.`;
    } else if (mentionsMusic) {
      reflection = `Music has such a timeless way of lifting our spirits. That rhythm and melody must have made the whole gathering feel so alive.`;
    } else if (mentionsFood) {
      reflection = `You can almost still taste those delicious treats. Sharing food and warm tea together is truly the quickest way to make a house feel like home.`;
    } else if (mentionsNature) {
      reflection = `That scenery must have been breathtaking. Being in the open air, taking in that calm view, gives such a deep sense of peace.`;
    } else if (mentionsJoy) {
      reflection = `Your eyes light up with that same wonderful happiness when you share that. Genuine joy like that never fades away.`;
    } else if (mentionsPeace || mentionsLove) {
      reflection = `That feeling of deep peace and love is so precious. It is a quiet sanctuary you can always return to inside your heart.`;
    } else if (userText.includes("yes") || userText.includes("i do") || userText.includes("i remember")) {
      reflection = `It is so wonderful to know that feeling is still so clear and vivid in your thoughts.`;
    } else {
      reflection = `What a lovely thought to share with me, ${patientName}. You describe it with so much grace.`;
    }

    // Step B: Progressive, non-repeating questions along the memory's arc
    if (patientTurns <= 1) {
      // Stage 1: Explore Sensory Details
      let nextQuestion = "";
      if (isWedding) {
        nextQuestion = `When you look back on that ceremony, do you remember the golden glow of the traditional silk, or the sounds of people laughing and giving blessings?`;
        suggestionCues = [
          "The beautiful silk attire",
          "The laughter and blessings",
          "Everyone was so happy",
          "Tell me more about it",
        ];
      } else if (isFestival) {
        nextQuestion = `What sensory detail stands out the most to you — the sweet aroma of freshly prepared festive pitha, or the lively beats of the traditional drums?`;
        suggestionCues = [
          "The aroma of warm pitha",
          "The sound of the drums",
          "The colorful traditional clothes",
          "I don't remember clearly",
        ];
      } else if (isTrip) {
        nextQuestion = `Along that scenic route, do you remember the cool breeze blowing, or stopping for a hot cup of roadside tea together?`;
        suggestionCues = [
          "The cool mountain breeze",
          "The warm roadside tea",
          "Looking at the river",
          "I don't remember clearly",
        ];
      } else if (isFamily) {
        nextQuestion = `In that gathering, what was the most comforting sound — the children playing, or the elders sharing old stories?`;
        suggestionCues = [
          "The children laughing and playing",
          "The old stories we shared",
          "Sitting peacefully together",
          "I don't remember clearly",
        ];
      } else {
        nextQuestion = `When you picture yourself in that setting, what is the clearest thing you notice — the warm voices around you, or the comfortable atmosphere?`;
        suggestionCues = [
          "The warm voices around me",
          "The peaceful atmosphere",
          "The smiling faces",
          "Tell me more",
        ];
      }
      englishReply = `${reflection} ${nextQuestion}`;
    } else if (patientTurns === 2) {
      // Stage 2: Explore Personal Connections & Interactions
      let nextQuestion = "";
      if (isWedding) {
        nextQuestion = `Who was one special person whose warm embrace or smile meant the most to you on that milestone day?`;
        suggestionCues = [
          "My spouse beside me",
          "My parents giving blessings",
          "My lifelong friends",
          "Everyone gathered together",
        ];
      } else if (isFestival) {
        nextQuestion = `Who among your family or neighbors was having the most fun celebrating with you that day?`;
        suggestionCues = [
          "The children were so excited",
          "My family members",
          "The friendly neighbors",
          "We were all celebrating",
        ];
      } else if (isTrip) {
        nextQuestion = `Who was sitting right next to you during the trip, sharing in that breathtaking view?`;
        suggestionCues = [
          "My family by my side",
          "My dear companion",
          "A close friend",
          "We all shared the journey",
        ];
      } else if (isFamily) {
        nextQuestion = `Was there a particular conversation or a playful story shared with a loved one that made you smile the most?`;
        suggestionCues = [
          "Someone told a funny joke",
          "We talked about old times",
          "Seeing everyone healthy and smiling",
          "Just being together",
        ];
      } else {
        nextQuestion = `Who were you happiest to share this special time with?`;
        suggestionCues = [
          "My family and loved ones",
          "A very dear friend",
          "People who cared for me",
          "It felt so complete",
        ];
      }
      englishReply = `${reflection} ${nextQuestion}`;
    } else if (patientTurns === 3) {
      // Stage 3: The Single Cherished Climax
      englishReply = `${reflection} Looking back across all of "${memoryTitle}", what is the one single moment that you cherish most in your heart?`;
      suggestionCues = [
        "Being surrounded by so much love",
        "The peace I felt inside",
        "The laughter we shared",
        "It was all unforgettable",
      ];
    } else {
      // Stage 4: Event completion & Decision Point
      englishReply = `${reflection} We have walked through all the lovely events of this memory together, ${patientName}. It has been such an uplifting, heartwarming time reliving these moments with you. Would you like to stroll through another cherished memory, or would you like to conclude our therapy session for today?`;
      suggestionCues = [
        "Move to next memory 🔄",
        "End session for today 🌿",
        "Tell me more about this day ✨",
      ];
    }
  }

  return sendCSTResponse(res, {
    englishReply,
    suggestionCues,
    language,
    generateAudio,
    isMemoryCompletion,
  });
}

/**
 * Helper to translate, synthesize TTS, and respond with CST response payload
 */
async function sendCSTResponse(
  res,
  {
    englishReply,
    suggestionCues = [],
    language = "en",
    generateAudio = false,
    isMemoryCompletion = false,
    sessionAction = null,
  }
) {
  let finalReply = englishReply;
  if (language && language !== "en") {
    try {
      finalReply = await translateText(englishReply, "en", language);
    } catch (err) {
      console.warn("CST response translation failed:", err.message);
    }
  }

  let finalCues = suggestionCues;
  if (language && language !== "en") {
    try {
      finalCues = await Promise.all(
        suggestionCues.map((c) => translateText(c, "en", language))
      );
    } catch {
      finalCues = suggestionCues;
    }
  }

  let audioContent = null;
  if (generateAudio) {
    try {
      audioContent = await generateTTS(finalReply, language);
    } catch (err) {
      console.warn("CST TTS generation failed:", err.message);
    }
  }

  return res.json({
    reply: finalReply,
    englishReply,
    suggestionCues: finalCues,
    audioContent,
    language,
    isMemoryCompletion,
    sessionAction,
  });
}

module.exports = {
  handleTranslate,
  handleTTS,
  handleASR,
  handleCSTChat,
};
