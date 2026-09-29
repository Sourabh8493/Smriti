/*
  Builds a pool of multiple-choice questions from a real Patient document,
  then buildSession() picks 5 at random. Every question type is skipped
  automatically if the underlying field is empty — nothing is invented about
  the patient, only the wrong *options* around a real answer are generated.

  Distractors prefer other real facts from the patient's own profile (a
  different person's real relation, a different real phone number's digits)
  before falling back to a generic filler pool — a caretaker or doctor's real
  name is a much better wrong answer than a random one, because it's
  something the patient plausibly has to actually distinguish.
*/

import { shuffle } from "../../shared/random.js";
import { resolveFileUrl } from "../../../api/uploads.js";

const FILLER_NAMES = [
  "Anita Devi",
  "Rahul Sharma",
  "Priya Gogoi",
  "Suresh Rai",
  "Meena Lyngdoh",
  "Arjun Singh",
  "Kavita Das",
  "Bikash Deka",
];

const NE_CITIES = [
  "Guwahati",
  "Shillong",
  "Imphal",
  "Aizawl",
  "Kohima",
  "Agartala",
  "Itanagar",
  "Gangtok",
  "Dibrugarh",
  "Silchar",
  "Jorhat",
  "Tezpur",
];

const RELATION_POOL = [
  "Son",
  "Daughter",
  "Spouse",
  "Grandson",
  "Granddaughter",
  "Neighbor",
  "Friend",
  "Sister",
  "Brother",
  "Nephew",
  "Niece",
];

const PLACE_POOL = [
  "Kaziranga National Park",
  "Tawang",
  "Cherrapunji",
  "Majuli Island",
  "Loktak Lake",
  "Ziro Valley",
  "Dzukou Valley",
  "Umiam Lake",
];

const FOOD_POOL = [
  "Khar",
  "Momos",
  "Jadoh",
  "Chak-hao kheer",
  "Bamboo shoot curry",
  "Smoked pork with bamboo shoot",
  "Eromba",
  "Pitha",
];

const NER_STATES = [
  "Assam",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Tripura",
  "Arunachal Pradesh",
  "Sikkim",
];

const HOBBY_POOL = [
  "Gardening",
  "Weaving",
  "Wood carving",
  "Fishing",
  "Folk singing",
  "Pottery",
  "Cooking",
  "Reading",
  "Knitting",
  "Storytelling",
];

const SONG_POOL = [
  "Bihu Geet",
  "Rabindra Sangeet",
  "Manipuri Nata Sankirtana",
  "Khasi Folk Ballad",
  "Borgeet",
  "Mizo Gospel",
  "Goalpariya Lokageet",
  "Jyoti Sangeet",
];

const ROUTINE_POOL = [
  "Morning walk in the garden",
  "Visiting the local prayer hall / namghar",
  "Drinking warm afternoon tea",
  "Tending to courtyard plants",
  "Listening to morning radio",
  "Reading evening newspapers",
];

const MEMORY_TAG_POOL = [
  "Wedding day celebration",
  "Harvest festival (Bihu / Ningol Chakouba)",
  "Family reunion picnic",
  "Trip to scenic hills",
  "Birth of grandchild",
  "Golden anniversary",
];

/* ---------------- Phrasing Templates ---------------- */

function pickTemplate(templates, ...args) {
  const tpl = templates[Math.floor(Math.random() * templates.length)];
  return typeof tpl === "function" ? tpl(...args) : tpl;
}

const CITY_TEMPLATES = [
  "Which city do you live in?",
  "Which city is your home?",
  "Where is your residence located?",
  "In which town or city do you stay?",
];

const STATE_TEMPLATES = [
  "Which state do you call home?",
  "In which state is your family rooted?",
  "Which beautiful region or state do you reside in?",
];

const PHONE_TEMPLATES = [
  "What is your contact phone number?",
  "Which phone number reaches you?",
  "Can you identify your telephone number?",
];

const EMERGENCY_NAME_TEMPLATES = [
  "Who is your designated emergency contact?",
  "Who is the person to contact in an emergency?",
  "Who will family or doctors call first if help is needed?",
];

