export type OnboardingSelections = {
  name: string;
  household: string[];
  home: string | null;
  transportation: string[];
  debt: string[];
  regularSpending: string[];
  subscriptions: string[];
  lessFrequent: string[];
  goals: string[];
  funSpending: string[];
};

export const initialSelections: OnboardingSelections = {
  name: "",
  household: [],
  home: null,
  transportation: [],
  debt: [],
  regularSpending: [],
  subscriptions: [],
  lessFrequent: [],
  goals: [],
  funSpending: [],
};

export type StepConfig = {
  key: keyof Omit<OnboardingSelections, "name">;
  title: string;
  emoji: string;
  mode: "single" | "multi";
  options: { id: string; label: string; emoji: string }[];
  skipText?: string;
};

export const steps: StepConfig[] = [
  {
    key: "household",
    title: "Who\u2019s in your household?",
    emoji: "",
    mode: "multi",
    options: [
      { id: "myself", label: "Myself", emoji: "" },
      { id: "partner", label: "My partner", emoji: "" },
      { id: "kids", label: "Kids", emoji: "" },
      { id: "teens", label: "Teens", emoji: "" },
      { id: "other-adults", label: "Other adults", emoji: "" },
      { id: "pets", label: "Pets", emoji: "" },
    ],
  },
  {
    key: "home",
    title: "Tell us about your home",
    emoji: "\ud83c\udfe0",
    mode: "single",
    options: [
      { id: "rent", label: "I rent", emoji: "" },
      { id: "own", label: "I own", emoji: "" },
      { id: "other", label: "Other", emoji: "" },
    ],
  },
  {
    key: "transportation",
    title: "How do you get around?",
    emoji: "\ud83d\ude8b",
    mode: "multi",
    options: [
      { id: "car", label: "Car", emoji: "\ud83d\ude97" },
      { id: "rideshare", label: "Rideshare", emoji: "\ud83d\ude95" },
      { id: "bike", label: "Bike", emoji: "\ud83d\udeb2" },
      { id: "motorcycle", label: "Motorcycle", emoji: "\ud83c\udfcd\ufe0f" },
      { id: "walk", label: "Walk", emoji: "\ud83d\udc4b" },
      { id: "public-transit", label: "Public transit", emoji: "\ud83d\ude8c" },
    ],
    skipText: "None of these apply to me",
  },
  {
    key: "debt",
    title: "Do you currently have any debt?",
    emoji: "",
    mode: "multi",
    options: [
      { id: "credit-card", label: "Credit card", emoji: "\ud83d\udcb3" },
      { id: "medical-debt", label: "Medical debt", emoji: "\ud83c\udfe5" },
      { id: "auto-loans", label: "Auto loans", emoji: "\ud83d\ude97" },
      { id: "bnpl", label: "Buy now, pay later", emoji: "\u231b" },
      { id: "student-loans", label: "Student loans", emoji: "\ud83c\udf93" },
      { id: "personal-loans", label: "Personal loans", emoji: "\ud83d\udcb0" },
    ],
    skipText: "I don\u2019t currently have debt",
  },
  {
    key: "regularSpending",
    title: "Which of these do you regularly spend money on?",
    emoji: "\ud83e\udd14",
    mode: "multi",
    options: [
      { id: "groceries", label: "Groceries", emoji: "\ud83d\uded2" },
      { id: "tv-phone-internet", label: "TV, phone or internet", emoji: "\ud83d\udcbb" },
      { id: "personal-care", label: "Personal care", emoji: "\ud83d\udc87" },
      { id: "clothing", label: "Clothing", emoji: "\ud83d\udc54" },
      { id: "self-storage", label: "Self storage", emoji: "\ud83d\udce6" },
    ],
    skipText: "None of these apply to me",
  },
  {
    key: "subscriptions",
    title: "Which of these subscriptions do you have?",
    emoji: "\ud83c\udf7f",
    mode: "multi",
    options: [
      { id: "music", label: "Music", emoji: "\ud83c\udfb5" },
      { id: "tv-streaming", label: "TV streaming", emoji: "\ud83d\udcfa" },
      { id: "fitness", label: "Fitness", emoji: "\ud83d\udcaa" },
      { id: "other-subs", label: "Other subscriptions", emoji: "\ud83d\udcc4" },
    ],
    skipText: "I don\u2019t subscribe to any of these",
  },
  {
    key: "lessFrequent",
    title: "What less frequent expenses do you need to prepare for?",
    emoji: "\ud83d\udee0\ufe0f",
    mode: "multi",
    options: [
      { id: "cc-fees", label: "Annual credit card fees", emoji: "\ud83d\udcb3" },
      { id: "medical-expenses", label: "Medical expenses", emoji: "\ud83e\ude7a" },
      { id: "taxes", label: "Taxes or other fees", emoji: "\ud83c\udfa8" },
    ],
    skipText: "None of these apply to me",
  },
  {
    key: "goals",
    title: "What goals do you want to prioritize?",
    emoji: "\ud83c\udf34",
    mode: "multi",
    options: [
      { id: "vacation", label: "Dream vacation", emoji: "\ud83c\udfd6\ufe0f" },
      { id: "new-baby", label: "New baby", emoji: "\ud83d\udc76" },
      { id: "new-car", label: "New car", emoji: "\ud83d\ude97" },
      { id: "emergency-fund", label: "Emergency fund", emoji: "\ud83d\ude05" },
      { id: "new-home", label: "New home", emoji: "\ud83c\udfe1" },
      { id: "retirement", label: "Retirement or investments", emoji: "\ud83d\udcb0" },
      { id: "wedding", label: "Wedding", emoji: "\ud83d\udc8d" },
    ],
    skipText: "I don\u2019t save for any of these",
  },
  {
    key: "funSpending",
    title: "What else do you want to include in your plan?",
    emoji: "\u2764\ufe0f",
    mode: "multi",
    options: [
      { id: "dining-out", label: "Dining out", emoji: "\ud83c\udf7d\ufe0f" },
      { id: "holidays-gifts", label: "Holidays & gifts", emoji: "\ud83c\udf81" },
      { id: "entertainment", label: "Entertainment", emoji: "\ud83c\udfa0" },
      { id: "decor-garden", label: "Decor & garden", emoji: "\ud83c\udf3f" },
      { id: "hobbies", label: "Hobbies", emoji: "\ud83e\udde9" },
      { id: "my-spending-money", label: "My spending money", emoji: "\ud83d\udc65" },
      { id: "charity", label: "Charity", emoji: "\ud83d\udc96" },
      { id: "their-spending-money", label: "Their spending money", emoji: "\ud83d\udc65" },
    ],
  },
];

