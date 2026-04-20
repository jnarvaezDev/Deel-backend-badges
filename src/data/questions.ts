export type RouteKey = "talent" | "champion" | "leader";

export type QuestionOption = {
  label: string;
  text: string;
  points: number;
};

export type Question = {
  id: string;
  text: string;
  options: QuestionOption[];
};

export const entryQuestion: Question = {
  id: "entry",
  text: "Have you ever worked for a company that operates in more than one country?",
  options: [
    { label: "A", text: "No, not yet", points: 0 },
    { label: "B", text: "Yes, as part of a team", points: 0 },
    { label: "C", text: "Yes, and I manage or coordinate people across countries", points: 0 },
  ],
};

export const routeMapByEntryLabel: Record<string, RouteKey> = {
  A: "talent",
  B: "champion",
  C: "leader",
};

export const talentQuestions: Question[] = [
  {
    id: "talent_q1",
    text: "Do you work professionally in English or another internationally-used language?",
    options: [
      { label: "A", text: "No", points: 0 },
      { label: "B", text: "Yes, occasionally", points: 1 },
      { label: "C", text: "Yes, regularly", points: 2 },
      { label: "D", text: "Yes, it is my primary work language", points: 3 },
    ],
  },
  {
    id: "talent_q2",
    text: "Have you had meaningful international exposure in your personal or professional life?",
    options: [
      { label: "A", text: "No, not yet", points: 0 },
      { label: "B", text: "Yes — through international travel or living abroad", points: 2 },
      { label: "C", text: "Yes — through study or exchange programs, or academic international contact", points: 2 },
      { label: "D", text: "Yes — through working directly with international colleagues, clients, or vendors", points: 3 },
    ],
  },
  {
    id: "talent_q3",
    text: "A new contact sends you a voice note instead of a written message. You expected a written brief. What do you do?",
    options: [
      { label: "A", text: "I ask them to resend it in writing — I need to be able to refer back to it", points: 1 },
      { label: "B", text: "I listen, take my own notes, and move forward without saying anything", points: 2 },
      { label: "C", text: "I reply by voice note too, matching their format", points: 3 },
      { label: "D", text: "I transcribe the key points myself and confirm in writing to close the loop", points: 3 },
    ],
  },
  {
    id: "talent_q4",
    text: "You are collaborating with someone whose feedback style feels much more indirect than yours. After a call, you are not sure if they agreed or were just being polite. What do you do?",
    options: [
      { label: "A", text: "I follow up with a direct email asking them to confirm their position clearly", points: 1 },
      { label: "B", text: "I send a written summary of what I understood and ask them to correct anything", points: 3 },
      { label: "C", text: "I ask a mutual contact who knows them better to help me read the situation", points: 2 },
      { label: "D", text: "I accept the ambiguity and move forward — I will course-correct later if needed", points: 1 },
    ],
  },
  {
    id: "talent_q5",
    text: "You are working on a project with someone in a very different time zone. Decisions keep getting delayed because you are rarely online at the same time. What do you do?",
    options: [
      { label: "A", text: "I suggest we establish fixed overlap hours and use them for all key decisions", points: 2 },
      { label: "B", text: "I start sending more detailed written updates so they have full context without needing a call", points: 3 },
      { label: "C", text: "I document my reasoning in writing and give them authority to decide while I am offline", points: 3 },
      { label: "D", text: "I escalate to a manager — this is a process problem, not something I should fix alone", points: 0 },
    ],
  },
  {
    id: "talent_q6",
    text: "Are you actively pursuing international work opportunities?",
    options: [
      { label: "A", text: "Not currently", points: 0 },
      { label: "B", text: "I am open to it", points: 1 },
      { label: "C", text: "Yes, I am actively applying", points: 2 },
      { label: "D", text: "Yes, I am already in conversations with international companies", points: 3 },
    ],
  },
];

