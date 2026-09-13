import React, { useCallback, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";
import {
  AlertCircle,
  Award,
  BarChart3,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  FilePlus2,
  Flag,
  Layers,
  LockKeyhole,
  LogOut,
  Mail,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Target,
  Trophy,
  UnlockKeyhole,
  User,
  Users,
  X,
  XCircle
} from "lucide-react";
import { auth, db, googleProvider, hasFirebaseConfig } from "./firebase";

const LOCAL_PROFILE_KEY = "prepboard_profile";
const LOCAL_ATTEMPTS_KEY = "prepboard_attempts";
const LOCAL_UNLOCKS_KEY = "prepboard_unlocked_tests";
const LOCAL_HOST_TESTS_KEY = "prepboard_host_tests";
const LOCAL_BOOKMARKS_KEY = "prepboard_bookmarked_tests";
const LOCAL_LIVE_ENROLLMENTS_KEY = "prepboard_live_enrollments";
const LOCAL_PROGRESS_KEY = "prepboard_test_progress";
const FREE_UNLOCK_CODE = "PREP100";
const HOST_ACCESS_CODE = "HOST100";
const HOST_EMAILS = ["nilamroychoudhury216@gmail.com"];

const NAV_ITEMS = [
  "Dashboard",
  "Courses",
  "Tests",
  "PYPs",
  "Mentorship",
  "Bookmarks",
  "Subscription",
  "Videos",
  "Current Affairs",
  "Success Stories"
];

const CATEGORIES = [
  { id: "banking", label: "Banking", exams: "IBPS RRB Officer, IBPS PO, SBI PO" },
  { id: "ssc", label: "SSC", exams: "CGL, CHSL, CPO" },
  { id: "railways", label: "Railways", exams: "RRB NTPC, Group D" },
  { id: "regulatory", label: "Regulatory", exams: "RBI, NABARD, SEBI" }
];

const COURSE_CATALOG = [
  {
    id: "rrbposecpre",
    title: "IBPS RRB PO Prelims Sectional",
    category: "banking",
    exam: "IBPS RRB Officer Scale I",
    totalTests: 40,
    freeTests: 2,
    testPattern: "Sectional",
    sections: ["Reasoning", "Quantitative Aptitude"],
    description: "Section-wise prelims practice with real timer, palette states, and analysis."
  },
  {
    id: "banking-super-practice",
    title: "Banking Super Practice",
    category: "banking",
    exam: "Banking & Insurance",
    totalTests: 1000,
    freeTests: 8,
    testPattern: "Prelims, mains, PYP, revision",
    sections: ["Reasoning", "Quantitative Aptitude", "English", "General Awareness"],
    description: "Beginner to advanced tests across banking exams."
  }
];

const LIVE_TESTS = [
  { id: "live-ssc-cpo", title: "SSC CPO Live Test", date: "Sep 14", startsAt: "10:00 AM", meta: "Free weekly live test", category: "ssc" },
  { id: "live-rrb-po", title: "IBPS RRB PO Live Test", date: "Sep 14", startsAt: "7:00 PM", meta: "All India ranking", category: "banking" },
  { id: "live-technician", title: "RRB Grade III Technician", date: "Sep 15", startsAt: "6:00 PM", meta: "Timed leaderboard", category: "railways" }
];

const PYP_EXAMS = [
  { title: "SBI Clerk Past Live Tests", category: "banking", exam: "SBI Clerk" },
  { title: "SBI Clerk Pre PYP", category: "banking", exam: "SBI Clerk" },
  { title: "IBPS Clerk Pre PYP", category: "banking", exam: "IBPS Clerk" },
  { title: "RRB Clerk Pre PYP", category: "banking", exam: "IBPS RRB Clerk" },
  { title: "RRB PO Past Live Tests", category: "banking", exam: "IBPS RRB Officer" },
  { title: "RRB Asst Past Live Tests", category: "banking", exam: "IBPS RRB Assistant" },
  { title: "SBI PO Past Live Tests", category: "banking", exam: "SBI PO" },
  { title: "SBI PO Pre PYP", category: "banking", exam: "SBI PO" },
  { title: "IBPS PO Pre PYP", category: "banking", exam: "IBPS PO" },
  { title: "LIC AAO Pre PYP", category: "regulatory", exam: "LIC AAO" },
  { title: "IBPS RRB Officer Pre PYP", category: "banking", exam: "IBPS RRB Officer" },
  { title: "IBPS RRB Asst. Pre PYP", category: "banking", exam: "IBPS RRB Assistant" },
  { title: "RBI Assistant Pre PYP", category: "regulatory", exam: "RBI Assistant" }
];

const POPULAR_TESTS = [
  { title: "SBI Clerk", category: "banking" },
  { title: "IBPS Clerk", category: "banking" },
  { title: "IBPS RRB Officer", category: "banking" },
  { title: "IBPS RRB Assistant", category: "banking" },
  { title: "SBI PO", category: "banking" },
  { title: "IBPS PO", category: "banking" },
  { title: "IBPS SO", category: "banking" },
  { title: "UIIC AO", category: "regulatory" },
  { title: "NICL Assistant", category: "regulatory" },
  { title: "RBI Assistant", category: "regulatory" }
];

const PASS_FEATURES = [
  { title: "Full mocks", value: "Prelims + Mains", detail: "Real timer, palette, section split" },
  { title: "PYP vault", value: "Past papers", detail: "Previous-year and memory-based practice" },
  { title: "Analytics", value: "AIR + weak areas", detail: "Score, accuracy, percentile, topics" },
  { title: "Re-attempt", value: "Unlimited", detail: "Resume attempts and improve score" }
];

const EXAM_SERIES = [
  {
    id: "sbi-clerk-2026",
    title: "SBI Clerk Complete Test Series 2026",
    category: "banking",
    exam: "SBI Clerk",
    tests: 359,
    freeTests: 5,
    users: "215.8k+",
    languages: "English, Hindi",
    badge: "Trending",
    description: "Prelims, mains, live tests, sectional drills, chapter tests, memory papers, and GA practice.",
    includes: ["25 Prelims mocks", "10 Mains mocks", "Live mega tests", "Memory-based papers", "GA/CA specials"],
    pattern: [
      { section: "English Language", questions: 30, marks: 30, duration: "20 min" },
      { section: "Numerical Ability", questions: 35, marks: 35, duration: "20 min" },
      { section: "Reasoning Ability", questions: 35, marks: 35, duration: "20 min" }
    ]
  },
  {
    id: "ibps-clerk-2026",
    title: "IBPS Clerk Prelims + Mains Pack",
    category: "banking",
    exam: "IBPS Clerk",
    tests: 210,
    freeTests: 6,
    users: "96k+",
    languages: "English, Hindi",
    badge: "Host ready",
    description: "Full mocks, sectional tests, speed drills, and host-published custom mocks.",
    includes: ["20 Prelims mocks", "8 Mains mocks", "Topic drills", "PYP practice", "Solution review"],
    pattern: [
      { section: "English Language", questions: 30, marks: 30, duration: "20 min" },
      { section: "Numerical Ability", questions: 35, marks: 35, duration: "20 min" },
      { section: "Reasoning Ability", questions: 35, marks: 35, duration: "20 min" }
    ]
  },
  {
    id: "rrb-clerk-2026",
    title: "IBPS RRB Clerk Speed Pack",
    category: "banking",
    exam: "IBPS RRB Clerk",
    tests: 160,
    freeTests: 4,
    users: "72k+",
    languages: "English, Hindi",
    badge: "Speed",
    description: "RRB Assistant prelims practice with heavy reasoning and numerical ability coverage.",
    includes: ["20 Prelims mocks", "Friday live tests", "Speed improvement", "Weak-area analysis", "PYP based drills"],
    pattern: [
      { section: "Reasoning", questions: 40, marks: 40, duration: "25 min" },
      { section: "Quantitative Aptitude", questions: 40, marks: 40, duration: "20 min" }
    ]
  }
];

const PROMO_CARDS = [
  {
    title: "Monthly Current Affairs Magazine",
    badge: "New",
    description: "Downloadable current affairs practice set for revision."
  },
  {
    title: "Banking Super Practice: 1000+ Tests",
    badge: "Bundle",
    description: "Includes prelims, mains, PYP, revision tests, and speed drills."
  }
];

const createEmptyQuestion = () => ({
  id: `q_${Date.now()}`,
  section: "Reasoning",
  text: "",
  options: ["", "", "", ""],
  answerIndex: 0,
  solution: ""
});

const createHostForm = () => ({
  title: "",
  exam: "IBPS RRB Officer Scale I",
  category: "banking",
  courseCode: "rrbposecpre",
  stage: "Prelims",
  questions: 40,
  marks: 40,
  durationMinutes: 20,
  language: "English and Hindi",
  level: "Host published",
  free: true,
  sections: "Reasoning, Quantitative Aptitude",
  status: "draft",
  questionSet: []
});

const QUESTION_BANK = [
  {
    id: "r1",
    section: "Reasoning",
    text: "Find the next number in the series: 5, 11, 23, 47, 95, ?",
    options: ["171", "181", "191", "201"],
    answerIndex: 2,
    solution: "Each number is multiplied by 2 and then 1 is added. So 95 x 2 + 1 = 191."
  },
  {
    id: "r2",
    section: "Reasoning",
    text: "If all roses are flowers and some flowers fade quickly, which conclusion definitely follows?",
    options: ["All roses fade quickly", "Some roses fade quickly", "Some flowers are roses", "No rose is a flower"],
    answerIndex: 2,
    solution: "Since all roses are flowers, it is definite that some flowers are roses if roses exist."
  },
  {
    id: "r3",
    section: "Reasoning",
    text: "A is 7th from the left and B is 9th from the right. If they interchange positions, A becomes 15th from the left. How many people are in the row?",
    options: ["21", "22", "23", "24"],
    answerIndex: 2,
    solution: "A takes B's original position: 15th from left and 9th from right. Total = 15 + 9 - 1 = 23."
  },
  {
    id: "r4",
    section: "Reasoning",
    text: "If CLOCK is coded as DMPDL, how will TRAIN be coded?",
    options: ["USBJO", "USCJO", "UQBJM", "SQBHM"],
    answerIndex: 0,
    solution: "Each letter moves one step forward. T-U, R-S, A-B, I-J, N-O."
  },
  {
    id: "r5",
    section: "Reasoning",
    text: "Which pair follows the same relation as Book : Reading?",
    options: ["Pen : Writing", "Chair : Table", "Door : Window", "Water : Bottle"],
    answerIndex: 0,
    solution: "A book is used for reading; a pen is used for writing."
  },
  {
    id: "r6",
    section: "Reasoning",
    text: "Five friends sit in a line. P is left of Q, R is right of Q, and S is right of R. Who is definitely not at the extreme right?",
    options: ["P", "S", "R", "Q"],
    answerIndex: 0,
    solution: "P is left of Q, so P cannot be at the extreme right."
  },
  {
    id: "q1",
    section: "Quantitative Aptitude",
    text: "A sum becomes Rs. 6,720 in 2 years at 10% simple interest. What is the principal?",
    options: ["Rs. 5,200", "Rs. 5,400", "Rs. 5,600", "Rs. 5,800"],
    answerIndex: 2,
    solution: "Amount = P(1 + RT/100) = P(1 + 20/100) = 1.2P. P = 6720 / 1.2 = Rs. 5,600."
  },
  {
    id: "q2",
    section: "Quantitative Aptitude",
    text: "The average of 12 numbers is 18. If one number 30 is removed, what is the new average?",
    options: ["16.90", "16.75", "16.63", "17.09"],
    answerIndex: 0,
    solution: "Total = 12 x 18 = 216. New total = 216 - 30 = 186. New average = 186 / 11 = 16.90."
  },
  {
    id: "q3",
    section: "Quantitative Aptitude",
    text: "A man spends 65% of his income and saves Rs. 10,500. What is his income?",
    options: ["Rs. 25,000", "Rs. 28,000", "Rs. 30,000", "Rs. 32,000"],
    answerIndex: 2,
    solution: "Savings are 35% of income. Income = 10500 / 0.35 = Rs. 30,000."
  },
  {
    id: "q4",
    section: "Quantitative Aptitude",
    text: "A train of length 180 m crosses a pole in 12 seconds. What is its speed in km/h?",
    options: ["45", "48", "54", "60"],
    answerIndex: 2,
    solution: "Speed = 180/12 = 15 m/s. In km/h, 15 x 18/5 = 54 km/h."
  },
  {
    id: "q5",
    section: "Quantitative Aptitude",
    text: "If x:y = 3:5 and y:z = 10:7, then x:z is:",
    options: ["3:7", "6:7", "7:6", "5:7"],
    answerIndex: 1,
    solution: "Make y common: x:y = 6:10 and y:z = 10:7. Therefore x:z = 6:7."
  },
  {
    id: "q6",
    section: "Quantitative Aptitude",
    text: "A shopkeeper marks an article 40% above cost and gives a 10% discount. What is the profit percentage?",
    options: ["24%", "26%", "28%", "30%"],
    answerIndex: 1,
    solution: "Let cost be 100. Marked price = 140. Selling price after 10% discount = 126. Profit = 26%."
  },
  {
    id: "e1",
    section: "English",
    text: "Choose the word that best completes the sentence: The manager asked the team to ___ the report before lunch.",
    options: ["submit", "submits", "submitted", "submitting"],
    answerIndex: 0,
    solution: "The infinitive phrase 'to submit' requires the base form of the verb."
  },
  {
    id: "e2",
    section: "English",
    text: "Choose the correctly spelt word.",
    options: ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
    answerIndex: 2,
    solution: "The correct spelling is 'Accommodate'."
  },
  {
    id: "e3",
    section: "English",
    text: "Identify the synonym of 'brief'.",
    options: ["Lengthy", "Short", "Complex", "Delayed"],
    answerIndex: 1,
    solution: "'Brief' means short or concise."
  },
  {
    id: "e4",
    section: "English",
    text: "Choose the grammatically correct sentence.",
    options: ["She do not agree.", "She does not agree.", "She did not agrees.", "She not agree."],
    answerIndex: 1,
    solution: "With third person singular, use 'does not' followed by the base verb."
  },
  {
    id: "e5",
    section: "English",
    text: "Choose the antonym of 'expand'.",
    options: ["Increase", "Extend", "Contract", "Develop"],
    answerIndex: 2,
    solution: "The antonym of expand is contract."
  },
  {
    id: "e6",
    section: "English",
    text: "Select the phrase that means 'to postpone'.",
    options: ["Call off", "Put off", "Take off", "Set off"],
    answerIndex: 1,
    solution: "'Put off' means to postpone."
  }
];

const SECTION_ALIASES = {
  "Numerical Ability": "Quantitative Aptitude",
  "Reasoning Ability": "Reasoning",
  "English Language": "English",
  "General/Financial Awareness": "General Awareness",
  "Reasoning & Computer Ability": "Reasoning"
};

const SECTION_TOPICS = {
  Reasoning: ["Syllogism", "Puzzle", "Inequality", "Coding-Decoding", "Direction Sense", "Seating Arrangement"],
  "Reasoning Ability": ["Syllogism", "Puzzle", "Inequality", "Coding-Decoding", "Direction Sense", "Seating Arrangement"],
  "Reasoning & Computer Ability": ["Puzzle", "Input Output", "Data Sufficiency", "Computer Basics", "Coding-Decoding"],
  "Quantitative Aptitude": ["Number Series", "Simplification", "Arithmetic", "DI", "Profit & Loss", "Time & Work"],
  "Numerical Ability": ["Number Series", "Simplification", "Arithmetic", "DI", "Profit & Loss", "Time & Work"],
  English: ["Grammar", "Vocabulary", "Error Spotting", "Cloze Test", "Reading Comprehension"],
  "English Language": ["Grammar", "Vocabulary", "Error Spotting", "Cloze Test", "Reading Comprehension"],
  "General Awareness": ["Banking Awareness", "Current Affairs", "Static GK", "Financial Awareness"],
  "General/Financial Awareness": ["Banking Awareness", "Current Affairs", "Static GK", "Financial Awareness"],
  GK: ["Current Affairs", "Static GK", "Economy", "Science"],
  GA: ["Banking Awareness", "Current Affairs", "Static GK", "Financial Awareness"]
};

const getTopicForSection = (section, index) => {
  const topics = SECTION_TOPICS[section] || SECTION_TOPICS[SECTION_ALIASES[section]] || ["General"];
  return topics[index % topics.length];
};

const getDifficultyForIndex = (index) => {
  if (index % 5 === 4) return "Difficult";
  if (index % 3 === 2) return "Moderate";
  return "Easy";
};

const buildQuestionSet = (sections, count, testId, options = {}) => {
  const sectionList = Array.isArray(sections) && sections.length ? sections : ["Reasoning"];
  return Array.from({ length: count }, (_, index) => {
    const section = sectionList[index % sectionList.length];
    const sourceSection = SECTION_ALIASES[section] || section;
    const sectionPool = QUESTION_BANK.filter((question) => question.section === sourceSection);
    const pool = sectionPool.length ? sectionPool : QUESTION_BANK;
    const source = pool[index % pool.length];

    return {
      ...source,
      id: `${testId}_q${index + 1}`,
      section,
      text: `${source.text}`,
      options: [...source.options],
      topic: options.topic || getTopicForSection(section, index),
      difficulty: options.difficulty || getDifficultyForIndex(index),
      marks: Number(options.marksPerQuestion || source.marks || 1),
      negativeMarks: Number(options.negativeMarks ?? source.negativeMarks ?? 0.25)
    };
  });
};

const buildSectionedQuestionSet = (sectionBlueprint, testId) => {
  return sectionBlueprint.flatMap(({ section, count, marksPerQuestion, negativeMarks }) => (
    buildQuestionSet(
      [section],
      count,
      `${testId}_${section.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      {
        marksPerQuestion,
        negativeMarks: negativeMarks ?? Number(marksPerQuestion || 1) * 0.25
      }
    )
  ));
};

const getPypPattern = (exam) => {
  const lowerExam = exam.toLowerCase();
  if (lowerExam.includes("sbi clerk") || lowerExam.includes("ibps clerk")) {
    return {
      questions: 100,
      marks: 100,
      durationMinutes: 60,
      sections: ["English", "Numerical Ability", "Reasoning Ability"]
    };
  }

  if (lowerExam.includes("rrb clerk") || lowerExam.includes("rrb assistant")) {
    return {
      questions: 80,
      marks: 80,
      durationMinutes: 45,
      sections: ["Reasoning", "Quantitative Aptitude"]
    };
  }

  return {
    questions: 50,
    marks: 50,
    durationMinutes: 35,
    sections: ["Reasoning", "Quantitative Aptitude"]
  };
};

const GENERATED_RRB_SECTIONALS = Array.from({ length: 20 }, (_, index) => {
  const setNumber = index + 1;
  const quantId = `rrb-quant-sectional-${setNumber}`;
  const reasoningId = `rrb-reasoning-sectional-${setNumber}`;

  return [
    {
      id: quantId,
      sortOrder: setNumber * 2 - 1,
      category: "banking",
      courseCode: "rrbposecpre",
      seriesTitle: "IBPS RRB PO Prelims Sectional Mock Tests",
      type: "sectional",
      title: `IBPS RRB Quant Sectional - ${setNumber}`,
      exam: "IBPS RRB Officer Scale I",
      stage: "Prelims",
      questions: 40,
      marks: 40,
      durationMinutes: 20,
      language: "English and Hindi",
      level: setNumber <= 5 ? "Foundation speed drill" : setNumber <= 12 ? "Exam level" : "Advanced accuracy drill",
      free: setNumber === 1,
      sections: ["Quantitative Aptitude"],
      negativeMarks: 0.25,
      marksPerQuestion: 1,
      questionSet: buildQuestionSet(["Quantitative Aptitude"], 40, quantId)
    },
    {
      id: reasoningId,
      sortOrder: setNumber * 2,
      category: "banking",
      courseCode: "rrbposecpre",
      seriesTitle: "IBPS RRB PO Prelims Sectional Mock Tests",
      type: "sectional",
      title: `IBPS RRB Reasoning Sectional - ${setNumber}`,
      exam: "IBPS RRB Officer Scale I",
      stage: "Prelims",
      questions: 40,
      marks: 40,
      durationMinutes: 25,
      language: "English and Hindi",
      level: setNumber <= 5 ? "Foundation speed drill" : setNumber <= 12 ? "Exam level" : "Advanced accuracy drill",
      free: setNumber === 1,
      sections: ["Reasoning"],
      negativeMarks: 0.25,
      marksPerQuestion: 1,
      questionSet: buildQuestionSet(["Reasoning"], 40, reasoningId)
    }
  ];
}).flat();

const PYP_TEST_LIBRARY = PYP_EXAMS.map((item, index) => {
  const testId = `pyp-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const pattern = getPypPattern(item.exam);
  return {
    id: testId,
    sortOrder: 100 + index,
    category: item.category,
    courseCode: testId,
    seriesTitle: "Previous Year Practice",
    type: "pyp",
    title: item.title,
    exam: item.exam,
    stage: "PYP",
    questions: pattern.questions,
    marks: pattern.marks,
    durationMinutes: pattern.durationMinutes,
    language: "English and Hindi",
    level: "Previous year pattern",
    free: index < 2,
    sections: pattern.sections,
    negativeMarks: 0.25,
    marksPerQuestion: 1,
    questionSet: buildQuestionSet(pattern.sections, pattern.questions, testId)
  };
});

const IBPS_CLERK_HOST_FULL_MOCK = {
  id: "host-ibps-clerk-full-mock-1",
  sortOrder: 60,
  category: "banking",
  seriesId: "ibps-clerk-2026",
  courseCode: "ibpsclerkpre",
  seriesTitle: "Host Published Full Mock Tests",
  type: "host-full-mock",
  title: "IBPS Clerk Full Mock Test 1",
  exam: "IBPS Clerk",
  stage: "Prelims",
  questions: 100,
  marks: 100,
  durationMinutes: 60,
  language: "English and Hindi",
  level: "Host published full mock",
  free: true,
  sections: ["English", "Numerical Ability", "Reasoning Ability"],
  negativeMarks: 0.25,
  marksPerQuestion: 1,
  attempts: 0,
  source: "host-studio",
  status: "published",
  questionSet: buildSectionedQuestionSet([
    { section: "English", count: 30 },
    { section: "Numerical Ability", count: 35 },
    { section: "Reasoning Ability", count: 35 }
  ], "host_ibps_clerk_full_mock_1")
};

const createMockSeries = ({
  prefix,
  titlePrefix,
  count,
  sortStart,
  seriesId,
  courseCode,
  exam,
  stage,
  durationMinutes,
  level,
  freeCount,
  sectionBlueprint,
  type = "full-mock",
  attemptsBase = 12000
}) => {
  const sections = sectionBlueprint.map((item) => item.section);
  const marks = sectionBlueprint.reduce((total, item) => total + item.count * Number(item.marksPerQuestion || 1), 0);
  const questions = sectionBlueprint.reduce((total, item) => total + item.count, 0);

  return Array.from({ length: count }, (_, index) => {
    const setNumber = index + 1;
    const id = `${prefix}-${setNumber}`;
    return {
      id,
      sortOrder: sortStart + index,
      category: "banking",
      seriesId,
      courseCode,
      seriesTitle: EXAM_SERIES.find((series) => series.id === seriesId)?.title || "Banking Test Series",
      type,
      title: `${titlePrefix} ${setNumber}`,
      exam,
      stage,
      questions,
      marks,
      durationMinutes,
      language: "English and Hindi",
      level: index < 3 ? "Foundation to exam level" : level,
      free: index < freeCount,
      sections,
      negativeMarks: 0.25,
      marksPerQuestion: 1,
      attempts: Math.max(250, attemptsBase - index * 173),
      rankEnabled: true,
      questionSet: buildSectionedQuestionSet(sectionBlueprint, id)
    };
  });
};

const BANKING_SERIES_TESTS = [
  ...createMockSeries({
    prefix: "sbi-clerk-prelims-full",
    titlePrefix: "SBI Clerk Prelims Full Mock Test",
    count: 25,
    sortStart: 10,
    seriesId: "sbi-clerk-2026",
    courseCode: "sbiclerkpre",
    exam: "SBI Clerk",
    stage: "Prelims",
    durationMinutes: 60,
    level: "Latest pattern",
    freeCount: 2,
    attemptsBase: 73900,
    sectionBlueprint: [
      { section: "English Language", count: 30, marksPerQuestion: 1 },
      { section: "Numerical Ability", count: 35, marksPerQuestion: 1 },
      { section: "Reasoning Ability", count: 35, marksPerQuestion: 1 }
    ]
  }),
  ...createMockSeries({
    prefix: "sbi-clerk-mains-full",
    titlePrefix: "SBI Clerk Mains Full Mock Test",
    count: 10,
    sortStart: 36,
    seriesId: "sbi-clerk-2026",
    courseCode: "sbiclerkmains",
    exam: "SBI Clerk",
    stage: "Mains",
    durationMinutes: 160,
    level: "Mains specific",
    freeCount: 1,
    attemptsBase: 28500,
    sectionBlueprint: [
      { section: "English Language", count: 40, marksPerQuestion: 1 },
      { section: "Quantitative Aptitude", count: 50, marksPerQuestion: 1 },
      { section: "Reasoning & Computer Ability", count: 50, marksPerQuestion: 1.2 },
      { section: "General/Financial Awareness", count: 50, marksPerQuestion: 1 }
    ]
  }),
  ...createMockSeries({
    prefix: "ibps-clerk-prelims-full",
    titlePrefix: "IBPS Clerk Prelims Full Mock Test",
    count: 20,
    sortStart: 62,
    seriesId: "ibps-clerk-2026",
    courseCode: "ibpsclerkpre",
    exam: "IBPS Clerk",
    stage: "Prelims",
    durationMinutes: 60,
    level: "Latest pattern",
    freeCount: 2,
    attemptsBase: 42100,
    sectionBlueprint: [
      { section: "English Language", count: 30, marksPerQuestion: 1 },
      { section: "Numerical Ability", count: 35, marksPerQuestion: 1 },
      { section: "Reasoning Ability", count: 35, marksPerQuestion: 1 }
    ]
  }),
  ...createMockSeries({
    prefix: "rrb-clerk-prelims-full",
    titlePrefix: "IBPS RRB Clerk Prelims Full Mock Test",
    count: 20,
    sortStart: 84,
    seriesId: "rrb-clerk-2026",
    courseCode: "rrbclerkpre",
    exam: "IBPS RRB Clerk",
    stage: "Prelims",
    durationMinutes: 45,
    level: "Speed improvement",
    freeCount: 2,
    attemptsBase: 36800,
    sectionBlueprint: [
      { section: "Reasoning", count: 40, marksPerQuestion: 1 },
      { section: "Quantitative Aptitude", count: 40, marksPerQuestion: 1 }
    ]
  })
];

const FALLBACK_TESTS = [
  IBPS_CLERK_HOST_FULL_MOCK,
  ...BANKING_SERIES_TESTS,
  ...GENERATED_RRB_SECTIONALS,
  ...PYP_TEST_LIBRARY,
  {
    id: "rrbposecpre-free-1",
    sortOrder: 1,
    category: "banking",
    courseCode: "rrbposecpre",
    title: "RRB PO Prelims Mock Test 1",
    exam: "IBPS RRB Officer Scale I",
    stage: "Prelims",
    questions: 80,
    marks: 80,
    durationMinutes: 45,
    language: "English and Hindi",
    level: "Latest pattern",
    free: true,
    sections: ["Reasoning", "Quantitative Aptitude"],
    questionSet: QUESTION_BANK
  },
  {
    id: "rrbposecpre-free-2",
    sortOrder: 2,
    category: "banking",
    courseCode: "rrbposecpre",
    title: "RRB PO Prelims Mock Test 2",
    exam: "IBPS RRB Officer Scale I",
    stage: "Prelims",
    questions: 80,
    marks: 80,
    durationMinutes: 45,
    language: "English and Hindi",
    level: "Moderate",
    free: true,
    sections: ["Reasoning", "Quantitative Aptitude"],
    questionSet: QUESTION_BANK
  },
  {
    id: "rrbposecpre-locked-3",
    sortOrder: 3,
    category: "banking",
    courseCode: "rrbposecpre",
    title: "RRB PO Prelims Mock Test 3",
    exam: "IBPS RRB Officer Scale I",
    stage: "Prelims",
    questions: 80,
    marks: 80,
    durationMinutes: 45,
    language: "English and Hindi",
    level: "High accuracy drill",
    free: false,
    sections: ["Reasoning", "Quantitative Aptitude"],
    questionSet: QUESTION_BANK
  },
  {
    id: "rrbposecpre-locked-4",
    sortOrder: 4,
    category: "banking",
    courseCode: "rrbposecpre",
    title: "RRB PO Prelims Mock Test 4",
    exam: "IBPS RRB Officer Scale I",
    stage: "Prelims",
    questions: 80,
    marks: 80,
    durationMinutes: 45,
    language: "English and Hindi",
    level: "Speed challenge",
    free: false,
    sections: ["Reasoning", "Quantitative Aptitude"],
    questionSet: QUESTION_BANK
  },
  {
    id: "ibps-po-prelims",
    sortOrder: 5,
    category: "banking",
    courseCode: "ibpspopre",
    title: "IBPS PO Prelims Sectional Test",
    exam: "IBPS PO",
    stage: "Prelims",
    questions: 100,
    marks: 100,
    durationMinutes: 60,
    language: "English and Hindi",
    level: "Sectional",
    free: true,
    sections: ["Reasoning", "Quantitative Aptitude", "English"],
    questionSet: QUESTION_BANK
  },
  {
    id: "ssc-cgl-tier-1",
    sortOrder: 6,
    category: "ssc",
    courseCode: "ssccgl",
    title: "SSC CGL Tier 1 Mock Test",
    exam: "SSC CGL",
    stage: "Tier 1",
    questions: 100,
    marks: 200,
    durationMinutes: 60,
    language: "English and Hindi",
    level: "Latest pattern",
    free: true,
    sections: ["Reasoning", "Quantitative Aptitude", "English", "GK"],
    questionSet: QUESTION_BANK
  },
  {
    id: "rrb-ntpc-cbt",
    sortOrder: 7,
    category: "railways",
    courseCode: "rrbntpc",
    title: "RRB NTPC CBT Mock Test",
    exam: "RRB NTPC",
    stage: "CBT",
    questions: 100,
    marks: 100,
    durationMinutes: 90,
    language: "English and Hindi",
    level: "Balanced",
    free: true,
    sections: ["Reasoning", "Quantitative Aptitude", "General Awareness"],
    questionSet: QUESTION_BANK
  },
  {
    id: "rbi-grade-b-phase-1",
    sortOrder: 8,
    category: "regulatory",
    courseCode: "rbigradeb",
    title: "RBI Grade B Phase 1 Mock Test",
    exam: "RBI Grade B",
    stage: "Phase 1",
    questions: 200,
    marks: 200,
    durationMinutes: 120,
    language: "English",
    level: "Advanced",
    free: false,
    sections: ["Reasoning", "Quantitative Aptitude", "English", "GA"],
    questionSet: QUESTION_BANK
  }
];

const defaultProfile = {
  name: "",
  email: "",
  mobile: "",
  targetExam: "IBPS RRB Officer Scale I"
};

const normalizeQuestionSet = (test) => {
  const source = Array.isArray(test.questionSet) && test.questionSet.length
    ? test.questionSet
    : Array.isArray(test.demoQuestions) && test.demoQuestions.length
      ? test.demoQuestions
      : QUESTION_BANK;

  return source.map((question, index) => ({
    ...question,
    id: question.id || `${test.id || "test"}_q${index + 1}`,
    section: question.section || "General",
    topic: question.topic || getTopicForSection(question.section || "General", index),
    difficulty: question.difficulty || getDifficultyForIndex(index),
    marks: Number(question.marks || test.marksPerQuestion || 1),
    negativeMarks: Number(question.negativeMarks ?? test.negativeMarks ?? 0.25),
    options: Array.isArray(question.options) && question.options.length ? question.options : ["", "", "", ""],
    answerIndex: Number(question.answerIndex || 0),
    solution: question.solution || "Solution will be updated by the host."
  }));
};

const normalizeTest = (test) => ({
  id: test.id,
  sortOrder: Number(test.sortOrder || 999),
  category: test.category || "banking",
  seriesId: test.seriesId || "",
  courseCode: test.courseCode || test.code || "rrbposecpre",
  seriesTitle: test.seriesTitle || "Mock Test Series",
  type: test.type || "mock",
  title: test.title || "Mock Test",
  exam: test.exam || "Competitive Exam",
  stage: test.stage || "Mock",
  questions: Number(test.questions || test.totalQuestions || 80),
  marks: Number(test.marks || test.totalMarks || 80),
  durationMinutes: Number(test.durationMinutes || test.minutes || 45),
  language: test.language || "English and Hindi",
  level: test.level || test.difficulty || "Exam level",
  free: test.free !== false && test.locked !== true,
  sections: Array.isArray(test.sections) && test.sections.length
    ? test.sections
    : typeof test.sections === "string" && test.sections.trim()
      ? test.sections.split(",").map((section) => section.trim()).filter(Boolean)
      : ["Reasoning", "Quantitative Aptitude"],
  negativeMarks: Number(test.negativeMarks ?? test.negative ?? 0.25),
  marksPerQuestion: Number(test.marksPerQuestion || 1),
  attempts: Number(test.attempts || 0),
  rankEnabled: test.rankEnabled !== false,
  status: test.status || "published",
  source: test.source || "catalog",
  questionSet: normalizeQuestionSet(test)
});

const loadJson = (key, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const saveJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = String(safeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
};

const getQuestionState = (questionId, answers, markedForReview, visited) => {
  const hasAnswer = answers[questionId] !== undefined;
  const marked = markedForReview.includes(questionId);
  if (hasAnswer && marked) return "answered-review";
  if (marked) return "review";
  if (hasAnswer) return "answered";
  if (visited.includes(questionId)) return "not-answered";
  return "not-visited";
};

const getAttemptCounts = (test, answers, markedForReview, visited) => {
  return test.questionSet.reduce((counts, question) => {
    const state = getQuestionState(question.id, answers, markedForReview, visited);
    counts[state] += 1;
    return counts;
  }, {
    answered: 0,
    "answered-review": 0,
    review: 0,
    "not-answered": 0,
    "not-visited": 0
  });
};

const getSummary = (test, answers, markedForReview, timeSpentSeconds) => {
  const sectionMap = {};
  const topicMap = {};
  let correct = 0;
  let wrong = 0;
  let scoredMarks = 0;
  let maxScoreFromQuestions = 0;

  test.questionSet.forEach((question) => {
    const section = question.section || "General";
    const topic = question.topic || getTopicForSection(section, 0);
    const questionMarks = Number(question.marks || test.marksPerQuestion || 1);
    const questionNegative = Number(question.negativeMarks ?? test.negativeMarks ?? questionMarks * 0.25);
    maxScoreFromQuestions += questionMarks;
    if (!sectionMap[section]) {
      sectionMap[section] = { section, total: 0, attempted: 0, correct: 0, wrong: 0, score: 0, maxScore: 0 };
    }
    if (!topicMap[topic]) {
      topicMap[topic] = { topic, section, total: 0, attempted: 0, correct: 0, wrong: 0, score: 0 };
    }

    sectionMap[section].total += 1;
    sectionMap[section].maxScore += questionMarks;
    topicMap[topic].total += 1;

    if (answers[question.id] !== undefined) {
      sectionMap[section].attempted += 1;
      topicMap[topic].attempted += 1;
      if (answers[question.id] === question.answerIndex) {
        correct += 1;
        sectionMap[section].correct += 1;
        sectionMap[section].score += questionMarks;
        topicMap[topic].correct += 1;
        topicMap[topic].score += questionMarks;
        scoredMarks += questionMarks;
      } else {
        wrong += 1;
        sectionMap[section].wrong += 1;
        sectionMap[section].score -= questionNegative;
        topicMap[topic].wrong += 1;
        topicMap[topic].score -= questionNegative;
        scoredMarks -= questionNegative;
      }
    }
  });

  const total = test.questionSet.length;
  const attempted = Object.keys(answers).length;
  const maxScore = Number(test.marks || maxScoreFromQuestions || total);
  const score = Number(scoredMarks.toFixed(2));
  const scorePercent = maxScore ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const percentile = Math.min(99.9, Math.max(35, Number((45 + scorePercent * 0.52).toFixed(1))));
  const rank = Math.max(1, Math.round(9500 - percentile * 83 + wrong * 17));
  const sections = Object.values(sectionMap).map((section) => {
    const sectionAccuracy = section.attempted ? Math.round((section.correct / section.attempted) * 100) : 0;
    const timeShare = total ? section.total / total : 0;
    return {
      ...section,
      score: Number(section.score.toFixed(2)),
      accuracy: sectionAccuracy,
      timeSpentSeconds: Math.round(timeSpentSeconds * timeShare),
      avgTimeSeconds: section.attempted ? Math.round((timeSpentSeconds * timeShare) / section.attempted) : 0
    };
  });
  const topics = Object.values(topicMap)
    .map((topic) => ({
      ...topic,
      score: Number(topic.score.toFixed(2)),
      accuracy: topic.attempted ? Math.round((topic.correct / topic.attempted) * 100) : 0,
      strength: topic.attempted && topic.correct / topic.attempted >= 0.75
        ? "Strong"
        : topic.attempted && topic.correct / topic.attempted >= 0.5
          ? "Needs polish"
          : "Weak"
    }))
    .sort((first, second) => first.accuracy - second.accuracy || second.total - first.total);
  const weakSections = sections
    .filter((section) => section.total && section.correct / section.total < 0.5)
    .map((section) => section.section);
  const weakTopics = topics.filter((topic) => topic.strength === "Weak").slice(0, 5).map((topic) => topic.topic);
  const topperScore = Math.min(maxScore, Math.round(maxScore * 0.88));
  const topperTimeSeconds = Math.max(1, Math.round(Number(test.durationMinutes || 60) * 60 * 0.72));
  const speedIndex = timeSpentSeconds ? Math.min(100, Math.round((attempted / Math.max(1, timeSpentSeconds / 60)) * 22)) : 0;
  const recommendations = [
    weakTopics.length ? `Revise ${weakTopics.slice(0, 2).join(" and ")} before your next mock.` : "Maintain balanced topic coverage and push speed with sectional drills.",
    accuracy < 75 ? "Attempt fewer guesses until accuracy crosses 75%." : "Accuracy is strong; increase attempt count in the next mock.",
    scorePercent < 60 ? "Take one full mock and one weak-area sectional today." : "Move to mains-level or high difficulty practice next."
  ];

  return {
    correct,
    wrong,
    unattempted: total - attempted,
    total,
    attempted,
    markedForReview: markedForReview.length,
    score,
    maxScore,
    scorePercent,
    accuracy,
    percentile,
    rank,
    topperScore,
    topperTimeSeconds,
    scoreGap: Number(Math.max(0, topperScore - score).toFixed(2)),
    speedIndex,
    timeSpentSeconds,
    avgTimeSeconds: attempted ? Math.round(timeSpentSeconds / attempted) : 0,
    weakSections,
    weakTopics,
    recommendations,
    sections,
    topics
  };
};

const getAttemptSummary = (attempt) => {
  const summary = attempt?.summary || {};
  const score = summary.score ?? attempt?.score ?? 0;
  const maxScore = summary.maxScore ?? attempt?.maxScore ?? attempt?.total ?? 0;
  const accuracy = summary.accuracy ?? attempt?.accuracy ?? 0;

  return { score, maxScore, accuracy };
};

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const downloadFile = (filename, content, type = "application/json") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function DonutChart({ value, label }) {
  const percent = clampPercent(value);
  const degrees = percent * 3.6;

  return (
    <div className="donut-chart" style={{ "--chart-value": `${degrees}deg` }}>
      <div>
        <strong>{Math.round(percent)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function BarChart({ data, maxValue }) {
  const max = Math.max(1, maxValue || Math.max(...data.map((item) => Number(item.value) || 0), 1));

  return (
    <div className="bar-chart">
      {data.map((item) => {
        const width = clampPercent(((Number(item.value) || 0) / max) * 100);
        return (
          <div className="bar-row" key={item.label}>
            <span>{item.label}</span>
            <div><i style={{ width: `${width}%` }} /></div>
            <strong>{item.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [isExamWindow] = useState(() => new URLSearchParams(window.location.search).get("mode") === "exam");
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [tests, setTests] = useState(FALLBACK_TESTS);
  const [hostTests, setHostTests] = useState(() => loadJson(LOCAL_HOST_TESTS_KEY, []));
  const [profile, setProfile] = useState(() => loadJson(LOCAL_PROFILE_KEY, null));
  const [profileForm, setProfileForm] = useState(() => loadJson(LOCAL_PROFILE_KEY, defaultProfile) || defaultProfile);
  const [attemptHistory, setAttemptHistory] = useState(() => loadJson(LOCAL_ATTEMPTS_KEY, []));
  const [unlockedTests, setUnlockedTests] = useState(() => loadJson(LOCAL_UNLOCKS_KEY, []));
  const [bookmarkedTests, setBookmarkedTests] = useState(() => loadJson(LOCAL_BOOKMARKS_KEY, []));
  const [liveEnrollments, setLiveEnrollments] = useState(() => loadJson(LOCAL_LIVE_ENROLLMENTS_KEY, []));
  const [testProgress, setTestProgress] = useState(() => loadJson(LOCAL_PROGRESS_KEY, {}));
  const [activeCategory, setActiveCategory] = useState("banking");
  const [selectedSeriesId, setSelectedSeriesId] = useState("all");
  const [activeNav, setActiveNav] = useState("Tests");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("recommended");
  const [showAllTests, setShowAllTests] = useState(false);
  const [notice, setNotice] = useState(hasFirebaseConfig ? "Firebase ready" : "Local demo mode");
  const [loginOpen, setLoginOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [workspace, setWorkspace] = useState("catalog");
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState([]);
  const [visited, setVisited] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("All");
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [languageMode, setLanguageMode] = useState("English");
  const [fontScale, setFontScale] = useState("normal");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [unlockTest, setUnlockTest] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [hostAccessCode, setHostAccessCode] = useState("");
  const [hostMode, setHostMode] = useState(false);
  const [hostForm, setHostForm] = useState(createHostForm);
  const [questionDraft, setQuestionDraft] = useState(createEmptyQuestion);
  const [bulkQuestionText, setBulkQuestionText] = useState("");

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, setFirebaseUser);
  }, []);

  useEffect(() => {
    if (!db) return undefined;
    const testsQuery = query(collection(db, "examTests"), orderBy("sortOrder", "asc"));
    return onSnapshot(
      testsQuery,
      (snapshot) => {
        const remoteTests = snapshot.docs.map((item) => normalizeTest({ id: item.id, ...item.data() }));
        setTests(remoteTests.length ? remoteTests : FALLBACK_TESTS);
        setNotice(remoteTests.length ? "Live Firebase test library" : "Firebase connected, demo tests loaded");
      },
      (error) => {
        console.error("Could not read exam tests:", error);
        setTests(FALLBACK_TESTS);
        setNotice("Demo tests loaded");
      }
    );
  }, []);

  const activeIdentity = firebaseUser || profile;
  const isLoggedIn = Boolean(activeIdentity);
  const allTests = useMemo(() => [...tests, ...hostTests].map(normalizeTest), [hostTests, tests]);
  const publishedHostTests = useMemo(() => {
    const localIds = new Set(hostTests.map((test) => test.id));
    return [
      normalizeTest(IBPS_CLERK_HOST_FULL_MOCK),
      ...hostTests.filter((test) => !localIds.has(IBPS_CLERK_HOST_FULL_MOCK.id) || test.id !== IBPS_CLERK_HOST_FULL_MOCK.id).map(normalizeTest)
    ];
  }, [hostTests]);

  const visibleTests = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const filtered = allTests
      .filter((test) => test.category === activeCategory)
      .filter((test) => selectedSeriesId === "all" || test.seriesId === selectedSeriesId)
      .filter((test) => {
        if (!search) return true;
        return [test.title, test.exam, test.stage, test.courseCode, test.sections.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(search);
      });

    return [...filtered].sort((first, second) => {
      if (sortMode === "free") return Number(second.free) - Number(first.free) || first.sortOrder - second.sortOrder;
      if (sortMode === "duration") return first.durationMinutes - second.durationMinutes;
      if (sortMode === "bookmarked") return Number(bookmarkedTests.includes(second.id)) - Number(bookmarkedTests.includes(first.id)) || first.sortOrder - second.sortOrder;
      return first.sortOrder - second.sortOrder;
    });
  }, [activeCategory, allTests, bookmarkedTests, searchQuery, selectedSeriesId, sortMode]);

  const displayedTests = showAllTests ? visibleTests : visibleTests.slice(0, 10);
  const activeCourse = COURSE_CATALOG.find((course) => course.category === activeCategory) || COURSE_CATALOG[0];
  const categorySeries = EXAM_SERIES.filter((series) => series.category === activeCategory);
  const selectedSeries = categorySeries.find((series) => series.id === selectedSeriesId) || null;
  const dashboardStats = useMemo(() => {
    const attempted = attemptHistory.length;
    const bestScore = attemptHistory.reduce((best, attempt) => Math.max(best, Number(getAttemptSummary(attempt).score) || 0), 0);
    const unlocked = allTests.filter((test) => test.free || unlockedTests.includes(test.id)).length;
    return {
      attempted,
      bestScore,
      unlocked,
      bookmarks: bookmarkedTests.length,
      live: liveEnrollments.length
    };
  }, [allTests, attemptHistory, bookmarkedTests.length, liveEnrollments.length, unlockedTests]);

  const currentQuestion = selectedTest?.questionSet?.[questionIndex];
  const filteredQuestionIndexes = useMemo(() => {
    if (!selectedTest) return [];
    return selectedTest.questionSet
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => activeSection === "All" || question.section === activeSection)
      .map(({ index }) => index);
  }, [activeSection, selectedTest]);
  const category = CATEGORIES.find((item) => item.id === activeCategory);
  const counts = selectedTest ? getAttemptCounts(selectedTest, answers, markedForReview, visited) : null;

  useEffect(() => {
    if (!isExamWindow || !allTests.length) return;
    const params = new URLSearchParams(window.location.search);
    const testId = params.get("testId");
    if (!testId || selectedTest?.id === testId) return;
    const requestedTest = allTests.find((test) => test.id === testId);
    if (!requestedTest) return;

    setSelectedTest(requestedTest);
    setWorkspace("instructions");
    setActiveCategory(requestedTest.category);
    setNotice("Exam window ready.");
  }, [allTests, isExamWindow, selectedTest?.id]);

  const ensureLogin = () => {
    if (isLoggedIn) return true;
    setLoginOpen(true);
    setNotice("Login or create a free profile before attempting a test.");
    return false;
  };

  const handleNavigation = (item) => {
    setActiveNav(item);
    const targetMap = {
      Dashboard: "dashboard",
      Courses: "dashboard",
      Tests: "tests",
      PYPs: "pyp",
      Mentorship: "dashboard",
      Bookmarks: "tests",
      Subscription: "tests",
      Videos: "dashboard",
      "Current Affairs": "dashboard",
      "Success Stories": "history"
    };

    if (item === "Bookmarks") setSortMode("bookmarked");
    document.getElementById(targetMap[item] || "tests")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleBookmark = (testId) => {
    const nextBookmarks = bookmarkedTests.includes(testId)
      ? bookmarkedTests.filter((id) => id !== testId)
      : [...bookmarkedTests, testId];

    setBookmarkedTests(nextBookmarks);
    saveJson(LOCAL_BOOKMARKS_KEY, nextBookmarks);
    setNotice(nextBookmarks.includes(testId) ? "Test bookmarked." : "Bookmark removed.");
  };

  const toggleLiveEnrollment = (liveTestId) => {
    const nextEnrollments = liveEnrollments.includes(liveTestId)
      ? liveEnrollments.filter((id) => id !== liveTestId)
      : [...liveEnrollments, liveTestId];

    setLiveEnrollments(nextEnrollments);
    saveJson(LOCAL_LIVE_ENROLLMENTS_KEY, nextEnrollments);
    setNotice(nextEnrollments.includes(liveTestId) ? "Live test reminder added." : "Live test reminder removed.");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim() || !profileForm.mobile.trim()) {
      setNotice("Name, email, and mobile are required.");
      return;
    }

    const savedProfile = {
      ...profileForm,
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      mobile: profileForm.mobile.trim(),
      profileType: "local",
      createdAt: new Date().toISOString()
    };

    setProfile(savedProfile);
    saveJson(LOCAL_PROFILE_KEY, savedProfile);
    setLoginOpen(false);
    setNotice("Profile saved. You can attempt free tests now.");

    try {
      if (db) {
        await addDoc(collection(db, "examLeads"), {
          ...savedProfile,
          source: "prepboard-login",
          createdBy: firebaseUser?.uid || null,
          createdByEmail: firebaseUser?.email || savedProfile.email,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Could not save profile to Firestore:", error);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      setNotice("Add Firebase env values to enable Google login. Local profile works now.");
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
      setLoginOpen(false);
      setNotice("Google login complete.");
    } catch (error) {
      console.error("Google login failed:", error);
      setNotice("Google login was not completed.");
    }
  };

  const handleLogout = async () => {
    if (auth && firebaseUser) await signOut(auth);
    setProfile(null);
    saveJson(LOCAL_PROFILE_KEY, null);
    setNotice("Logged out.");
  };

  useEffect(() => {
    setShowAllTests(false);
  }, [activeCategory, searchQuery, selectedSeriesId]);

  useEffect(() => {
    const seriesStillVisible = EXAM_SERIES.some((series) => series.category === activeCategory && series.id === selectedSeriesId);
    if (selectedSeriesId !== "all" && !seriesStillVisible) {
      setSelectedSeriesId("all");
    }
  }, [activeCategory, selectedSeriesId]);

  const openTest = (test) => {
    if (!ensureLogin()) return;
    const unlocked = test.free || unlockedTests.includes(test.id);
    if (!unlocked) {
      setUnlockTest(test);
      setCoupon("");
      return;
    }

    setSelectedTest(test);
    setWorkspace("instructions");
    setResult(null);
    setNotice("");
    window.setTimeout(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const openTestInWindow = (test) => {
    if (!ensureLogin()) return;
    const unlocked = test.free || unlockedTests.includes(test.id);
    if (!unlocked) {
      setUnlockTest(test);
      setCoupon("");
      return;
    }

    const params = new URLSearchParams({ mode: "exam", testId: test.id });
    const examUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const newWindow = window.open(examUrl, "_blank", "noopener,noreferrer,width=1280,height=860");
    if (!newWindow) {
      setNotice("Popup was blocked. Opening the test in the current window.");
      openTest(test);
      return;
    }
    setNotice(`${test.title} opened in a dedicated exam window.`);
  };

  const applyCoupon = () => {
    if (!unlockTest) return;
    if (coupon.trim().toUpperCase() !== FREE_UNLOCK_CODE) {
      setNotice(`Use demo unlock code ${FREE_UNLOCK_CODE} to unlock this test locally.`);
      return;
    }

    const nextUnlocks = [...new Set([...unlockedTests, unlockTest.id])];
    setUnlockedTests(nextUnlocks);
    saveJson(LOCAL_UNLOCKS_KEY, nextUnlocks);
    setNotice(`${unlockTest.title} unlocked locally.`);
    setUnlockTest(null);
    setCoupon("");
  };

  const unlockHostStudio = () => {
    const isFirebaseHost = HOST_EMAILS.includes(firebaseUser?.email || "");
    if (isFirebaseHost || hostAccessCode.trim().toUpperCase() === HOST_ACCESS_CODE) {
      setHostMode(true);
      setNotice("Host Studio unlocked. You can create and publish tests manually.");
      return;
    }

    setNotice(`Use demo host code ${HOST_ACCESS_CODE}, or configure Firebase auth for real host access.`);
  };

  const updateQuestionOption = (optionIndex, value) => {
    setQuestionDraft((current) => ({
      ...current,
      options: current.options.map((option, index) => index === optionIndex ? value : option)
    }));
  };

  const addQuestionOption = () => {
    setQuestionDraft((current) => ({
      ...current,
      options: current.options.length >= 6 ? current.options : [...current.options, ""]
    }));
  };

  const removeQuestionOption = (optionIndex) => {
    setQuestionDraft((current) => {
      if (current.options.length <= 2) return current;
      const nextOptions = current.options.filter((_, index) => index !== optionIndex);
      return {
        ...current,
        options: nextOptions,
        answerIndex: Math.min(current.answerIndex, nextOptions.length - 1)
      };
    });
  };

  const addQuestionToHostForm = () => {
    const cleanQuestion = {
      ...questionDraft,
      id: `host_q_${Date.now()}`,
      text: questionDraft.text.trim(),
      section: questionDraft.section.trim() || "General",
      options: questionDraft.options.map((option) => option.trim()),
      solution: questionDraft.solution.trim()
    };

    if (!cleanQuestion.text || cleanQuestion.options.length < 2 || cleanQuestion.options.some((option) => !option)) {
      setNotice("Question text and at least two filled options are required.");
      return;
    }

    setHostForm((current) => ({
      ...current,
      questionSet: [...current.questionSet, cleanQuestion],
      questions: Math.max(Number(current.questions) || 0, current.questionSet.length + 1),
      marks: Math.max(Number(current.marks) || 0, current.questionSet.length + 1)
    }));
    setQuestionDraft(createEmptyQuestion());
  };

  const importBulkQuestions = () => {
    const lines = bulkQuestionText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      setNotice("Paste at least one question line before importing.");
      return;
    }

    const parsedQuestions = lines.map((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      const [section, text, ...rest] = parts;
      const solution = rest.length > 0 ? rest[rest.length - 1] : "";
      const answerRaw = rest.length > 1 ? rest[rest.length - 2] : "1";
      const optionParts = rest.slice(0, Math.max(0, rest.length - 2));
      const answerIndex = Math.max(0, Math.min(optionParts.length - 1, Number(answerRaw) - 1 || 0));

      return {
        id: `bulk_q_${Date.now()}_${index}`,
        section: section || "General",
        text: text || "",
        options: optionParts,
        answerIndex,
        solution
      };
    }).filter((question) => question.text && question.options.length >= 2 && question.options.every(Boolean));

    if (!parsedQuestions.length) {
      setNotice("Bulk format invalid. Use: Section | Question | Option A | Option B | Option C | Option D | Correct number | Solution");
      return;
    }

    setHostForm((current) => ({
      ...current,
      questionSet: [...current.questionSet, ...parsedQuestions],
      questions: Math.max(Number(current.questions) || 0, current.questionSet.length + parsedQuestions.length),
      marks: Math.max(Number(current.marks) || 0, current.questionSet.length + parsedQuestions.length)
    }));
    setBulkQuestionText("");
    setNotice(`${parsedQuestions.length} manual question${parsedQuestions.length > 1 ? "s" : ""} imported.`);
  };

  const removeHostQuestion = (questionId) => {
    setHostForm((current) => ({
      ...current,
      questionSet: current.questionSet.filter((question) => question.id !== questionId)
    }));
  };

  const saveHostTest = async (publishNow = true) => {
    if (!hostMode) {
      setNotice("Unlock Host Studio before saving tests.");
      return;
    }

    if (!hostForm.title.trim() || hostForm.questionSet.length === 0) {
      setNotice("Add a test title and at least one question.");
      return;
    }

    const questionCount = hostForm.questionSet.length;
    const hostTest = normalizeTest({
      ...hostForm,
      id: `host_${Date.now()}`,
      title: hostForm.title.trim(),
      exam: hostForm.exam.trim() || "Host Exam",
      courseCode: hostForm.courseCode.trim() || "host",
      sections: hostForm.sections.split(",").map((section) => section.trim()).filter(Boolean),
      questions: questionCount,
      marks: Number(hostForm.marks) || questionCount,
      durationMinutes: Number(hostForm.durationMinutes) || 20,
      free: Boolean(hostForm.free),
      status: publishNow ? "published" : "draft",
      source: "host-studio",
      createdAtText: new Date().toLocaleString()
    });

    const nextHostTests = publishNow ? [hostTest, ...hostTests] : hostTests;
    if (publishNow) {
      setHostTests(nextHostTests);
      saveJson(LOCAL_HOST_TESTS_KEY, nextHostTests);
    }

    try {
      if (db && publishNow) {
        await addDoc(collection(db, "examTests"), {
          ...hostTest,
          createdBy: firebaseUser?.uid || null,
          createdByEmail: firebaseUser?.email || null,
          createdAt: serverTimestamp()
        });
        setNotice("Host test published locally and saved to Firebase.");
      } else if (publishNow) {
        setNotice("Host test published locally.");
      } else {
        setNotice("Draft kept in Host Studio.");
      }
    } catch (error) {
      console.error("Could not save host test to Firebase:", error);
      setNotice("Host test published locally. Firebase save was blocked.");
    }

    if (publishNow) {
      setHostForm(createHostForm());
      setQuestionDraft(createEmptyQuestion());
    }
  };

  const previewHostTest = () => {
    if (!hostForm.title.trim() || hostForm.questionSet.length === 0) {
      setNotice("Add a test title and at least one question before preview.");
      return;
    }

    const previewTest = normalizeTest({
      ...hostForm,
      id: "host_preview",
      title: `${hostForm.title.trim()} Preview`,
      exam: hostForm.exam.trim() || "Host Exam",
      courseCode: hostForm.courseCode.trim() || "host",
      sections: hostForm.sections.split(",").map((section) => section.trim()).filter(Boolean),
      questions: hostForm.questionSet.length,
      marks: Number(hostForm.marks) || hostForm.questionSet.length,
      durationMinutes: Number(hostForm.durationMinutes) || 20,
      free: true,
      type: "host-preview",
      questionSet: hostForm.questionSet
    });

    setSelectedTest(previewTest);
    setWorkspace("instructions");
    setNotice("Preview opened. Publish from Host Studio when ready.");
    window.setTimeout(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const deleteHostTest = (testId) => {
    const nextHostTests = hostTests.filter((test) => test.id !== testId);
    setHostTests(nextHostTests);
    saveJson(LOCAL_HOST_TESTS_KEY, nextHostTests);
    setNotice("Host test deleted locally.");
  };

  const uploadHostTests = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        const incoming = Array.isArray(parsed) ? parsed : [parsed];
        const uploadedTests = incoming
          .filter((item) => item && typeof item === "object")
          .map((item, index) => normalizeTest({
            ...item,
            id: item.id || `upload_${Date.now()}_${index}`,
            title: item.title || `Uploaded Test ${index + 1}`,
            source: "json-upload",
            status: "published"
          }));

        if (!uploadedTests.length) {
          setNotice("Upload did not contain any valid test objects.");
          return;
        }

        const nextHostTests = [...uploadedTests, ...hostTests];
        setHostTests(nextHostTests);
        saveJson(LOCAL_HOST_TESTS_KEY, nextHostTests);
        setNotice(`${uploadedTests.length} uploaded test${uploadedTests.length > 1 ? "s" : ""} added locally.`);
      } catch (error) {
        console.error("Could not import tests:", error);
        setNotice("Upload failed. Please use a valid JSON test file.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const exportCurrentResult = (format) => {
    if (!selectedTest || !result) return;
    const payload = {
      test: {
        id: selectedTest.id,
        title: selectedTest.title,
        exam: selectedTest.exam
      },
      result,
      answers,
      exportedAt: new Date().toISOString()
    };

    if (format === "csv") {
      const rows = [
        ["Metric", "Value"],
        ["Score", result.score],
        ["Max Score", result.maxScore],
        ["Accuracy", result.accuracy],
        ["Percentile", result.percentile],
        ["Rank", result.rank],
        ["Correct", result.correct],
        ["Wrong", result.wrong],
        ["Unattempted", result.unattempted]
      ];
      downloadFile(`${selectedTest.id}-result.csv`, rows.map((row) => row.join(",")).join("\n"), "text/csv");
      return;
    }

    downloadFile(`${selectedTest.id}-result.json`, JSON.stringify(payload, null, 2));
  };

  const exportAttempts = () => {
    downloadFile("prepboard-attempt-history.json", JSON.stringify(attemptHistory, null, 2));
  };

  const beginTest = (resume = false) => {
    if (!selectedTest) return;
    const savedProgress = testProgress[selectedTest.id];
    if (resume && savedProgress) {
      setAnswers(savedProgress.answers || {});
      setMarkedForReview(savedProgress.markedForReview || []);
      setVisited(savedProgress.visited || []);
      setQuestionIndex(Number(savedProgress.questionIndex || 0));
      setActiveSection(savedProgress.activeSection || "All");
      setTimeLeft(Number(savedProgress.timeLeft || selectedTest.durationMinutes * 60));
      setStartedAt(Date.now() - Number(savedProgress.elapsedSeconds || 0) * 1000);
      setResult(null);
      setSubmitOpen(false);
      setWorkspace("runner");
      setNotice("Resumed saved attempt.");
      return;
    }

    const firstQuestionId = selectedTest.questionSet[0]?.id;
    setAnswers({});
    setMarkedForReview([]);
    setVisited(firstQuestionId ? [firstQuestionId] : []);
    setQuestionIndex(0);
    setActiveSection("All");
    setTimeLeft(selectedTest.durationMinutes * 60);
    setStartedAt(Date.now());
    setResult(null);
    setSubmitOpen(false);
    setWorkspace("runner");
  };

  const visitQuestion = (nextIndex) => {
    if (!selectedTest) return;
    const nextQuestion = selectedTest.questionSet[nextIndex];
    if (!nextQuestion) return;
    setQuestionIndex(nextIndex);
    setVisited((current) => current.includes(nextQuestion.id) ? current : [...current, nextQuestion.id]);
  };

  const goToNextQuestion = () => {
    if (!selectedTest) return;
    const currentPosition = filteredQuestionIndexes.indexOf(questionIndex);
    const nextIndex = filteredQuestionIndexes[currentPosition + 1] ?? questionIndex + 1;
    visitQuestion(Math.min(nextIndex, selectedTest.questionSet.length - 1));
  };

  const markReviewAndNext = () => {
    if (!currentQuestion) return;
    setMarkedForReview((current) => current.includes(currentQuestion.id) ? current : [...current, currentQuestion.id]);
    goToNextQuestion();
  };

  const clearResponse = () => {
    if (!currentQuestion) return;
    setAnswers((current) => {
      const next = { ...current };
      delete next[currentQuestion.id];
      return next;
    });
    setMarkedForReview((current) => current.filter((id) => id !== currentQuestion.id));
  };

  const submitAttempt = useCallback(async (mode = "manual") => {
    if (!selectedTest || result) return;
    const timeSpentSeconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const summary = getSummary(selectedTest, answers, markedForReview, timeSpentSeconds);
    const identity = firebaseUser || profile || {};
    const attempt = {
      id: `${selectedTest.id}_${Date.now()}`,
      testId: selectedTest.id,
      testTitle: selectedTest.title,
      exam: selectedTest.exam,
      category: selectedTest.category,
      answers,
      markedForReview,
      mode,
      studentName: identity.displayName || identity.name || "",
      studentEmail: identity.email || "",
      createdBy: firebaseUser?.uid || null,
      createdAtText: new Date().toLocaleString(),
      summary
    };

    setResult(summary);
    setWorkspace("result");
    setSubmitOpen(false);

    const nextHistory = [attempt, ...attemptHistory].slice(0, 20);
    setAttemptHistory(nextHistory);
    saveJson(LOCAL_ATTEMPTS_KEY, nextHistory);

    const nextProgress = { ...testProgress };
    delete nextProgress[selectedTest.id];
    setTestProgress(nextProgress);
    saveJson(LOCAL_PROGRESS_KEY, nextProgress);

    try {
      if (db) {
        await addDoc(collection(db, "examAttempts"), {
          ...attempt,
          createdAt: serverTimestamp()
        });
        setNotice("Attempt saved with full analysis.");
      } else {
        setNotice("Attempt saved locally.");
      }
    } catch (error) {
      console.error("Could not save attempt:", error);
      setNotice("Result calculated and saved locally. Check Firestore rules for cloud saving.");
    }
  }, [answers, attemptHistory, firebaseUser, markedForReview, profile, result, selectedTest, startedAt, testProgress]);

  useEffect(() => {
    if (workspace !== "runner" || !selectedTest || result || !startedAt) return;
    const progress = {
      testId: selectedTest.id,
      testTitle: selectedTest.title,
      answers,
      markedForReview,
      visited,
      questionIndex,
      activeSection,
      timeLeft,
      elapsedSeconds: Math.max(0, Math.round((Date.now() - startedAt) / 1000)),
      updatedAtText: new Date().toLocaleString()
    };
    const nextProgress = { ...testProgress, [selectedTest.id]: progress };
    setTestProgress(nextProgress);
    saveJson(LOCAL_PROGRESS_KEY, nextProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, markedForReview, visited, questionIndex, activeSection, timeLeft, workspace, selectedTest?.id, result]);

  useEffect(() => {
    if (workspace !== "runner" || !selectedTest || result) return undefined;
    if (timeLeft <= 0) {
      submitAttempt("auto-submit");
      return undefined;
    }
    const timer = window.setTimeout(() => setTimeLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [result, selectedTest, submitAttempt, timeLeft, workspace]);

  const renderWorkspace = () => {
    if (!selectedTest) {
      return (
        <section id="workspace" className="workspace empty-workspace">
          <ClipboardList size={34} />
          <strong>Select a test to begin</strong>
          <span>Choose a free or unlocked RRB PO Prelims test from the list.</span>
        </section>
      );
    }

    if (workspace === "instructions") {
      const savedProgress = testProgress[selectedTest.id];
      return (
        <section id="workspace" className="workspace instructions-panel">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">Instructions</span>
              <h2>{selectedTest.title}</h2>
              <p>Read the test rules before starting. The timer begins immediately after you start.</p>
            </div>
            <div className="workspace-actions">
              {savedProgress && (
                <button type="button" className="secondary-button" onClick={() => beginTest(true)}>
                  <RotateCcw size={16} /> Resume
                </button>
              )}
              <button type="button" className="primary-button" onClick={() => beginTest(false)}>
                <Play size={16} /> Start Test
              </button>
            </div>
          </div>
          <div className="instruction-grid">
            <div><strong>{selectedTest.questions}</strong><span>Questions</span></div>
            <div><strong>{selectedTest.marks}</strong><span>Marks</span></div>
            <div><strong>{selectedTest.durationMinutes} min</strong><span>Duration</span></div>
            <div><strong>-{selectedTest.negativeMarks}</strong><span>Negative marking</span></div>
          </div>
          <div className="section-rule-grid">
            {selectedTest.sections.map((section) => {
              const sectionQuestions = selectedTest.questionSet.filter((question) => question.section === section);
              const sectionMarks = sectionQuestions.reduce((total, question) => total + Number(question.marks || selectedTest.marksPerQuestion || 1), 0);
              return (
                <div key={section}>
                  <strong>{section}</strong>
                  <span>{sectionQuestions.length} questions</span>
                  <span>{Number(sectionMarks.toFixed(2))} marks</span>
                </div>
              );
            })}
          </div>
          <ul className="rules-list">
            <li>This is a {selectedTest.type} test for {selectedTest.exam}.</li>
            <li>Each question has one correct answer and carries {selectedTest.marksPerQuestion} mark.</li>
            <li>Use Save & Next after selecting an answer.</li>
            <li>Use Mark for Review to revisit a question before submitting.</li>
            <li>You can switch sections using the section chips.</li>
            <li>Your progress is saved locally while the timer is running.</li>
            <li>Submitting shows score, accuracy, rank estimate, weak areas, recommendations, and solutions.</li>
          </ul>
        </section>
      );
    }

    if (workspace === "runner") {
      return (
        <section id="workspace" className="runner-shell">
          <div className="runner-topbar">
            <div>
              <span>{selectedTest.exam}</span>
              <strong>{selectedTest.title}</strong>
            </div>
            <div className="runner-tools">
              <label>
                Language
                <select value={languageMode} onChange={(event) => setLanguageMode(event.target.value)}>
                  <option>English</option>
                  <option>Hindi</option>
                </select>
              </label>
              <label>
                Font
                <select value={fontScale} onChange={(event) => setFontScale(event.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                  <option value="xl">XL</option>
                </select>
              </label>
              <div className="timer-pill">
                <Clock3 size={18} />
                <strong>{formatTime(timeLeft)}</strong>
              </div>
            </div>
          </div>

          <div className="section-tabs">
            {["All", ...selectedTest.sections].map((section) => (
              <button
                key={section}
                type="button"
                className={activeSection === section ? "active" : ""}
                onClick={() => {
                  setActiveSection(section);
                  const firstIndex = section === "All"
                    ? 0
                    : selectedTest.questionSet.findIndex((question) => question.section === section);
                  if (firstIndex >= 0) visitQuestion(firstIndex);
                }}
              >
                {section}
              </button>
            ))}
          </div>

          <div className="runner-section-meter">
            {selectedTest.sections.map((section) => {
              const sectionQuestions = selectedTest.questionSet.filter((question) => question.section === section);
              const answeredCount = sectionQuestions.filter((question) => answers[question.id] !== undefined).length;
              const progress = sectionQuestions.length ? Math.round((answeredCount / sectionQuestions.length) * 100) : 0;
              return (
                <div key={section}>
                  <span>{section}</span>
                  <strong>{answeredCount}/{sectionQuestions.length}</strong>
                  <i><b style={{ width: `${progress}%` }} /></i>
                </div>
              );
            })}
          </div>

          <div className="runner-layout">
            <article className={`question-panel font-${fontScale}`}>
              {currentQuestion && (
                <>
                  <div className="question-header">
                    <span>{currentQuestion.section}</span>
                    <strong>Question {questionIndex + 1} of {selectedTest.questionSet.length} - {selectedTest.marksPerQuestion} mark</strong>
                  </div>
                  <div className="question-language-note">{languageMode} version</div>
                  <h3>{currentQuestion.text}</h3>
                  <div className="option-list">
                    {currentQuestion.options.map((option, optionIndex) => (
                      <button
                        key={`${currentQuestion.id}-${optionIndex}`}
                        type="button"
                        className={answers[currentQuestion.id] === optionIndex ? "selected" : ""}
                        onClick={() => {
                          setAnswers((current) => ({ ...current, [currentQuestion.id]: optionIndex }));
                          setVisited((current) => current.includes(currentQuestion.id) ? current : [...current, currentQuestion.id]);
                        }}
                      >
                        <span>{String.fromCharCode(65 + optionIndex)}</span>
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <div className="runner-actions">
                <button type="button" onClick={clearResponse}>Clear Response</button>
                <button type="button" onClick={markReviewAndNext}><Flag size={15} /> Mark for Review & Next</button>
                <button type="button" className="primary-button" onClick={goToNextQuestion}>Save & Next</button>
                <button type="button" className="danger-button" onClick={() => setSubmitOpen(true)}>Submit Test</button>
              </div>
            </article>

            <aside className="palette-panel">
              <h3>Question Palette</h3>
              <div className="palette-grid">
                {selectedTest.questionSet.map((question, index) => {
                  const state = getQuestionState(question.id, answers, markedForReview, visited);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={`palette-dot ${state} ${index === questionIndex ? "current" : ""}`}
                      onClick={() => visitQuestion(index)}
                      title={`Question ${index + 1}: ${state.replace("-", " ")}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              {counts && (
                <div className="legend-list">
                  <span><i className="answered" /> Answered: {counts.answered}</span>
                  <span><i className="not-answered" /> Not Answered: {counts["not-answered"]}</span>
                  <span><i className="review" /> Marked: {counts.review}</span>
                  <span><i className="answered-review" /> Answered + Marked: {counts["answered-review"]}</span>
                  <span><i className="not-visited" /> Not Visited: {counts["not-visited"]}</span>
                </div>
              )}
            </aside>
          </div>
        </section>
      );
    }

    return (
      <section id="workspace" className="workspace result-workspace">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">Result analysis</span>
            <h2>{selectedTest.title}</h2>
            <p>Score, accuracy, section performance, rank estimate, and full answer review.</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => openTest(selectedTest)}>
            Re-attempt
          </button>
        </div>

        {result && (
          <>
            <div className="result-metrics">
              <div className="score-card">
                <strong>{result.score}/{result.maxScore}</strong>
                <span>Score</span>
              </div>
              <div><strong>{result.accuracy}%</strong><span>Accuracy</span></div>
              <div><strong>{result.percentile}</strong><span>Percentile</span></div>
              <div><strong>#{result.rank}</strong><span>Estimated rank</span></div>
              <div><strong>{formatTime(result.timeSpentSeconds)}</strong><span>Time spent</span></div>
            </div>

            <div className="benchmark-grid">
              <div className="benchmark-card">
                <span>Topper score</span>
                <strong>{result.topperScore}/{result.maxScore}</strong>
                <small>Gap to close: {result.scoreGap} marks</small>
              </div>
              <div className="benchmark-card">
                <span>Topper time</span>
                <strong>{formatTime(result.topperTimeSeconds)}</strong>
                <small>Your avg: {formatTime(result.avgTimeSeconds)} per attempted question</small>
              </div>
              <div className="benchmark-card">
                <span>Speed index</span>
                <strong>{result.speedIndex}/100</strong>
                <small>Based on attempts per minute</small>
              </div>
              <div className="benchmark-card accent">
                <span>Next action</span>
                <strong>{result.weakTopics.length ? result.weakTopics[0] : "Advanced mocks"}</strong>
                <small>{result.recommendations[0]}</small>
              </div>
            </div>

            <div className="chart-grid">
              <div className="analysis-card chart-card">
                <h3>Score graph</h3>
                <DonutChart value={result.scorePercent} label="Score" />
              </div>
              <div className="analysis-card chart-card">
                <h3>Attempt graph</h3>
                <BarChart
                  maxValue={result.total}
                  data={[
                    { label: "Correct", value: result.correct },
                    { label: "Wrong", value: result.wrong },
                    { label: "Unattempted", value: result.unattempted },
                    { label: "Marked", value: result.markedForReview }
                  ]}
                />
              </div>
              <div className="analysis-card chart-card">
                <h3>Section graph</h3>
                <BarChart
                  data={result.sections.map((section) => ({
                    label: section.section,
                    value: Number(section.score.toFixed(2))
                  }))}
                />
              </div>
            </div>

            <div className="export-row">
              <button type="button" className="secondary-button" onClick={() => exportCurrentResult("json")}>
                <FileText size={16} /> Download JSON
              </button>
              <button type="button" className="secondary-button" onClick={() => exportCurrentResult("csv")}>
                <FileText size={16} /> Download CSV
              </button>
            </div>

            <div className="analysis-grid">
              <div className="analysis-card">
                <h3>Attempt summary</h3>
                <div className="summary-bars">
                  <span><CheckCircle2 /> Correct <strong>{result.correct}</strong></span>
                  <span><XCircle /> Wrong <strong>{result.wrong}</strong></span>
                  <span><AlertCircle /> Unattempted <strong>{result.unattempted}</strong></span>
                  <span><Flag /> Marked <strong>{result.markedForReview}</strong></span>
                </div>
              </div>
              <div className="analysis-card">
                <h3>Weak areas</h3>
                {result.weakSections.length ? (
                  <div className="weak-tags">
                    {result.weakSections.map((section) => <span key={section}>{section}</span>)}
                  </div>
                ) : (
                  <p>Good balance across sections. Keep improving speed.</p>
                )}
              </div>
              <div className="analysis-card section-breakdown">
                <h3>Section breakdown</h3>
                {result.sections.map((section) => (
                  <div key={section.section}>
                    <span>{section.section}</span>
                    <strong>{section.score.toFixed(2)} marks</strong>
                    <small>{section.correct} correct, {section.wrong} wrong, {section.attempted}/{section.total} attempted, {formatTime(section.timeSpentSeconds)} est. time</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="deep-analysis-grid">
              <div className="analysis-card">
                <h3>AI-style recommendations</h3>
                <div className="recommendation-list">
                  {result.recommendations.map((item) => (
                    <span key={item}><Sparkles size={15} /> {item}</span>
                  ))}
                </div>
              </div>
              <div className="analysis-card topic-strength-card">
                <h3>Topic strength</h3>
                <div className="topic-table">
                  {result.topics.slice(0, 8).map((topic) => (
                    <div key={`${topic.section}-${topic.topic}`}>
                      <strong>{topic.topic}</strong>
                      <span>{topic.section}</span>
                      <span>{topic.accuracy}%</span>
                      <small className={`strength-${topic.strength.toLowerCase().replace(/\s+/g, "-")}`}>{topic.strength}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="solution-review">
              <h3>Answer review</h3>
              {selectedTest.questionSet.map((question, index) => {
                const selected = answers[question.id];
                const isCorrect = selected === question.answerIndex;
                return (
                  <article key={question.id} className="solution-row">
                    <div>
                      <strong>Q{index + 1}. {question.text}</strong>
                      <span>{question.section}</span>
                    </div>
                    <p className={selected === undefined ? "skipped" : isCorrect ? "correct" : "wrong"}>
                      Your answer: {selected === undefined ? "Not attempted" : question.options[selected]}
                    </p>
                    <p>Correct answer: {question.options[question.answerIndex]}</p>
                    <small>{question.solution}</small>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    );
  };

  return (
    <div className={`app-shell ${isExamWindow ? "exam-window-shell" : ""}`}>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="PrepBoard home">
          <span>PB</span>
          <strong>PrepBoard</strong>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#tests">Tests</a>
          <a href="#workspace">Attempt</a>
          <a href="#pyp">PYPs</a>
          <a href="#host">Host</a>
          <a href="#history">History</a>
        </nav>
        {isLoggedIn ? (
          <button type="button" className="ghost-button" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        ) : (
          <button type="button" className="ghost-button" onClick={() => setLoginOpen(true)}>
            <User size={16} /> Login
          </button>
        )}
      </header>

      <main id="top">
        <section className="sale-strip" aria-label="Promotion">
          <strong>Practice Week</strong>
          <span>Free live tests, sectional drills, and host-published mocks</span>
          <button type="button" onClick={() => setUnlockTest(visibleTests.find((test) => !test.free) || null)}>
            View Unlocks
          </button>
        </section>

        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">RRB PO Prelims test practice</span>
            <h1>Attempt mock tests with a complete exam-style workflow.</h1>
            <p>
              PrepBoard is a standalone React and Firebase test platform with login,
              test cards, instructions, timer, section filters, question palette,
              result analysis, and attempt history.
            </p>
            <div className="hero-actions">
              <a href="#tests" className="primary-link"><Play size={17} /> View Tests</a>
              <button type="button" className="secondary-button" onClick={() => setLoginOpen(true)}>
                <User size={17} /> Login / Register
              </button>
            </div>
            <div className="hero-stats">
              <div><strong>80</strong><span>Questions</span></div>
              <div><strong>80</strong><span>Marks</span></div>
              <div><strong>45m</strong><span>Prelims timer</span></div>
            </div>
          </div>

          <div className="account-card">
            <span className="card-kicker">{notice}</span>
            <h2>{isLoggedIn ? "Account ready" : "Login required"}</h2>
            {isLoggedIn ? (
              <>
                <p>{activeIdentity.displayName || activeIdentity.name || "Student"}</p>
                <p>{activeIdentity.email || activeIdentity.mobile || "Local profile"}</p>
                <button type="button" onClick={() => setLoginOpen(true)}>Edit Profile</button>
              </>
            ) : (
              <>
                <p>Login or create a quick profile to attempt free tests and save history.</p>
                <button type="button" onClick={() => setLoginOpen(true)}>Create Free Profile</button>
              </>
            )}
          </div>
        </section>

        <section id="dashboard" className="platform-layout">
          <aside className="learning-nav" aria-label="Learning navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={activeNav === item ? "active" : ""}
                onClick={() => handleNavigation(item)}
              >
                {item === "Dashboard" && <BarChart3 size={16} />}
                {item === "Courses" && <Layers size={16} />}
                {item === "Tests" && <ClipboardList size={16} />}
                {item === "PYPs" && <FileText size={16} />}
                {item === "Bookmarks" && <Bookmark size={16} />}
                {item === "Subscription" && <UnlockKeyhole size={16} />}
                {!["Dashboard", "Courses", "Tests", "PYPs", "Bookmarks", "Subscription"].includes(item) && <Sparkles size={16} />}
                <span>{item}</span>
              </button>
            ))}
          </aside>

          <div className="course-dashboard">
            <div className="course-overview">
              <div>
                <span className="eyebrow">Course overview</span>
                <h2>{activeCourse.title}</h2>
                <p>{activeCourse.description}</p>
              </div>
              <div className="course-badges">
                <span>{activeCourse.testPattern}</span>
                <span>{activeCourse.totalTests} tests</span>
                <span>{activeCourse.freeTests} free</span>
              </div>
            </div>

            <div className="dashboard-metrics">
              <div><strong>{dashboardStats.attempted}</strong><span>Attempts</span></div>
              <div><strong>{dashboardStats.bestScore}</strong><span>Best score</span></div>
              <div><strong>{dashboardStats.unlocked}</strong><span>Unlocked tests</span></div>
              <div><strong>{dashboardStats.bookmarks}</strong><span>Bookmarks</span></div>
              <div><strong>{dashboardStats.live}</strong><span>Live reminders</span></div>
            </div>

            <div className="pass-panel">
              <div className="pass-copy">
                <span className="eyebrow">PrepPass demo</span>
                <h3>One library for mocks, PYPs, live tests, and analysis.</h3>
                <p>Built like a real exam-prep pass: unlock tests, reattempt, review solutions, and track weak areas across attempts.</p>
              </div>
              <div className="pass-feature-grid">
                {PASS_FEATURES.map((feature) => (
                  <div key={feature.title}>
                    <strong>{feature.value}</strong>
                    <span>{feature.title}</span>
                    <small>{feature.detail}</small>
                  </div>
                ))}
              </div>
              <button type="button" className="secondary-button" onClick={() => setUnlockTest(visibleTests.find((test) => !test.free) || allTests.find((test) => !test.free) || null)}>
                <UnlockKeyhole size={16} /> Try Unlock Flow
              </button>
            </div>

            <div className="promo-grid">
              {PROMO_CARDS.map((promo) => (
                <article key={promo.title} className="promo-card">
                  <span>{promo.badge}</span>
                  <strong>{promo.title}</strong>
                  <p>{promo.description}</p>
                  <button type="button" onClick={() => setNotice(`${promo.title} opened in demo mode.`)}>
                    <Eye size={15} /> View
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="feature-row" aria-label="Platform features">
          <div><ClipboardList /><strong>Instructions Screen</strong><span>Rules before starting every test.</span></div>
          <div><Target /><strong>Question Palette</strong><span>Answered, review, not visited states.</span></div>
          <div><BarChart3 /><strong>Result Analysis</strong><span>Score, accuracy, rank, weak areas.</span></div>
          <div><ShieldCheck /><strong>Firebase Ready</strong><span>Lead and attempt saving when configured.</span></div>
        </section>

        <section className="live-strip" aria-label="Free weekly live tests">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow">Free weekly live tests</span>
              <h2>Upcoming practice events</h2>
            </div>
          </div>
          <div className="tile-grid three">
            {LIVE_TESTS.map((item) => (
              <article className="mini-tile" key={item.title}>
                <div className="mini-tile-top">
                  <strong>{item.title}</strong>
                  <span>{liveEnrollments.includes(item.id) ? "Enrolled" : "Free"}</span>
                </div>
                <span>{item.date} - {item.startsAt}</span>
                <small>{item.meta}</small>
                <button type="button" onClick={() => toggleLiveEnrollment(item.id)}>
                  <CalendarDays size={15} />
                  {liveEnrollments.includes(item.id) ? "Remove Reminder" : "Remind Me"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section id="tests" className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Test series</span>
              <h2>{category?.label} tests [{visibleTests.length}]</h2>
              <p>{category?.exams} - showing {displayedTests.length} of {visibleTests.length}</p>
            </div>
            <div className="catalog-tools">
              <label className="search-box">
                <Search size={16} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search mock tests"
                />
              </label>
              <label className="sort-box">
                <SlidersHorizontal size={16} />
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="free">Free first</option>
                  <option value="duration">Duration</option>
                  <option value="bookmarked">Bookmarked</option>
                </select>
              </label>
            </div>
          </div>

          <div className="category-tabs" role="tablist" aria-label="Exam categories">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeCategory === item.id ? "active" : ""}
                onClick={() => {
                  setActiveCategory(item.id);
                  setSelectedSeriesId("all");
                }}
              >
                <strong>{item.label}</strong>
                <span>{item.exams}</span>
              </button>
            ))}
          </div>

          {categorySeries.length > 0 && (
            <div className="series-section">
              <div className="series-filter-row">
                <button
                  type="button"
                  className={selectedSeriesId === "all" ? "active" : ""}
                  onClick={() => setSelectedSeriesId("all")}
                >
                  All {category?.label} Tests
                </button>
                {categorySeries.map((series) => (
                  <button
                    key={series.id}
                    type="button"
                    className={selectedSeriesId === series.id ? "active" : ""}
                    onClick={() => {
                      setSelectedSeriesId(series.id);
                      setSearchQuery("");
                    }}
                  >
                    {series.exam}
                  </button>
                ))}
              </div>

              <div className="series-grid">
                {categorySeries.map((series) => {
                  const seriesTests = allTests.filter((test) => test.seriesId === series.id);
                  return (
                    <article className={selectedSeriesId === series.id ? "series-card active" : "series-card"} key={series.id}>
                      <div className="series-card-top">
                        <span>{series.badge}</span>
                        <strong>{series.users} users</strong>
                      </div>
                      <h3>{series.title}</h3>
                      <p>{series.description}</p>
                      <div className="series-stats">
                        <div><strong>{series.tests}</strong><span>Total tests</span></div>
                        <div><strong>{series.freeTests}</strong><span>Free tests</span></div>
                        <div><strong>{series.languages}</strong><span>Languages</span></div>
                      </div>
                      <div className="tag-list">
                        {series.includes.map((item) => <span key={item}>{item}</span>)}
                      </div>
                      <div className="series-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => {
                            setSelectedSeriesId(series.id);
                            setSearchQuery("");
                          }}
                        >
                          <Play size={16} /> View {seriesTests.length || series.tests} Tests
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            const freeTest = seriesTests.find((test) => test.free) || seriesTests[0];
                            if (freeTest) openTestInWindow(freeTest);
                          }}
                        >
                          <Eye size={16} /> Attempt Free
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {selectedSeries && (
                <div className="pattern-panel">
                  <div>
                    <span className="eyebrow">Exam pattern</span>
                    <h3>{selectedSeries.exam} quick pattern</h3>
                  </div>
                  <div className="pattern-table">
                    {selectedSeries.pattern.map((row) => (
                      <div key={row.section}>
                        <strong>{row.section}</strong>
                        <span>{row.questions} Qs</span>
                        <span>{row.marks} marks</span>
                        <span>{row.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="test-grid">
            {displayedTests.map((test) => {
              const unlocked = test.free || unlockedTests.includes(test.id);
              const bookmarked = bookmarkedTests.includes(test.id);
              const savedProgress = testProgress[test.id];
              return (
                <article className="test-card" key={test.id}>
                  <div className="test-topline">
                    <span>{test.stage} - {test.type}</span>
                    <div className="test-card-actions">
                      {savedProgress && <strong className="resume-chip">Resume</strong>}
                      <strong className={unlocked ? "free" : "locked"}>{unlocked ? "Free" : "Locked"}</strong>
                      <button
                        type="button"
                        className="bookmark-button"
                        onClick={() => toggleBookmark(test.id)}
                        aria-label={bookmarked ? `Remove bookmark for ${test.title}` : `Bookmark ${test.title}`}
                      >
                        {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  </div>
                  <h3>{test.title}</h3>
                  <p>{test.exam} - {test.level}</p>
                  <div className="test-meta">
                    <span><BookOpen size={14} /> {test.questions} Qs</span>
                    <span><Award size={14} /> {test.marks} Marks</span>
                    <span><Clock3 size={14} /> {test.durationMinutes} Mins</span>
                    <span><Users size={14} /> {test.attempts + attemptHistory.filter((attempt) => attempt.testId === test.id).length} Attempts</span>
                  </div>
                  <div className="tag-list">
                    {test.sections.map((section) => <span key={section}>{section}</span>)}
                  </div>
                  <button
                    type="button"
                    className={unlocked ? "attempt-button" : "lock-button"}
                    onClick={() => openTestInWindow(test)}
                  >
                    {unlocked ? <Play size={16} /> : <LockKeyhole size={16} />}
                    {unlocked ? "Open Exam Window" : "Unlock Now"}
                  </button>
                </article>
              );
            })}
          </div>
          {visibleTests.length > 10 && (
            <div className="view-more-row">
              <button type="button" className="secondary-button" onClick={() => setShowAllTests((current) => !current)}>
                <ChevronDown size={16} /> {showAllTests ? "Show Less" : `View More (${visibleTests.length - 10})`}
              </button>
            </div>
          )}
        </section>

        {renderWorkspace()}

        <section id="pyp" className="content-section split-section">
          <div>
            <div className="section-heading compact-heading">
              <div>
                <span className="eyebrow">PYPs</span>
                <h2>Previous year practice</h2>
                <p>Fast entry points for past live tests and previous-year papers.</p>
              </div>
            </div>
            <div className="tile-grid">
              {PYP_EXAMS.map((item) => (
                <button
                  type="button"
                  className="exam-tile"
                  key={item.title}
                  onClick={() => {
                    setSearchQuery(item.exam);
                    setActiveCategory(item.category);
                    document.getElementById("tests")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <FilePlus2 size={18} />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="section-heading compact-heading">
              <div>
                <span className="eyebrow">Popular</span>
                <h2>Exam shortcuts</h2>
                <p>Quick filters for common banking and government exam series.</p>
              </div>
            </div>
            <div className="tile-grid popular-grid">
              {POPULAR_TESTS.map((item) => (
                <button
                  type="button"
                  className="exam-tile subtle"
                  key={item.title}
                  onClick={() => {
                    setSearchQuery(item.title);
                    setActiveCategory(item.category);
                    document.getElementById("tests")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <Search size={17} />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="host" className="content-section host-studio">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Host Studio</span>
              <h2>Publish tests manually</h2>
              <p>Create units, add questions one by one, publish them to the test catalog, and review student attempts.</p>
            </div>
          </div>

          {!hostMode ? (
            <div className="host-lock">
              <div>
                <ShieldCheck size={32} />
                <strong>Admin access required</strong>
                <span>Use demo host code {HOST_ACCESS_CODE}. Firebase-authenticated hosts can also unlock this area.</span>
              </div>
              <label>
                Host Access Code
                <input
                  value={hostAccessCode}
                  onChange={(event) => setHostAccessCode(event.target.value)}
                  placeholder="HOST100"
                />
              </label>
              <button type="button" className="primary-button" onClick={unlockHostStudio}>
                <UnlockKeyhole size={16} /> Unlock Host Studio
              </button>
            </div>
          ) : (
            <div className="host-layout">
              <form className="host-form" onSubmit={(event) => {
                event.preventDefault();
                saveHostTest(true);
              }}>
                <div className="host-panel-heading">
                  <div>
                    <strong>Test setup</strong>
                    <span>Everything is manual. Add the full question set before publishing.</span>
                  </div>
                  <span className="status-pill">{hostForm.questionSet.length} questions ready</span>
                </div>

                <div className="form-grid">
                  <label>
                    Test Title
                    <input
                      value={hostForm.title}
                      onChange={(event) => setHostForm({ ...hostForm, title: event.target.value })}
                      placeholder="RRB PO Sectional Mock 1"
                    />
                  </label>
                  <label>
                    Exam Name
                    <input
                      value={hostForm.exam}
                      onChange={(event) => setHostForm({ ...hostForm, exam: event.target.value })}
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={hostForm.category}
                      onChange={(event) => setHostForm({ ...hostForm, category: event.target.value })}
                    >
                      {CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Course Code
                    <input
                      value={hostForm.courseCode}
                      onChange={(event) => setHostForm({ ...hostForm, courseCode: event.target.value })}
                    />
                  </label>
                  <label>
                    Stage
                    <input
                      value={hostForm.stage}
                      onChange={(event) => setHostForm({ ...hostForm, stage: event.target.value })}
                    />
                  </label>
                  <label>
                    Duration Minutes
                    <input
                      type="number"
                      min="1"
                      value={hostForm.durationMinutes}
                      onChange={(event) => setHostForm({ ...hostForm, durationMinutes: event.target.value })}
                    />
                  </label>
                  <label>
                    Marks
                    <input
                      type="number"
                      min="1"
                      value={hostForm.marks}
                      onChange={(event) => setHostForm({ ...hostForm, marks: event.target.value })}
                    />
                  </label>
                  <label>
                    Language
                    <input
                      value={hostForm.language}
                      onChange={(event) => setHostForm({ ...hostForm, language: event.target.value })}
                    />
                  </label>
                  <label className="wide-field">
                    Sections
                    <input
                      value={hostForm.sections}
                      onChange={(event) => setHostForm({ ...hostForm, sections: event.target.value })}
                      placeholder="Reasoning, Quantitative Aptitude"
                    />
                  </label>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={hostForm.free}
                      onChange={(event) => setHostForm({ ...hostForm, free: event.target.checked })}
                    />
                    Publish as free test
                  </label>
                </div>

                <div className="question-builder">
                  <div className="host-panel-heading">
                    <div>
                      <strong>Manual question entry</strong>
                      <span>Add options, choose the answer, and write the solution.</span>
                    </div>
                  </div>
                  <label>
                    Section
                    <input
                      value={questionDraft.section}
                      onChange={(event) => setQuestionDraft({ ...questionDraft, section: event.target.value })}
                    />
                  </label>
                  <label>
                    Question
                    <textarea
                      value={questionDraft.text}
                      onChange={(event) => setQuestionDraft({ ...questionDraft, text: event.target.value })}
                      placeholder="Enter question text"
                    />
                  </label>
                  <div className="option-editor">
                    {questionDraft.options.map((option, optionIndex) => (
                      <label key={optionIndex}>
                        <span className="option-title-row">
                          Option {String.fromCharCode(65 + optionIndex)}
                          {questionDraft.options.length > 2 && (
                            <button type="button" onClick={() => removeQuestionOption(optionIndex)} aria-label={`Remove option ${String.fromCharCode(65 + optionIndex)}`}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </span>
                        <input
                          value={option}
                          onChange={(event) => updateQuestionOption(optionIndex, event.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        />
                      </label>
                    ))}
                  </div>
                  <button type="button" className="secondary-button add-option-button" onClick={addQuestionOption} disabled={questionDraft.options.length >= 6}>
                    <FilePlus2 size={16} /> Add Option
                  </button>
                  <div className="form-grid two">
                    <label>
                      Correct Answer
                      <select
                        value={questionDraft.answerIndex}
                        onChange={(event) => setQuestionDraft({ ...questionDraft, answerIndex: Number(event.target.value) })}
                      >
                        {questionDraft.options.map((_, optionIndex) => (
                          <option key={optionIndex} value={optionIndex}>
                            Option {String.fromCharCode(65 + optionIndex)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Solution
                      <input
                        value={questionDraft.solution}
                        onChange={(event) => setQuestionDraft({ ...questionDraft, solution: event.target.value })}
                        placeholder="Short explanation"
                      />
                    </label>
                  </div>
                  <button type="button" className="secondary-button add-question-button" onClick={addQuestionToHostForm}>
                    <FilePlus2 size={16} /> Add Question
                  </button>
                </div>

                <div className="host-publish-actions">
                  <button type="button" className="secondary-button" onClick={previewHostTest}>
                    <Eye size={16} /> Preview Test
                  </button>
                  <button type="submit" className="primary-button publish-button">
                    <ShieldCheck size={16} /> Publish Test
                  </button>
                </div>
              </form>

              <aside className="host-sidebar">
                <div className="host-card upload-card">
                  <strong>Upload tests</strong>
                  <span className="muted-line">Import one JSON test object or an array of tests. Each item can include title, exam, category, questions, marks, durationMinutes, sections, and questionSet.</span>
                  <label className="file-upload">
                    <FilePlus2 size={16} /> Upload JSON
                    <input type="file" accept="application/json,.json" onChange={uploadHostTests} />
                  </label>
                </div>

                <div className="host-card bulk-card">
                  <strong>Bulk manual entry</strong>
                  <span className="muted-line">One question per line: Section | Question | Option A | Option B | Option C | Option D | Correct number | Solution</span>
                  <textarea
                    value={bulkQuestionText}
                    onChange={(event) => setBulkQuestionText(event.target.value)}
                    placeholder="Reasoning | Find the odd one out | 12 | 18 | 21 | 24 | 3 | 21 is not divisible by 6"
                  />
                  <button type="button" className="secondary-button" onClick={importBulkQuestions}>
                    <FilePlus2 size={16} /> Import Lines
                  </button>
                </div>

                <div className="host-card">
                  <strong>Draft questions</strong>
                  <div className="question-list">
                    {hostForm.questionSet.length === 0 ? (
                      <span className="muted-line">No questions added yet.</span>
                    ) : hostForm.questionSet.map((question, index) => (
                      <div className="question-chip" key={question.id}>
                        <span>Q{index + 1}. {question.section}</span>
                        <button type="button" onClick={() => removeHostQuestion(question.id)} aria-label={`Remove question ${index + 1}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="host-card">
                  <strong>Published by host</strong>
                  <div className="published-list">
                    {publishedHostTests.length === 0 ? (
                      <span className="muted-line">No host tests published yet.</span>
                    ) : publishedHostTests.map((test) => {
                      const attempts = attemptHistory.filter((attempt) => attempt.testId === test.id);
                      const isSeeded = test.id === IBPS_CLERK_HOST_FULL_MOCK.id;
                      return (
                        <article key={test.id}>
                          <div>
                            <strong>{test.title}</strong>
                            <span>{test.exam} - {test.questions} Qs - {attempts.length} attempts{isSeeded ? " - seeded host test" : ""}</span>
                          </div>
                          {isSeeded ? (
                            <button type="button" disabled aria-label={`${test.title} is protected`}>
                              <ShieldCheck size={15} />
                            </button>
                          ) : (
                            <button type="button" onClick={() => deleteHostTest(test.id)} aria-label={`Delete ${test.title}`}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </section>

        <section id="history" className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">History</span>
              <h2>Recent attempts</h2>
              <p>Saved locally and sent to Firebase when your project values are configured.</p>
            </div>
            <button type="button" className="secondary-button" onClick={exportAttempts} disabled={!attemptHistory.length}>
              <FileText size={16} /> Export Attempts
            </button>
          </div>
          <div className="history-list">
            {attemptHistory.length === 0 ? (
              <div className="empty-workspace compact">
                <Trophy size={28} />
                <strong>No attempts yet</strong>
                <span>Attempt a free mock test to see history here.</span>
              </div>
            ) : attemptHistory.map((attempt) => {
              const summary = getAttemptSummary(attempt);
              return (
                <div className="history-row" key={attempt.id || `${attempt.testTitle}-${attempt.createdAtText}`}>
                  <div>
                    <strong>{attempt.testTitle || "Mock test attempt"}</strong>
                    <span>{attempt.createdAtText || "Saved attempt"}</span>
                  </div>
                  <div>
                    <strong>{summary.score}/{summary.maxScore}</strong>
                    <span>{summary.accuracy}% accuracy</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {loginOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Login">
          <form className="login-modal" onSubmit={handleProfileSubmit}>
            <button type="button" className="icon-close" onClick={() => setLoginOpen(false)} aria-label="Close login">
              <X size={18} />
            </button>
            <span className="eyebrow">Login / Register</span>
            <h2>Continue to PrepBoard</h2>
            <p>Use Google if Firebase is configured, or create a quick local profile for testing.</p>
            <button type="button" className="google-button" onClick={handleGoogleLogin}>
              <Mail size={16} /> Continue with Google
            </button>
            <label>
              Full Name
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                placeholder="Student name"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                placeholder="student@example.com"
                required
              />
            </label>
            <label>
              Mobile
              <input
                type="tel"
                value={profileForm.mobile}
                onChange={(event) => setProfileForm({ ...profileForm, mobile: event.target.value })}
                placeholder="+91..."
                required
              />
            </label>
            <label>
              Target Exam
              <select
                value={profileForm.targetExam}
                onChange={(event) => setProfileForm({ ...profileForm, targetExam: event.target.value })}
              >
                <option>IBPS RRB Officer Scale I</option>
                <option>IBPS PO</option>
                <option>SBI PO</option>
                <option>SSC CGL</option>
                <option>RRB NTPC</option>
                <option>RBI Grade B</option>
              </select>
            </label>
            <button type="submit" className="primary-button">Save & Continue</button>
          </form>
        </div>
      )}

      {unlockTest && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Unlock test">
          <div className="login-modal">
            <button type="button" className="icon-close" onClick={() => setUnlockTest(null)} aria-label="Close unlock">
              <X size={18} />
            </button>
            <span className="eyebrow">Unlock test</span>
            <h2>{unlockTest.title}</h2>
            <p>Payment can be connected later. For demo, use code <strong>{FREE_UNLOCK_CODE}</strong>.</p>
            <label>
              Coupon Code
              <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="PREP100" />
            </label>
            <button type="button" className="primary-button" onClick={applyCoupon}>
              <UnlockKeyhole size={16} /> Unlock
            </button>
          </div>
        </div>
      )}

      {submitOpen && selectedTest && counts && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Submit test">
          <div className="login-modal">
            <button type="button" className="icon-close" onClick={() => setSubmitOpen(false)} aria-label="Close submit confirmation">
              <X size={18} />
            </button>
            <span className="eyebrow">Submit test</span>
            <h2>Review your attempt</h2>
            <div className="submit-summary">
              <span>Answered <strong>{counts.answered + counts["answered-review"]}</strong></span>
              <span>Marked <strong>{counts.review + counts["answered-review"]}</strong></span>
              <span>Not answered <strong>{counts["not-answered"]}</strong></span>
              <span>Not visited <strong>{counts["not-visited"]}</strong></span>
            </div>
            <p>Once submitted, answers cannot be changed for this attempt.</p>
            <button type="button" className="danger-button full" onClick={() => submitAttempt("manual-submit")}>
              Submit Final
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
