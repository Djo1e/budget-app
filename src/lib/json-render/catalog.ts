import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react";
import { z } from "zod/v4";

export const catalog = defineCatalog(schema, {
  components: {
    Card: {
      props: z.object({
        title: z.string().optional(),
        variant: z.enum(["default", "success", "warning", "destructive"]).optional(),
      }),
      slots: ["default"],
      description: "Container card for grouping content",
    },
    Text: {
      props: z.object({
        content: z.string(),
        weight: z.enum(["normal", "medium", "bold"]).optional(),
        size: z.enum(["sm", "base", "lg", "xl"]).optional(),
        color: z.enum(["default", "muted", "success", "warning", "destructive"]).optional(),
      }),
      description: "Text block with optional styling",
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        trend: z.enum(["up", "down", "flat"]).optional(),
        color: z.enum(["default", "success", "warning", "destructive"]).optional(),
      }),
      description: "Display a single metric with label, value, and optional trend",
    },
    Table: {
      props: z.object({
        columns: z.array(z.object({
          key: z.string(),
          label: z.string(),
          align: z.enum(["left", "center", "right"]).optional(),
        })),
        rows: z.array(z.record(z.string(), z.string())),
      }),
      description: "Data table with columns and rows",
    },
    ProgressBar: {
      props: z.object({
        label: z.string(),
        current: z.number(),
        max: z.number(),
        format: z.enum(["currency", "percent"]).optional(),
        color: z.enum(["default", "success", "warning", "destructive"]).optional(),
      }),
      description: "Progress bar showing current vs max value",
    },
    BarChart: {
      props: z.object({
        title: z.string().optional(),
        bars: z.array(z.object({
          label: z.string(),
          value: z.number(),
          secondaryValue: z.number().optional(),
          color: z.enum(["default", "success", "warning", "destructive"]).optional(),
        })),
        format: z.enum(["currency", "percent", "number"]).optional(),
      }),
      description: "Horizontal bar chart comparing values",
    },
    ActionButton: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["default", "outline", "destructive"]).optional(),
        size: z.enum(["sm", "default"]).optional(),
      }),
      description: "Button that triggers an action when clicked",
    },
    Divider: {
      props: z.object({}),
      description: "Horizontal divider line",
    },
    Stack: {
      props: z.object({
        direction: z.enum(["vertical", "horizontal"]).optional(),
        gap: z.enum(["sm", "md", "lg"]).optional(),
      }),
      slots: ["default"],
      description: "Layout container that stacks children vertically or horizontally",
    },
    TransactionConfirm: {
      props: z.object({
        amount: z.string(),
        payee: z.string(),
        category: z.string().optional(),
        account: z.string().optional(),
        date: z.string().optional(),
        type: z.enum(["expense", "income"]).optional(),
      }),
      description: "Transaction confirmation card with Confirm/Cancel actions",
    },
    BudgetMoveConfirm: {
      props: z.object({
        amount: z.string(),
        fromCategory: z.string(),
        toCategory: z.string(),
        month: z.string().optional(),
      }),
      description: "Budget reallocation confirmation card",
    },
    AllocationConfirm: {
      props: z.object({
        category: z.string(),
        amount: z.string(),
        month: z.string().optional(),
      }),
      description: "Budget allocation confirmation card",
    },
    SuggestionCard: {
      props: z.object({
        title: z.string(),
        description: z.string(),
        actionLabel: z.string().optional(),
      }),
      description: "Dismissable suggestion card with optional action button",
    },
    AllocationTable: {
      props: z.object({
        title: z.string().optional(),
        rows: z.array(z.object({
          category: z.string(),
          categoryId: z.string(),
          lastMonthSpent: z.string(),
          suggested: z.string(),
        })),
        totalIncome: z.string(),
        totalSuggested: z.string(),
      }),
      description: "Interactive allocation table for smart month setup with editable amounts",
    },
  },
  actions: {
    confirm_transaction: {
      params: z.object({
        amount: z.number(),
        payeeName: z.string(),
        categoryName: z.string().optional(),
        accountName: z.string().optional(),
        date: z.string().optional(),
        type: z.enum(["expense", "income"]).optional(),
      }),
      description: "Confirm and create a transaction",
    },
    confirm_budget_move: {
      params: z.object({
        amount: z.number(),
        fromCategoryName: z.string(),
        toCategoryName: z.string(),
        month: z.string(),
      }),
      description: "Confirm moving budget between categories",
    },
    confirm_allocation: {
      params: z.object({
        categoryName: z.string(),
        amount: z.number(),
        month: z.string(),
      }),
      description: "Confirm setting a budget allocation",
    },
    apply_suggested_budget: {
      params: z.object({
        allocations: z.array(z.object({
          categoryId: z.string(),
          amount: z.number(),
        })),
        month: z.string(),
      }),
      description: "Apply all suggested budget allocations for a month",
    },
    dismiss: {
      params: z.object({}),
      description: "Dismiss a suggestion card",
    },
  },
});