export const championQuestions: Question[] = [
  {
    id: "champion_q1",
    text: "How long have you worked (or did you work) at an international company?",
    options: [
      { label: "A", text: "Less than 6 months", points: 0 },
      { label: "B", text: "6 to 12 months", points: 1 },
      { label: "C", text: "1 to 3 years", points: 2 },
      { label: "D", text: "More than 3 years", points: 3 },
    ],
  },
  {
    id: "champion_q2",
    text: "How would you describe your English proficiency in a work context?",
    options: [
      { label: "A", text: "Basic — I can understand but struggle to communicate fluently", points: 0 },
      { label: "B", text: "Intermediate — I communicate, but with effort", points: 1 },
      { label: "C", text: "Advanced — I work comfortably in English every day", points: 2 },
      { label: "D", text: "Fluent or native — English is my primary or equal work language", points: 3 },
    ],
  },
  {
    id: "champion_q3",
    text: "In how many countries does your company currently operate?",
    options: [
      { label: "A", text: "2 to 3", points: 1 },
      { label: "B", text: "4 to 6", points: 2 },
      { label: "C", text: "7 to 15", points: 2 },
      { label: "D", text: "16 or more", points: 3 },
    ],
  },
  {
    id: "champion_q4",
    text: "Have you worked directly with colleagues or teams based in regions of the world other than your own?",
    options: [
      { label: "A", text: "No, my contacts have all been in my home region", points: 0 },
      { label: "B", text: "Yes, with 1 other world region", points: 1 },
      { label: "C", text: "Yes, with 2 other world regions", points: 2 },
      { label: "D", text: "Yes, with 3 or more world regions", points: 3 },
    ],
  },
  {
    id: "champion_q5",
    text: "How familiar are you with async communication practices in distributed teams?",
    options: [
      { label: "A", text: "Not familiar — I mostly work in real-time, same time zone", points: 0 },
      { label: "B", text: "Somewhat familiar — I have used tools like Slack or email across time zones", points: 1 },
      { label: "C", text: "Familiar — I actively adjust how I communicate based on time zone differences", points: 2 },
      { label: "D", text: "Very familiar — async-first communication is how I work by default", points: 2 },
    ],
  },
];

export const leaderQuestions: Question[] = [
  {
    id: "leader_q1",
    text: "How many direct reports do you currently manage (or have you managed) who are based in countries other than your own?",
    options: [
      { label: "A", text: "None — my team is in my home country", points: 0 },
      { label: "B", text: "1 person in another country", points: 0 },
      { label: "C", text: "2 to 4 people in other countries", points: 2 },
      { label: "D", text: "5 or more people in other countries", points: 3 },
    ],
  },
  {
    id: "leader_q2",
    text: "How would you describe your team's cultural composition?",
    options: [
      { label: "A", text: "Mostly one culture or nationality", points: 0 },
      { label: "B", text: "Two or three different nationalities", points: 1 },
      { label: "C", text: "Diverse — four or more nationalities", points: 2 },
      { label: "D", text: "Highly diverse — many backgrounds, languages, and work styles", points: 3 },
    ],
  },
  {
    id: "leader_q3",
    text: "What best describes your decision-making role in global projects?",
    options: [
      { label: "A", text: "I contribute but do not own decisions", points: 0 },
      { label: "B", text: "I own decisions for my area only", points: 1 },
      { label: "C", text: "I coordinate decisions across teams in different countries", points: 2 },
      { label: "D", text: "I lead or define strategy across geographies", points: 3 },
    ],
  },
  {
    id: "leader_q4",
    text: "In how many world regions have you led or coordinated work?",
    options: [
      { label: "A", text: "1 region only", points: 0 },
      { label: "B", text: "2 regions", points: 1 },
      { label: "C", text: "3 regions", points: 2 },
      { label: "D", text: "4 or more regions", points: 3 },
    ],
  },
];

export const questionsByRoute: Record<RouteKey, Question[]> = {
  talent: talentQuestions,
  champion: championQuestions,
  leader: leaderQuestions,
};