const EMERGENCY_PHONE_TEMPLATES = [
  "What is your emergency contact's phone number?",
  "Which number connects to your emergency contact?",
];

const DOCTOR_TEMPLATES = [
  "Who is your caring doctor?",
  "What is the name of your doctor?",
  "Who looks after your medical health and checkups?",
];

const CARETAKER_TEMPLATES = [
  "Who takes care of you day-to-day?",
  "Who is your daily caretaker and companion?",
  "Who helps you with your daily routine at home?",
];

const CARETAKER_RELATION_TEMPLATES = [
  (name) => `How is ${name} (your caretaker) related to you?`,
  (name) => `What is the relation of your caretaker ${name}?`,
];

const PLACE_TEMPLATES = [
  "What is your favorite place to visit?",
  "Which destination holds fond memories for you?",
  "Which scenic spot do you cherish the most?",
];

const FOOD_TEMPLATES = [
  "What is your favorite food or dish?",
  "Which comforting dish do you love eating most?",
  "What meal brings back the fondest tastes for you?",
];

const HOBBY_TEMPLATES = [
  "What is one of your favorite hobbies or pastimes?",
  "What activity do you enjoy spending time doing?",
  "Which pleasant hobby brings you joy and relaxation?",
];

const SONG_TEMPLATES = [
  "What style of music or favorite song do you love?",
  "Which songs or musical tradition do you enjoy listening to?",
  "What music brings peace and fond memories to your heart?",
];

const ROUTINE_TEMPLATES = [
  "What is an important part of your daily routine?",
  "Which daily habit is part of your regular day?",
  "What regular activity do you look forward to each day?",
];

const PERSON_PHOTO_TEMPLATES = [
  "Who is this familiar smiling face?",
  "Can you recognize who is in this picture?",
  "Who is this dear person in your life?",
];

const PERSON_RELATION_TEMPLATES = [
  (name) => `What is ${name}'s relation to you?`,
  (name) => `How is ${name} related to you in your family?`,
  (name) => `Who is ${name} to you?`,
];

const MEMORY_TITLE_TEMPLATES = [
  (title) => `What special life occasion was "${title}"?`,
  (title) => `Which joyful celebration was celebrated during "${title}"?`,
  (title) => `What happy moment took place at "${title}"?`,
];

const MEMORY_PHOTO_TEMPLATES = [
  "Which cherished memory is captured in this photo?",
  "Can you identify what joyful occasion this photograph shows?",
];

/* ------------------------------------------------------------------ */

let idCounter = 0;

export function formatQuestionForLevel(question, level = 2) {
  const distractorCount = level === 1 ? 1 : level === 2 ? 2 : 3;
  const chosenDistractors = (question.distractorLabels || []).slice(0, distractorCount);
  const options = shuffle([
    { id: "correct", label: question.correctLabel, correct: true },
    ...chosenDistractors.map((label, i) => ({ id: `d${i}`, label, correct: false })),
  ]);
  return {
    ...question,
    level,
    options,
  };
}

function buildMCQ(category, prompt, correctLabel, distractorLabels, media = null) {
  const options = shuffle([
    { id: "correct", label: correctLabel, correct: true },
    ...distractorLabels.slice(0, 3).map((label, i) => ({ id: `d${i}`, label, correct: false })),
  ]);
  return {
    id: `${category}-${idCounter++}`,
    category,
    prompt,
    media,
    correctLabel,
    distractorLabels,
    options,
  };
}

/** Fills up to 3 unique distractors, preferring `preferred` (real profile facts) over `fallback` (generic filler). */
function fillTo3(preferred, fallback) {
  const result = [];
  const used = new Set();
  const tryAdd = (arr) => {
    for (const item of shuffle(arr.filter(Boolean))) {
      if (result.length >= 3) break;
      if (!used.has(item)) {
        used.add(item);
        result.push(item);
      }
    }
  };
  tryAdd(preferred);
  tryAdd(fallback);
  return result;
}

