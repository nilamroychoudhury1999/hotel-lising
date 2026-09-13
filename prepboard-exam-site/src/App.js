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
  CheckCircle2,
  ClipboardList,
  Clock3,
  FilePlus2,
  Flag,
  LockKeyhole,
  LogOut,
  Mail,
  Play,
  Search,
  ShieldCheck,
  Trash2,
  Target,
  Trophy,
  UnlockKeyhole,
  User,
  X,
  XCircle
} from "lucide-react";
import { auth, db, googleProvider, hasFirebaseConfig } from "./firebase";

const LOCAL_PROFILE_KEY = "prepboard_profile";
const LOCAL_ATTEMPTS_KEY = "prepboard_attempts";
const LOCAL_UNLOCKS_KEY = "prepboard_unlocked_tests";
const LOCAL_HOST_TESTS_KEY = "prepboard_host_tests";
const FREE_UNLOCK_CODE = "PREP100";
const HOST_ACCESS_CODE = "HOST100";
const HOST_EMAILS = ["nilamroychoudhury216@gmail.com"];

const CATEGORIES = [
  { id: "banking", label: "Banking", exams: "IBPS RRB Officer, IBPS PO, SBI PO" },
  { id: "ssc", label: "SSC", exams: "CGL, CHSL, CPO" },
  { id: "railways", label: "Railways", exams: "RRB NTPC, Group D" },
  { id: "regulatory", label: "Regulatory", exams: "RBI, NABARD, SEBI" }
];

const LIVE_TESTS = [
  { title: "RRB PO Live Practice", date: "Today", meta: "All India ranking" },
  { title: "SSC CPO Live Drill", date: "Tomorrow", meta: "Timed leaderboard" },
  { title: "RRB Technician Sprint", date: "Sep 15", meta: "Free weekly test" }
];

const PYP_EXAMS = [
  "SBI Clerk Past Live Tests",
  "RRB PO Past Live Tests",
  "IBPS PO Pre PYP",
  "SBI PO Past Live Tests",
  "IBPS RRB Officer Pre PYP",
  "RBI Assistant Pre PYP"
];

const POPULAR_TESTS = [
  "SBI Clerk",
  "IBPS Clerk",
  "IBPS RRB Officer",
  "IBPS RRB Assistant",
  "SBI PO",
  "IBPS PO",
  "RBI Assistant",
  "NICL Assistant"
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
  }
];

