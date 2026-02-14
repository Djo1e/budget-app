export type CategoryTemplate = {
  name: string;
  sortOrder: number;
  categories: {
    name: string;
    sortOrder: number;
    isDefault: boolean;
  }[];
};

export function getDefaultCategoryTemplate(): CategoryTemplate[] {
  return [
    {
      name: "Housing",
      sortOrder: 0,
      categories: [
        { name: "Rent/Mortgage", sortOrder: 0, isDefault: true },
        { name: "Home Insurance", sortOrder: 1, isDefault: true },
        { name: "Home Maintenance", sortOrder: 2, isDefault: true },
      ],
    },
    {
      name: "Utilities",
      sortOrder: 1,
      categories: [
        { name: "Electricity", sortOrder: 0, isDefault: true },
        { name: "Water", sortOrder: 1, isDefault: true },
        { name: "Internet", sortOrder: 2, isDefault: true },
        { name: "Phone", sortOrder: 3, isDefault: true },
      ],
    },
    {
      name: "Food",
      sortOrder: 2,
      categories: [
        { name: "Groceries", sortOrder: 0, isDefault: true },
        { name: "Dining Out", sortOrder: 1, isDefault: true },
      ],
    },
    {
      name: "Transportation",
      sortOrder: 3,
      categories: [
        { name: "Gas/Fuel", sortOrder: 0, isDefault: true },
        { name: "Public Transit", sortOrder: 1, isDefault: true },
        { name: "Car Insurance", sortOrder: 2, isDefault: true },
      ],
    },
    {
      name: "Health",
      sortOrder: 4,
      categories: [
        { name: "Health Insurance", sortOrder: 0, isDefault: true },
        { name: "Doctor/Dentist", sortOrder: 1, isDefault: true },
        { name: "Medications", sortOrder: 2, isDefault: true },
      ],
    },
    {
      name: "Entertainment",
      sortOrder: 5,
      categories: [
        { name: "Streaming Services", sortOrder: 0, isDefault: true },
        { name: "Hobbies", sortOrder: 1, isDefault: true },
      ],
    },
    {
      name: "Shopping",
      sortOrder: 6,
      categories: [
        { name: "Clothing", sortOrder: 0, isDefault: true },
        { name: "Electronics", sortOrder: 1, isDefault: true },
      ],
    },
    {
      name: "Financial",
      sortOrder: 7,
      categories: [
        { name: "Savings", sortOrder: 0, isDefault: true },
        { name: "Investments", sortOrder: 1, isDefault: true },
        { name: "Debt Payments", sortOrder: 2, isDefault: true },
      ],
    },
    {
      name: "Personal",
      sortOrder: 8,
      categories: [
        { name: "Education", sortOrder: 0, isDefault: true },
        { name: "Gifts", sortOrder: 1, isDefault: true },
      ],
    },
    {
      name: "Miscellaneous",
      sortOrder: 9,
      categories: [
        { name: "Uncategorized", sortOrder: 0, isDefault: true },
        { name: "Other", sortOrder: 1, isDefault: true },
      ],
    },
  ];
}
