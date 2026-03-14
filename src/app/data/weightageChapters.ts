// Chapter lists for weightage (admin input + public graph)
// id: used for storage key; label: display name; chemistryType: Physical | Inorganic | Organic

export type ChemistryType = "Physical" | "Inorganic" | "Organic";

export type ChapterItem = { id: string; label: string; chemistryType: ChemistryType };

export const NEET_CHAPTERS: ChapterItem[] = [
  // Physical Chemistry
  { id: "neet-p-1", label: "UNIT I: Some Basic Concepts in Chemistry", chemistryType: "Physical" },
  { id: "neet-p-2", label: "UNIT 2: Atomic Structure", chemistryType: "Physical" },
  { id: "neet-p-3", label: "UNIT 3: Chemical Bonding and Molecular Structure", chemistryType: "Physical" },
  { id: "neet-p-4", label: "UNIT 4: Chemical Thermodynamics", chemistryType: "Physical" },
  { id: "neet-p-5", label: "UNIT 5: Solutions", chemistryType: "Physical" },
  { id: "neet-p-6", label: "UNIT 6: Equilibrium", chemistryType: "Physical" },
  { id: "neet-p-7", label: "UNIT 7: Redox Reactions and Electrochemistry", chemistryType: "Physical" },
  { id: "neet-p-8", label: "UNIT 8: Chemical Kinetics", chemistryType: "Physical" },
  // Inorganic Chemistry
  { id: "neet-i-9", label: "UNIT 9: Classification of Elements and Periodicity in Properties", chemistryType: "Inorganic" },
  { id: "neet-i-10", label: "UNIT 10: p-Block Elements", chemistryType: "Inorganic" },
  { id: "neet-i-11", label: "UNIT 11: d- and f-Block Elements", chemistryType: "Inorganic" },
  { id: "neet-i-12", label: "UNIT 12: Co-ordination Compounds", chemistryType: "Inorganic" },
  // Organic Chemistry
  { id: "neet-o-13", label: "UNIT 13: Purification and Characterisation of Organic Compounds", chemistryType: "Organic" },
  { id: "neet-o-14", label: "UNIT 14: Some Basic Principles of Organic Chemistry", chemistryType: "Organic" },
  { id: "neet-o-15", label: "UNIT 15: Hydrocarbons", chemistryType: "Organic" },
  { id: "neet-o-16", label: "UNIT 16: Organic Compounds Containing Halogens", chemistryType: "Organic" },
  { id: "neet-o-17", label: "UNIT 17: Organic Compounds Containing Oxygen", chemistryType: "Organic" },
  { id: "neet-o-18", label: "UNIT 18: Organic Compounds Containing Nitrogen", chemistryType: "Organic" },
  { id: "neet-o-19", label: "UNIT 19: Biomolecules", chemistryType: "Organic" },
  { id: "neet-o-20", label: "UNIT 20: Principles Related to Practical Chemistry", chemistryType: "Organic" },
];

export const JEE_MAIN_CHAPTERS: ChapterItem[] = [
  // Physical Chemistry
  { id: "jm-p-1", label: "Some Basic Concepts in Chemistry", chemistryType: "Physical" },
  { id: "jm-p-2", label: "Atomic Structure", chemistryType: "Physical" },
  { id: "jm-p-3", label: "Chemical Bonding and Molecular Structure", chemistryType: "Physical" },
  { id: "jm-p-4", label: "Chemical Thermodynamics", chemistryType: "Physical" },
  { id: "jm-p-5", label: "Solutions", chemistryType: "Physical" },
  { id: "jm-p-6", label: "Equilibrium", chemistryType: "Physical" },
  { id: "jm-p-7", label: "Redox Reactions and Electrochemistry", chemistryType: "Physical" },
  { id: "jm-p-8", label: "Chemical Kinetics", chemistryType: "Physical" },
  // Inorganic Chemistry
  { id: "jm-i-9", label: "Classification of Elements and Periodicity in Properties", chemistryType: "Inorganic" },
  { id: "jm-i-10", label: "p-Block Elements", chemistryType: "Inorganic" },
  { id: "jm-i-11", label: "d- and f-Block Elements", chemistryType: "Inorganic" },
  { id: "jm-i-12", label: "Co-ordination Compounds", chemistryType: "Inorganic" },
  // Organic Chemistry
  { id: "jm-o-13", label: "Purification and Characterisation of Organic Compounds", chemistryType: "Organic" },
  { id: "jm-o-14", label: "Some Basic Principles of Organic Chemistry", chemistryType: "Organic" },
  { id: "jm-o-15", label: "Hydrocarbons", chemistryType: "Organic" },
  { id: "jm-o-16", label: "Organic Compounds Containing Halogens", chemistryType: "Organic" },
  { id: "jm-o-17", label: "Organic Compounds Containing Oxygen", chemistryType: "Organic" },
  { id: "jm-o-18", label: "Organic Compounds Containing Nitrogen", chemistryType: "Organic" },
  { id: "jm-o-19", label: "Biomolecules", chemistryType: "Organic" },
  { id: "jm-o-20", label: "Principles Related to Practical Chemistry", chemistryType: "Organic" },
];