const FALLBACK_TESTS = [
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

const normalizeTest = (test) => ({
  id: test.id,
  sortOrder: Number(test.sortOrder || 999),
  category: test.category || "banking",
  courseCode: test.courseCode || test.code || "rrbposecpre",
  title: test.title || "Mock Test",
  exam: test.exam || "Competitive Exam",
  stage: test.stage || "Mock",
  questions: Number(test.questions || test.totalQuestions || 80),
  marks: Number(test.marks || test.totalMarks || 80),
  durationMinutes: Number(test.durationMinutes || test.minutes || 45),
  language: test.language || "English and Hindi",
  level: test.level || test.difficulty || "Exam level",
  free: test.free !== false && test.locked !== true,
  sections: Array.isArray(test.sections) && test.sections.length ? test.sections : ["Reasoning", "Quantitative Aptitude"],
  questionSet: Array.isArray(test.questionSet) && test.questionSet.length
    ? test.questionSet
    : Array.isArray(test.demoQuestions) && test.demoQuestions.length
      ? test.demoQuestions
      : QUESTION_BANK
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
  let correct = 0;
  let wrong = 0;

  test.questionSet.forEach((question) => {
    const section = question.section || "General";
    if (!sectionMap[section]) {
      sectionMap[section] = { section, total: 0, attempted: 0, correct: 0, wrong: 0, score: 0 };
    }

    sectionMap[section].total += 1;
    if (answers[question.id] !== undefined) {
      sectionMap[section].attempted += 1;
      if (answers[question.id] === question.answerIndex) {
        correct += 1;
        sectionMap[section].correct += 1;
        sectionMap[section].score += 1;
      } else {
        wrong += 1;
        sectionMap[section].wrong += 1;
        sectionMap[section].score -= 0.25;
      }
    }
  });

  const total = test.questionSet.length;
  const attempted = Object.keys(answers).length;
  const score = Number((correct - wrong * 0.25).toFixed(2));
  const scorePercent = Math.max(0, Math.round((score / total) * 100));
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const percentile = Math.min(99.9, Math.max(35, Number((45 + scorePercent * 0.52).toFixed(1))));
  const rank = Math.max(1, Math.round(9500 - percentile * 83 + wrong * 17));
  const weakSections = Object.values(sectionMap)
    .filter((section) => section.total && section.correct / section.total < 0.5)
    .map((section) => section.section);

  return {
    correct,
    wrong,
    unattempted: total - attempted,
    total,
    attempted,
    markedForReview: markedForReview.length,
    score,
    maxScore: total,
    scorePercent,
    accuracy,
    percentile,
    rank,
    timeSpentSeconds,
    avgTimeSeconds: attempted ? Math.round(timeSpentSeconds / attempted) : 0,
    weakSections,
    sections: Object.values(sectionMap)
  };
};

const getAttemptSummary = (attempt) => {
  const summary = attempt?.summary || {};
  const score = summary.score ?? attempt?.score ?? 0;
  const maxScore = summary.maxScore ?? attempt?.maxScore ?? attempt?.total ?? 0;
  const accuracy = summary.accuracy ?? attempt?.accuracy ?? 0;

  return { score, maxScore, accuracy };
};

function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [tests, setTests] = useState(FALLBACK_TESTS);
  const [hostTests, setHostTests] = useState(() => loadJson(LOCAL_HOST_TESTS_KEY, []));
  const [profile, setProfile] = useState(() => loadJson(LOCAL_PROFILE_KEY, null));
  const [profileForm, setProfileForm] = useState(() => loadJson(LOCAL_PROFILE_KEY, defaultProfile) || defaultProfile);
  const [attemptHistory, setAttemptHistory] = useState(() => loadJson(LOCAL_ATTEMPTS_KEY, []));
  const [unlockedTests, setUnlockedTests] = useState(() => loadJson(LOCAL_UNLOCKS_KEY, []));
  const [activeCategory, setActiveCategory] = useState("banking");
  const [searchQuery, setSearchQuery] = useState("");
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
  const [submitOpen, setSubmitOpen] = useState(false);
  const [unlockTest, setUnlockTest] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [hostAccessCode, setHostAccessCode] = useState("");
  const [hostMode, setHostMode] = useState(false);
  const [hostForm, setHostForm] = useState(createHostForm);
  const [questionDraft, setQuestionDraft] = useState(createEmptyQuestion);

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

  const visibleTests = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return allTests
      .filter((test) => test.category === activeCategory)
      .filter((test) => {
        if (!search) return true;
        return [test.title, test.exam, test.stage, test.courseCode, test.sections.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(search);
      });
  }, [activeCategory, allTests, searchQuery]);

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

  const ensureLogin = () => {
    if (isLoggedIn) return true;
    setLoginOpen(true);
    setNotice("Login or create a free profile before attempting a test.");
    return false;
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

  const addQuestionToHostForm = () => {
    const cleanQuestion = {
      ...questionDraft,
      id: `host_q_${Date.now()}`,
      text: questionDraft.text.trim(),
      section: questionDraft.section.trim() || "General",
      options: questionDraft.options.map((option) => option.trim()),
      solution: questionDraft.solution.trim()
    };

    if (!cleanQuestion.text || cleanQuestion.options.some((option) => !option)) {
      setNotice("Question text and all four options are required.");
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

  const deleteHostTest = (testId) => {
    const nextHostTests = hostTests.filter((test) => test.id !== testId);
    setHostTests(nextHostTests);
    saveJson(LOCAL_HOST_TESTS_KEY, nextHostTests);
    setNotice("Host test deleted locally.");
  };

  const beginTest = () => {
    if (!selectedTest) return;
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
  }, [answers, attemptHistory, firebaseUser, markedForReview, profile, result, selectedTest, startedAt]);

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
      return (
        <section id="workspace" className="workspace instructions-panel">
          <div className="workspace-heading">
            <div>
              <span className="eyebrow">Instructions</span>
              <h2>{selectedTest.title}</h2>
              <p>Read the test rules before starting. The timer begins immediately after you start.</p>
            </div>
            <button type="button" className="primary-button" onClick={beginTest}>
              <Play size={16} /> Start Test
            </button>
          </div>
          <div className="instruction-grid">
            <div><strong>{selectedTest.questions}</strong><span>Questions</span></div>
            <div><strong>{selectedTest.marks}</strong><span>Marks</span></div>
            <div><strong>{selectedTest.durationMinutes} min</strong><span>Duration</span></div>
            <div><strong>-0.25</strong><span>Negative marking</span></div>
          </div>
          <ul className="rules-list">
            <li>Each question has one correct answer.</li>
            <li>Use Save & Next after selecting an answer.</li>
            <li>Use Mark for Review to revisit a question before submitting.</li>
            <li>You can switch sections using the section chips.</li>
            <li>Submitting shows score, accuracy, rank estimate, weak areas, and solutions.</li>
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
            <div className="timer-pill">
              <Clock3 size={18} />
              <strong>{formatTime(timeLeft)}</strong>
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

          <div className="runner-layout">
            <article className="question-panel">
              {currentQuestion && (
                <>
                  <div className="question-header">
                    <span>{currentQuestion.section}</span>
                    <strong>Question {questionIndex + 1} of {selectedTest.questionSet.length}</strong>
                  </div>
                  <h3>{currentQuestion.text}</h3>
                  <div className="option-list">
                    {currentQuestion.options.map((option, optionIndex) => (
                      <button
                        key={option}
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
                    <small>{section.correct} correct, {section.wrong} wrong, {section.attempted}/{section.total} attempted</small>
                  </div>
                ))}
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
    <div className="app-shell">
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
                <strong>{item.title}</strong>
                <span>{item.date}</span>
                <small>{item.meta}</small>
              </article>
            ))}
          </div>
        </section>

        <section id="tests" className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Test series</span>
              <h2>{category?.label} tests</h2>
              <p>{category?.exams}</p>
            </div>
            <label className="search-box">
              <Search size={16} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search mock tests"
              />
            </label>
          </div>

          <div className="category-tabs" role="tablist" aria-label="Exam categories">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeCategory === item.id ? "active" : ""}
                onClick={() => setActiveCategory(item.id)}
              >
                <strong>{item.label}</strong>
                <span>{item.exams}</span>
              </button>
            ))}
          </div>

          <div className="test-grid">
            {visibleTests.map((test) => {
              const unlocked = test.free || unlockedTests.includes(test.id);
              return (
                <article className="test-card" key={test.id}>
                  <div className="test-topline">
                    <span>{test.stage}</span>
                    <strong className={unlocked ? "free" : "locked"}>{unlocked ? "Free" : "Locked"}</strong>
                  </div>
                  <h3>{test.title}</h3>
                  <p>{test.exam} - {test.level}</p>
                  <div className="test-meta">
                    <span><BookOpen size={14} /> {test.questions} Qs</span>
                    <span><Award size={14} /> {test.marks} Marks</span>
                    <span><Clock3 size={14} /> {test.durationMinutes} Mins</span>
                  </div>
                  <div className="tag-list">
                    {test.sections.map((section) => <span key={section}>{section}</span>)}
                  </div>
                  <button
                    type="button"
                    className={unlocked ? "attempt-button" : "lock-button"}
                    onClick={() => openTest(test)}
                  >
                    {unlocked ? <Play size={16} /> : <LockKeyhole size={16} />}
                    {unlocked ? "Attempt Now" : "Unlock Now"}
                  </button>
                </article>
              );
            })}
          </div>
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
                  key={item}
                  onClick={() => {
                    setSearchQuery(item.split(" ")[0]);
                    setActiveCategory("banking");
                    document.getElementById("tests")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <FilePlus2 size={18} />
                  <span>{item}</span>
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
                  key={item}
                  onClick={() => {
                    setSearchQuery(item);
                    setActiveCategory(item.includes("RBI") || item.includes("NICL") ? "regulatory" : "banking");
                    document.getElementById("tests")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <Search size={17} />
                  <span>{item}</span>
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
                        Option {String.fromCharCode(65 + optionIndex)}
                        <input
                          value={option}
                          onChange={(event) => updateQuestionOption(optionIndex, event.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="form-grid two">
                    <label>
                      Correct Answer
                      <select
                        value={questionDraft.answerIndex}
                        onChange={(event) => setQuestionDraft({ ...questionDraft, answerIndex: Number(event.target.value) })}
                      >
                        {[0, 1, 2, 3].map((optionIndex) => (
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

                <button type="submit" className="primary-button publish-button">
                  <ShieldCheck size={16} /> Publish Test
                </button>
              </form>

              <aside className="host-sidebar">
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
                    {hostTests.length === 0 ? (
                      <span className="muted-line">No host tests published yet.</span>
                    ) : hostTests.map((test) => {
                      const attempts = attemptHistory.filter((attempt) => attempt.testId === test.id);
                      return (
                        <article key={test.id}>
                          <div>
                            <strong>{test.title}</strong>
                            <span>{test.exam} - {test.questions} Qs - {attempts.length} attempts</span>
                          </div>
                          <button type="button" onClick={() => deleteHostTest(test.id)} aria-label={`Delete ${test.title}`}>
                            <Trash2 size={15} />
                          </button>
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
