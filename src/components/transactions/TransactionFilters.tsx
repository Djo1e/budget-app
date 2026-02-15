"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import type { Doc } from "../../../convex/_generated/dataModel";

type CategoryGroup = Doc<"categoryGroups"> & {
  categories: Doc<"categories">[];
};

export interface TransactionFilterValues {
  categoryId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilterValues;
  onFiltersChange: (filters: TransactionFilterValues) => void;
  accounts: Doc<"accounts">[];
  categoryGroups: CategoryGroup[];
}

function activeFilterCount(filters: TransactionFilterValues): number {
  let count = 0;
  if (filters.categoryId) count++;
  if (filters.accountId) count++;
  if (filters.startDate || filters.endDate) count++;
  return count;
}

function FilterControls({
  filters,
  onFiltersChange,
  accounts,
  categoryGroups,
}: TransactionFiltersProps) {
  const allCategories = categoryGroups.flatMap((g) =>
    g.categories.map((c) => ({ ...c, groupName: g.name }))
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={filters.categoryId ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, categoryId: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Account</Label>
        <Select
          value={filters.accountId ?? "all"}
          onValueChange={(v) =>
            onFiltersChange({ ...filters, accountId: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((acct) => (
              <SelectItem key={acct._id} value={acct._id}>
                {acct.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>From</Label>
          <Input
            type="date"
            value={filters.startDate ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                startDate: e.target.value || undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>To</Label>
          <Input
            type="date"
            value={filters.endDate ?? ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                endDate: e.target.value || undefined,
              })
            }
          />
        </div>
      </div>

      {activeFilterCount(filters) > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange({})}
          className="w-full"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

export function TransactionFilters(props: TransactionFiltersProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<TransactionFilterValues>(props.filters);
  const count = activeFilterCount(props.filters);

  function openDrawer() {
    setDraft(props.filters);
    setDrawerOpen(true);
  }

  function applyFilters() {
    props.onFiltersChange(draft);
    setDrawerOpen(false);
  }

  function cancelFilters() {
    setDrawerOpen(false);
  }

  return (
    <>
      {/* Desktop: inline filters */}
      <div className="hidden md:flex items-center gap-3">
        <FilterControls {...props} />
      </div>

      {/* Mobile: button + drawer */}
      <div className="md:hidden">
        <Button variant="outline" size="sm" onClick={openDrawer}>
          <Filter className="h-4 w-4 mr-1" />
          Filter
          {count > 0 && (
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          )}
        </Button>

        <Sheet open={drawerOpen} onOpenChange={(open) => { if (!open) cancelFilters(); }}>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Filter your transactions</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6 space-y-4">
              <FilterControls
                filters={draft}
                onFiltersChange={setDraft}
                accounts={props.accounts}
                categoryGroups={props.categoryGroups}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={cancelFilters} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={applyFilters} className="flex-1">
                  Apply
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
