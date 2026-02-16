"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CategoryRow } from "./CategoryRow";
import { formatCurrency } from "@/lib/currencies";
import type { Id } from "../../../convex/_generated/dataModel";

interface Category {
  _id: Id<"categories">;
  name: string;
  sortOrder: number;
}

interface CategoryGroupSectionProps {
  groupId: Id<"categoryGroups">;
  groupName: string;
  categories: Category[];
  allocations: Record<string, number>;
  activity: Record<string, number>;
  totalIncome: number;
  currency: string;
  isDeletable: boolean;
  onAssignmentChange: (categoryId: string, amount: number) => void;
  onAssignmentCommit: (categoryId: string, amount: number) => void;
  onAddCategory: (groupId: Id<"categoryGroups">, name: string) => void;
  onRenameGroup: (groupId: Id<"categoryGroups">, name: string) => void;
  onDeleteGroup: (groupId: Id<"categoryGroups">) => void;
  onRenameCategory: (categoryId: Id<"categories">, name: string) => void;
  onDeleteCategory: (categoryId: Id<"categories">) => void;
}

export function CategoryGroupSection({
  groupId,
  groupName,
  categories,
  allocations,
  activity,
  totalIncome,
  currency,
  isDeletable,
  onAssignmentChange,
  onAssignmentCommit,
  onAddCategory,
  onRenameGroup,
  onDeleteGroup,
}: CategoryGroupSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(groupName);

  const groupTotal = categories.reduce(
    (sum, cat) => sum + (allocations[cat._id] ?? 0),
    0
  );

  function handleAddCategory() {
    const trimmed = newCategoryName.trim();
    if (trimmed) {
      onAddCategory(groupId, trimmed);
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  }

  function handleRenameGroup() {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== groupName) {
      onRenameGroup(groupId, trimmed);
    }
    setIsEditingName(false);
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between py-2">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 font-semibold text-sm hover:text-foreground">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {isEditingName ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleRenameGroup}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setIsEditingName(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-40 text-sm font-semibold"
                autoFocus
              />
            ) : (
              <span>{groupName}</span>
            )}
          </button>
        </CollapsibleTrigger>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {formatCurrency(groupTotal, currency)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddingCategory(true)}>
                Add Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setIsEditingName(true); setEditedName(groupName); }}>
                Rename Group
              </DropdownMenuItem>
              {isDeletable && (
                <DropdownMenuItem
                  onClick={() => onDeleteGroup(groupId)}
                  className="text-destructive"
                >
                  Delete Group
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CollapsibleContent>
        <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px] gap-3 text-xs text-muted-foreground px-0 pb-1 border-b mb-1">
          <span>Category</span>
          <span className="text-right">Assigned</span>
          <span className="text-right">Spent</span>
          <span className="text-right">Available</span>
        </div>
        <div className="grid md:hidden grid-cols-[1fr_auto_auto] gap-3 text-xs text-muted-foreground px-0 pb-1 border-b mb-1">
          <span>Category</span>
          <span className="text-right">Assigned</span>
          <span className="text-right">Available</span>
        </div>

        {categories.map((cat) => (
          <CategoryRow
            key={cat._id}
            categoryId={cat._id}
            name={cat.name}
            assigned={allocations[cat._id] ?? 0}
            spent={activity[cat._id] ?? 0}
            totalIncome={totalIncome}
            currency={currency}
            onAssignmentChange={onAssignmentChange}
            onAssignmentCommit={onAssignmentCommit}
          />
        ))}

        {isAddingCategory && (
          <div className="flex items-center gap-2 py-1.5">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
                if (e.key === "Escape") setIsAddingCategory(false);
              }}
              className="h-7 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
