"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getDefaultCategoryTemplate } from "@/lib/category-template";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StepCategoriesProps {
  profileId: Id<"userProfiles">;
  onNext: () => void;
  onBack: () => void;
}

export function StepCategories({
  profileId,
  onNext,
  onBack,
}: StepCategoriesProps) {
  const existingGroups = useQuery(api.categories.listGroupsByUser, {
    userId: profileId,
  });
  const createTemplate = useMutation(api.categories.createDefaultTemplate);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (
      existingGroups !== undefined &&
      existingGroups.length === 0 &&
      !created
    ) {
      const template = getDefaultCategoryTemplate();
      createTemplate({ userId: profileId, template }).then(() =>
        setCreated(true)
      );
    }
  }, [existingGroups, created, createTemplate, profileId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your categories</CardTitle>
        <CardDescription>
          We have set up default categories for you. You can customize these
          later in settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {existingGroups === undefined ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {existingGroups.map((group) => (
              <div key={group._id} className="space-y-2">
                <h3 className="font-semibold text-sm">{group.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.categories.map((cat) => (
                    <Badge key={cat._id} variant="secondary">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!existingGroups || existingGroups.length === 0}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
