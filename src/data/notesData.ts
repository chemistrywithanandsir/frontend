// Shared mock data for Notes and Dashboard
export type Exam = {
  id: string;
  name: string;
  code: string;
};

export type Chapter = {
  id: string;
  title: string;
  pageCount: number;
  chemistryType: "Organic" | "Inorganic" | "Physical";
  /** PDF URL for purchased notes - used in My Notes viewer and bundle preview */
  pdfUrl?: string;
  /** Optional thumbnail image for this chapter's PDF */
  thumbnailUrl?: string;
};

export type NoteBundle = {
  id: string;
  title: string;
  examCode: string;
  description: string;
  /** Current selling price for the bundle */
  priceInRupees: number;
  /** Optional original price to show a discount badge */
  originalPriceInRupees?: number;
  /** Optional small thumbnail image for cards */
  thumbnailUrl?: string;
  chapters: Chapter[];
};

export const MOCK_EXAMS: Exam[] = [
  { id: "jee-main", name: "JEE Main", code: "JEE MAIN" },
  { id: "jee-advanced", name: "JEE Advanced", code: "JEE ADVANCED" },
  { id: "neet", name: "NEET", code: "NEET" },
  { id: "cbse", name: "CBSE", code: "CBSE" },
];

export const MOCK_LATEST_BUNDLES: NoteBundle[] = [
  {
    id: "bundle-1",
    title: "Complete Physical Chemistry Bundle",
    examCode: "JEE MAIN",
    description: "All PYQs + theory notes for Physical Chemistry.",
    priceInRupees: 499,
    originalPriceInRupees: 799,
    thumbnailUrl: "https://placehold.co/300x180/020617/ffffff?text=Physical+Chem+Bundle",
    chapters: [
      { id: "c1", title: "Mole Concept", pageCount: 32, chemistryType: "Physical" },
      { id: "c2", title: "Atomic Structure", pageCount: 28, chemistryType: "Physical" },
      { id: "c3", title: "Chemical Kinetics", pageCount: 24, chemistryType: "Physical" },
    ],
  },
  {
    id: "bundle-2",
    title: "Organic Chemistry Scoring Topics",
    examCode: "JEE ADVANCED",
    description: "High-yield organic topics with killer questions.",
    priceInRupees: 599,
    originalPriceInRupees: 999,
    thumbnailUrl: "https://placehold.co/300x180/111827/ffffff?text=Organic+Scoring",
    chapters: [
      { id: "c4", title: "GOC & Isomerism", pageCount: 35, chemistryType: "Organic" },
      { id: "c5", title: "Carbonyl Compounds", pageCount: 30, chemistryType: "Organic" },
    ],
  },
  {
    id: "bundle-3",
    title: "NEET One-shot Chemistry Notes",
    examCode: "NEET",
    description: "Crisp, exam-focused notes for fast revision.",
    priceInRupees: 399,
    originalPriceInRupees: 699,
    thumbnailUrl: "https://placehold.co/300x180/1e293b/ffffff?text=NEET+Oneshot",
    chapters: [
      { id: "c6", title: "Biomolecules", pageCount: 20, chemistryType: "Organic" },
      { id: "c7", title: "Coordination Compounds", pageCount: 26, chemistryType: "Inorganic" },
    ],
  },
  {
    id: "bundle-4",
    title: "JEE Main Mixed PYQ Booster",
    examCode: "JEE MAIN",
    description: "500+ mixed PYQs covering Physical, Organic and Inorganic Chemistry.",
    priceInRupees: 449,
    originalPriceInRupees: 799,
    thumbnailUrl: "https://placehold.co/300x180/020617/ffffff?text=Mixed+PYQ+Booster",
    chapters: [
      { id: "c8", title: "Mixed PYQs Set 1", pageCount: 40, chemistryType: "Physical" },
      { id: "c9", title: "Mixed PYQs Set 2", pageCount: 38, chemistryType: "Physical" },
    ],
  },
  {
    id: "bundle-5",
    title: "Revision Flash Notes Pack",
    examCode: "NEET",
    description: "Ultra-crisp flash notes for last 7 days before exam.",
    priceInRupees: 299,
    originalPriceInRupees: 499,
    thumbnailUrl: "https://placehold.co/300x180/0f172a/ffffff?text=Flash+Notes",
    chapters: [
      { id: "c10", title: "Physical Chemistry in 20 Pages", pageCount: 20, chemistryType: "Physical" },
      { id: "c11", title: "Inorganic Must-memorise Points", pageCount: 18, chemistryType: "Inorganic" },
      { id: "c12", title: "Organic Name Reactions Cheat Sheet", pageCount: 16, chemistryType: "Organic" },
    ],
  },
];