function mutatePhone(phone) {
  const chars = phone.split("");
  const digitIndices = chars.map((c, i) => (/\d/.test(c) ? i : -1)).filter((i) => i >= 0);
  const targetable = digitIndices.slice(-6); // mutate within the last 6 digits
  const idxs = shuffle(targetable).slice(0, 2);
  idxs.forEach((i) => {
    const d = Number(chars[i]);
    chars[i] = String((d + 1 + Math.floor(Math.random() * 8)) % 10);
  });
  return chars.join("");
}

function makePhoneQuestion(prompt, phone) {
  const distractors = [];
  let guard = 0;
  while (distractors.length < 3 && guard < 30) {
    guard++;
    const candidate = mutatePhone(phone);
    if (candidate !== phone && !distractors.includes(candidate)) distractors.push(candidate);
  }
  return buildMCQ("phone", prompt, phone, distractors);
}

function makeNameQuestion(prompt, correctName, knownNames) {
  const distractors = fillTo3(
    knownNames.filter((n) => n !== correctName),
    FILLER_NAMES.filter((n) => n !== correctName)
  );
  return buildMCQ("identity", prompt, correctName, distractors);
}

function makeChoiceQuestion(category, prompt, correct, pool) {
  const distractors = fillTo3([], pool.filter((v) => v !== correct));
  return buildMCQ(category, prompt, correct, distractors);
}

function makePersonPhotoQuestion(person, allPeople) {
  const otherNames = allPeople.filter((p) => p !== person && p.name).map((p) => p.name);
  const distractors = fillTo3(otherNames, FILLER_NAMES.filter((n) => n !== person.name));
  return buildMCQ(
    "personPhoto",
    pickTemplate(PERSON_PHOTO_TEMPLATES),
    person.name,
    distractors,
    resolveFileUrl(person.photoUrl)
  );
}

function makeRelationQuestion(person, allPeople) {
  const otherRelations = allPeople
    .filter((p) => p !== person && p.relation)
    .map((p) => p.relation);
  const distractors = fillTo3(
    otherRelations.filter((r) => r !== person.relation),
    RELATION_POOL.filter((r) => r !== person.relation)
  );
  return buildMCQ(
    "personRelation",
    pickTemplate(PERSON_RELATION_TEMPLATES, person.name),
    person.relation,
    distractors,
    resolveFileUrl(person.photoUrl)
  );
}

/** Every real name already known about the patient, for use as plausible distractors elsewhere. */
function collectKnownNames(patient, exclude) {
  const names = new Set();
  (patient.people || []).forEach((p) => p.name && names.add(p.name));
  if (patient.medical?.doctorName) names.add(patient.medical.doctorName);
  if (patient.medical?.caretakerName) names.add(patient.medical.caretakerName);
  if (patient.basic?.emergencyName) names.add(patient.basic.emergencyName);
  names.delete(exclude);
  return Array.from(names);
}

/* ------------------------------------------------------------------ */

