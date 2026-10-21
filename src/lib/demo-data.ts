export type Contestant = { id: string; name: string; quizScore: number; bugScore: number; avatar: string };
export type Prize = { id: number; name: string; category: string; winner: string; status: "Available" | "Reserved" | "Handed over" };

export const initialContestants: Contestant[] = [
  { id: "p1", name: "Ada N.", quizScore: 280, bugScore: 82, avatar: "AN" },
  { id: "p2", name: "Tunde K.", quizScore: 260, bugScore: 91, avatar: "TK" },
  { id: "p3", name: "Zara M.", quizScore: 240, bugScore: 76, avatar: "ZM" },
  { id: "p4", name: "David O.", quizScore: 220, bugScore: 88, avatar: "DO" },
  { id: "p5", name: "Imani A.", quizScore: 180, bugScore: 69, avatar: "IA" }
];

export const quizQuestions = [
  {
    id: 1,
    category: "JavaScript fundamentals",
    prompt: "What is the safest first step before calling a method on a value that may be null?",
    options: [
      "Convert the value to a string",
      "Check whether the value is null or undefined",
      "Wrap every method call in a loop",
      "Use parseInt() on the value"
    ],
    correctIndex: 1,
    explanation: "A nullish check prevents invalid property access and can also prevent downstream NaN-related errors when calculations depend on the value."
  },
  {
    id: 2,
    category: "Web security",
    prompt: "Which practice best protects a secret API key in a Next.js application?",
    options: [
      "Prefix it with NEXT_PUBLIC_",
      "Store it in a client component",
      "Keep it server-side in a secret environment variable",
      "Encode it with Base64 in the UI"
    ],
    correctIndex: 2,
    explanation: "Secrets must stay on the server and must never be bundled into client-side code."
  },
  {
    id: 3,
    category: "Databases",
    prompt: "What is the primary purpose of a database unique constraint for quiz answers?",
    options: [
      "Make the leaderboard colorful",
      "Prevent duplicate accepted answers for the same question and participant",
      "Increase the timer duration",
      "Hide the question text"
    ],
    correctIndex: 1,
    explanation: "A unique constraint protects data integrity even when concurrent requests arrive."
  }
];

export const bugChallenges = [
  {
    id: "BUG-01",
    title: "The Null Trap",
    difficulty: "Beginner",
    language: "JavaScript",
    points: 100,
    time: "12 min",
    prompt: "This function sometimes returns NaN and occasionally throws when the input is missing. Identify the bug and submit a safe fix.",
    code: `function calculateTotal(price, quantity) {\n  return price * quantity;\n}\n\nconsole.log(calculateTotal(null, 4));\nconsole.log(calculateTotal(undefined, 4));`,
    hint: "Consider nullish values, type validation, and what the function should do for invalid input."
  },
  {
    id: "BUG-02",
    title: "Unsafe Query Builder",
    difficulty: "Intermediate",
    language: "TypeScript",
    points: 150,
    time: "18 min",
    prompt: "Review the query construction and explain the vulnerability, likely impact, and a safer remediation.",
    code: `const sql = \`SELECT * FROM users WHERE name = '\${input}'\`;\nreturn db.query(sql);`,
    hint: "Think about untrusted input crossing a boundary into an interpreter."
  }
];

export const initialPrizes: Prize[] = [
  { id: 1, name: "Arduino #1", category: "Quiz Champion", winner: "—", status: "Available" },
  { id: 2, name: "Arduino #2", category: "Best Bug Fix", winner: "—", status: "Available" },
  { id: 3, name: "Arduino #3", category: "Best Explanation", winner: "—", status: "Available" },
  { id: 4, name: "Arduino #4", category: "Quiz Runner-up", winner: "—", status: "Available" },
  { id: 5, name: "Arduino #5", category: "Community Hero", winner: "—", status: "Available" }
];
