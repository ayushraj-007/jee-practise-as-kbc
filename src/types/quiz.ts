export type GameMode = 'HOME' | 'KBC_SETUP' | 'BATTLE_SETUP' | 'KBC_PLAY' | 'BATTLE_PLAY' | 'KBC_GAMEOVER' | 'BATTLE_GAMEOVER';

export type QuestionDifficulty = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  difficulty: QuestionDifficulty;
  explanation: string;
  eli10?: string; // Optional preloaded or dynamically fetched ELI10 explanation
  topicTag?: string; // Sub-topic or chapter
}

export interface PrizeLevel {
  level: number;
  amount: number;
  formattedAmount: string;
  isCheckpoint: boolean;
  checkpointName?: string;
}

export interface LifelineState {
  fiftyFifty: boolean;      // true if available, false if used
  audiencePoll: boolean;    // true if available, false if used
  skipQuestion: boolean;    // true if available, false if used
}

export interface BattlePlayer {
  id: 'p1' | 'p2';
  name: string;
  hp: number;
  maxHp: number;
  correctCount: number;
  damageDealt: number;
  avatarSeed: number;
}

export const TOPICS = [
  'JEE Mixed (PCM)',
  'JEE Physics',
  'JEE Chemistry',
  'JEE Mathematics',
] as const;

export type TopicType = typeof TOPICS[number];

export const LANGUAGES = ['English', 'Hinglish'] as const;
export type LanguageType = typeof LANGUAGES[number];

export type SetupTab = 'SUBJECTS' | 'CUSTOM' | 'NOTES';

export interface QuestionSessionResult {
  questionNumber: number;
  question: string;
  topicTag: string;
  difficulty: QuestionDifficulty;
  userChoice: string;
  correctChoice: string;
  isCorrect: boolean;
  explanation: string;
}

export interface WeakTopicItem {
  topic: string;
  mistakeReason: string;
  revisionTip: string;
  formula: string;
}

export interface WeakTopicReport {
  overallScore: number;
  correctCount: number;
  totalQuestions: number;
  masteredTopics: string[];
  weakTopics: WeakTopicItem[];
  hostVerdict: string;
}

export const PRIZE_LADDER: PrizeLevel[] = [
  { level: 1, amount: 1000, formattedAmount: '₹ 1,000', isCheckpoint: false },
  { level: 2, amount: 2000, formattedAmount: '₹ 2,000', isCheckpoint: false },
  { level: 3, amount: 3000, formattedAmount: '₹ 3,000', isCheckpoint: false },
  { level: 4, amount: 5000, formattedAmount: '₹ 5,000', isCheckpoint: false },
  { level: 5, amount: 10000, formattedAmount: '₹ 10,000', isCheckpoint: true, checkpointName: 'Padav 1' },
  { level: 6, amount: 20000, formattedAmount: '₹ 20,000', isCheckpoint: false },
  { level: 7, amount: 40000, formattedAmount: '₹ 40,000', isCheckpoint: false },
  { level: 8, amount: 80000, formattedAmount: '₹ 80,000', isCheckpoint: false },
  { level: 9, amount: 160000, formattedAmount: '₹ 1,60,000', isCheckpoint: false },
  { level: 10, amount: 320000, formattedAmount: '₹ 3,20,000', isCheckpoint: true, checkpointName: 'Padav 2' },
  { level: 11, amount: 640000, formattedAmount: '₹ 6,40,000', isCheckpoint: false },
  { level: 12, amount: 1250000, formattedAmount: '₹ 12,50,000', isCheckpoint: false },
  { level: 13, amount: 2500000, formattedAmount: '₹ 25,00,000', isCheckpoint: false },
  { level: 14, amount: 5000000, formattedAmount: '₹ 50,00,000', isCheckpoint: false },
  { level: 15, amount: 10000000, formattedAmount: '₹ 1,00,00,000', isCheckpoint: true, checkpointName: 'Maha Crore' },
];