function buildPool(patient) {
  const pool = [];
  const basic = patient.basic || {};
  const medical = patient.medical || {};
  const preferences = patient.preferences || {};
  const people = (patient.people || []).filter((p) => p.name?.trim());
  const memories = (patient.memories || []).filter((m) => m.title?.trim() || m.tag?.trim());

  people.forEach((p) => {
    if (p.photoUrl && p.name) pool.push(makePersonPhotoQuestion(p, people));
    if (p.relation && p.name) pool.push(makeRelationQuestion(p, people));
  });

  if (basic.city) {
    pool.push(makeChoiceQuestion("address", pickTemplate(CITY_TEMPLATES), basic.city, NE_CITIES));
  }
  if (basic.state) {
    pool.push(makeChoiceQuestion("state", pickTemplate(STATE_TEMPLATES), basic.state, NER_STATES));
  }
  if (basic.phone) {
    pool.push(makePhoneQuestion(pickTemplate(PHONE_TEMPLATES), basic.phone));
  }
  if (basic.emergencyName) {
    pool.push(
      makeNameQuestion(
        pickTemplate(EMERGENCY_NAME_TEMPLATES),
        basic.emergencyName,
        collectKnownNames(patient, basic.emergencyName)
      )
    );
  }
  if (basic.emergencyPhone) {
    pool.push(makePhoneQuestion(pickTemplate(EMERGENCY_PHONE_TEMPLATES), basic.emergencyPhone));
  }
  if (medical.doctorName) {
    pool.push(
      makeNameQuestion(
        pickTemplate(DOCTOR_TEMPLATES),
        medical.doctorName,
        collectKnownNames(patient, medical.doctorName)
      )
    );
  }
  if (medical.caretakerName) {
    pool.push(
      makeNameQuestion(
        pickTemplate(CARETAKER_TEMPLATES),
        medical.caretakerName,
        collectKnownNames(patient, medical.caretakerName)
      )
    );
    if (medical.caretakerRelation) {
      const distractors = fillTo3(
        RELATION_POOL.filter((r) => r !== medical.caretakerRelation),
        RELATION_POOL
      );
      pool.push(
        buildMCQ(
          "personRelation",
          pickTemplate(CARETAKER_RELATION_TEMPLATES, medical.caretakerName),
          medical.caretakerRelation,
          distractors
        )
      );
    }
  }
  if (medical.dailyRoutine) {
    const routineItems = medical.dailyRoutine.split(",").map((s) => s.trim()).filter(Boolean);
    const primaryRoutine = routineItems[0] || medical.dailyRoutine;
    pool.push(
      makeChoiceQuestion("routine", pickTemplate(ROUTINE_TEMPLATES), primaryRoutine, ROUTINE_POOL)
    );
  }
  if (preferences.favoritePlace) {
    pool.push(
      makeChoiceQuestion("preference", pickTemplate(PLACE_TEMPLATES), preferences.favoritePlace, PLACE_POOL)
    );
  }
  if (preferences.favoriteFood) {
    pool.push(
      makeChoiceQuestion("preference", pickTemplate(FOOD_TEMPLATES), preferences.favoriteFood, FOOD_POOL)
    );
  }
  if (preferences.hobbies) {
    const hobbyItems = preferences.hobbies.split(",").map((s) => s.trim()).filter(Boolean);
    const primaryHobby = hobbyItems[0] || preferences.hobbies;
    pool.push(
      makeChoiceQuestion("hobby", pickTemplate(HOBBY_TEMPLATES), primaryHobby, HOBBY_POOL)
    );
  }
  if (preferences.favoriteSongs) {
    const songItems = preferences.favoriteSongs.split(",").map((s) => s.trim()).filter(Boolean);
    const primarySong = songItems[0] || preferences.favoriteSongs;
    pool.push(
      makeChoiceQuestion("songs", pickTemplate(SONG_TEMPLATES), primarySong, SONG_POOL)
    );
  }

  memories.forEach((m) => {
    const memTag = m.tag || m.title;
    if (memTag) {
      const distractors = fillTo3(
        memories.filter((other) => other !== m).map((o) => o.tag || o.title),
        MEMORY_TAG_POOL.filter((t) => t !== memTag)
      );
      if (m.photoUrl) {
        pool.push(
          buildMCQ(
            "memoryPhoto",
            pickTemplate(MEMORY_PHOTO_TEMPLATES),
            m.title || memTag,
            distractors,
            resolveFileUrl(m.photoUrl)
          )
        );
      } else if (m.title && m.tag) {
        pool.push(
          buildMCQ(
            "memoryEvent",
            pickTemplate(MEMORY_TITLE_TEMPLATES, m.title),
            m.tag,
            distractors
          )
        );
      }
    }
  });

  // Only keep questions that actually ended up with 4 options — a category
  // with too little surrounding data to build 3 fair distractors is dropped
  // rather than shown with a short-changed option list.
  return pool.filter((q) => q.options && q.options.length === 4);
}

export function buildSession(patient) {
  const pool = buildPool(patient);
  const count = Math.min(5, pool.length);
  return { questions: shuffle(pool).slice(0, count), poolSize: pool.length };
}