type CategoryDef = { group: string; category: string };

const selectionToCategoryMap: Record<string, CategoryDef[]> = {
  partner: [{ group: "Personal", category: "Their spending money" }],
  kids: [{ group: "Family", category: "Kids activities" }, { group: "Family", category: "School supplies" }],
  teens: [{ group: "Family", category: "Kids activities" }, { group: "Family", category: "School supplies" }],
  pets: [{ group: "Family", category: "Pet care" }],
  rent: [{ group: "Housing", category: "Rent" }, { group: "Housing", category: "Renters insurance" }],
  own: [
    { group: "Housing", category: "Mortgage" },
    { group: "Housing", category: "Home insurance" },
    { group: "Housing", category: "Property taxes" },
    { group: "Housing", category: "Home maintenance" },
  ],
  other: [{ group: "Housing", category: "Housing" }],
  car: [
    { group: "Transportation", category: "Gas/Fuel" },
    { group: "Transportation", category: "Car insurance" },
    { group: "Transportation", category: "Car maintenance" },
  ],
  rideshare: [{ group: "Transportation", category: "Rideshare" }],
  bike: [{ group: "Transportation", category: "Bike maintenance" }],
  motorcycle: [{ group: "Transportation", category: "Motorcycle" }],
  walk: [],
  "public-transit": [{ group: "Transportation", category: "Public transit" }],
  "credit-card": [{ group: "Debt", category: "Credit card payments" }],
  "medical-debt": [{ group: "Debt", category: "Medical debt payments" }],
  "auto-loans": [{ group: "Debt", category: "Auto loan payments" }],
  bnpl: [{ group: "Debt", category: "Buy now, pay later" }],
  "student-loans": [{ group: "Debt", category: "Student loan payments" }],
  "personal-loans": [{ group: "Debt", category: "Personal loan payments" }],
  groceries: [{ group: "Food", category: "Groceries" }],
  "tv-phone-internet": [{ group: "Utilities", category: "TV/Phone/Internet" }],
  "personal-care": [{ group: "Personal", category: "Personal care" }],
  clothing: [{ group: "Shopping", category: "Clothing" }],
  "self-storage": [{ group: "Housing", category: "Self storage" }],
  music: [{ group: "Subscriptions", category: "Music" }],
  "tv-streaming": [{ group: "Subscriptions", category: "TV streaming" }],
  fitness: [{ group: "Subscriptions", category: "Fitness" }],
  "other-subs": [{ group: "Subscriptions", category: "Other subscriptions" }],
  "cc-fees": [{ group: "Less Frequent", category: "Annual credit card fees" }],
  "medical-expenses": [{ group: "Less Frequent", category: "Medical expenses" }],
  taxes: [{ group: "Less Frequent", category: "Taxes or fees" }],
  vacation: [{ group: "Savings Goals", category: "Dream vacation" }],
  "new-baby": [{ group: "Savings Goals", category: "New baby" }],
  "new-car": [{ group: "Savings Goals", category: "New car" }],
  "emergency-fund": [{ group: "Savings Goals", category: "Emergency fund" }],
  "new-home": [{ group: "Savings Goals", category: "New home" }],
  retirement: [{ group: "Savings Goals", category: "Retirement or investments" }],
  wedding: [{ group: "Savings Goals", category: "Wedding" }],
  "dining-out": [{ group: "Food", category: "Dining out" }],
  "holidays-gifts": [{ group: "Personal", category: "Holidays & gifts" }],
  entertainment: [{ group: "Entertainment", category: "Entertainment" }],
  "decor-garden": [{ group: "Home", category: "Decor & garden" }],
  hobbies: [{ group: "Entertainment", category: "Hobbies" }],
  "my-spending-money": [{ group: "Personal", category: "My spending money" }],
  charity: [{ group: "Personal", category: "Charity" }],
  "their-spending-money": [{ group: "Personal", category: "Their spending money" }],
};