export const JEE_ADVANCED_CHAPTERS: ChapterItem[] = [
  // Physical Chemistry
  { id: "ja-p-1", label: "General topics (Concept of atoms and molecules; Dalton's atomic theory; Mole concept; Chemical formulae; etc.)", chemistryType: "Physical" },
  { id: "ja-p-2", label: "States of Matter: Gases and Liquids", chemistryType: "Physical" },
  { id: "ja-p-3", label: "Atomic Structure", chemistryType: "Physical" },
  { id: "ja-p-4", label: "Chemical Bonding and Molecular Structure", chemistryType: "Physical" },
  { id: "ja-p-5", label: "Chemical Thermodynamics", chemistryType: "Physical" },
  { id: "ja-p-6", label: "Chemical and Ionic Equilibrium", chemistryType: "Physical" },
  { id: "ja-p-7", label: "Electrochemistry", chemistryType: "Physical" },
  { id: "ja-p-8", label: "Chemical Kinetics", chemistryType: "Physical" },
  { id: "ja-p-9", label: "Solid State", chemistryType: "Physical" },
  { id: "ja-p-10", label: "Solutions", chemistryType: "Physical" },
  { id: "ja-p-11", label: "Surface Chemistry", chemistryType: "Physical" },
  // Inorganic Chemistry
  { id: "ja-i-12", label: "Classification of Elements and Periodicity in Properties", chemistryType: "Inorganic" },
  { id: "ja-i-13", label: "Hydrogen", chemistryType: "Inorganic" },
  { id: "ja-i-14", label: "s-Block Elements", chemistryType: "Inorganic" },
  { id: "ja-i-15", label: "p-Block Elements", chemistryType: "Inorganic" },
  { id: "ja-i-16", label: "d-Block Elements", chemistryType: "Inorganic" },
  { id: "ja-i-17", label: "f-Block Elements", chemistryType: "Inorganic" },
  { id: "ja-i-18", label: "Coordination Compounds", chemistryType: "Inorganic" },
  { id: "ja-i-19", label: "Isolation/preparation and properties of the following non-metals: Boron, Silicon, Nitrogen, Phosphorus, Oxygen, Sulphur and Halogens", chemistryType: "Inorganic" },
  { id: "ja-i-20", label: "Isolation/preparation and properties of the following metals: Iron, Zinc, Copper, Silver, Mercury, Aluminium, Magnesium, Lead, Tin, Chromium", chemistryType: "Inorganic" },
  { id: "ja-i-21", label: "Principles of Qualitative Analysis", chemistryType: "Inorganic" },
  // Organic Chemistry
  { id: "ja-o-22", label: "Basic Principles of Organic Chemistry", chemistryType: "Organic" },
  { id: "ja-o-23", label: "Hydrocarbons", chemistryType: "Organic" },
  { id: "ja-o-24", label: "Organic Compounds Containing Halogens (Haloalkanes and Haloarenes)", chemistryType: "Organic" },
  { id: "ja-o-25", label: "Organic Compounds Containing Oxygen (Alcohols, Phenols, Ethers, Aldehydes, Ketones, Carboxylic Acids)", chemistryType: "Organic" },
  { id: "ja-o-26", label: "Organic Compounds Containing Nitrogen (Amines)", chemistryType: "Organic" },
  { id: "ja-o-27", label: "Biomolecules", chemistryType: "Organic" },
  { id: "ja-o-28", label: "Polymers", chemistryType: "Organic" },
  { id: "ja-o-29", label: "Chemistry in Everyday Life", chemistryType: "Organic" },
  { id: "ja-o-30", label: "Practical Organic Chemistry", chemistryType: "Organic" },
];

export const EXAM_CHAPTERS: Record<string, ChapterItem[]> = {
  neet: NEET_CHAPTERS,
  "jee-main": JEE_MAIN_CHAPTERS,
  "jee-advanced": JEE_ADVANCED_CHAPTERS,
};