export type CategoryTemplateGroup = {
  name: string;
  sortOrder: number;
  categories: { name: string; sortOrder: number; isDefault: boolean }[];
};

export function buildCategoryTemplate(selections: OnboardingSelections): CategoryTemplateGroup[] {
  const allSelectionIds = [
    ...selections.household,
    ...(selections.home ? [selections.home] : []),
    ...selections.transportation,
    ...selections.debt,
    ...selections.regularSpending,
    ...selections.subscriptions,
    ...selections.lessFrequent,
    ...selections.goals,
    ...selections.funSpending,
  ];

  const groupMap = new Map<string, Set<string>>();

  for (const id of allSelectionIds) {
    const defs = selectionToCategoryMap[id];
    if (!defs) continue;
    for (const def of defs) {
      if (!groupMap.has(def.group)) {
        groupMap.set(def.group, new Set());
      }
      groupMap.get(def.group)!.add(def.category);
    }
  }

  if (!groupMap.has("Miscellaneous")) {
    groupMap.set("Miscellaneous", new Set());
  }
  groupMap.get("Miscellaneous")!.add("Uncategorized");

  const groupOrder = [
    "Housing", "Utilities", "Food", "Transportation", "Family",
    "Debt", "Shopping", "Subscriptions", "Entertainment", "Personal",
    "Less Frequent", "Savings Goals", "Home", "Miscellaneous",
  ];

  const template: CategoryTemplateGroup[] = [];
  let sortIdx = 0;

  for (const groupName of groupOrder) {
    const cats = groupMap.get(groupName);
    if (!cats || cats.size === 0) continue;
    template.push({
      name: groupName,
      sortOrder: sortIdx++,
      categories: Array.from(cats).map((name, i) => ({
        name,
        sortOrder: i,
        isDefault: true,
      })),
    });
  }

  return template;
}
