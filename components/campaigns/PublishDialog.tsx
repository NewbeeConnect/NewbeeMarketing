"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, DollarSign, Users, Image as ImageIcon } from "lucide-react";

export interface PublishConfig {
  platforms: string[];
  budgetDaily: number;
  budgetTotal: number;
  targeting: {
    ageRange: [number, number];
    locations: string[];
    interests: string[];
    languages: string[];
  };
  creativeCount: number;
}

interface PublishDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  config: PublishConfig;
}

export function PublishDialog({
  open,
  onConfirm,
  onCancel,
  config,
}: PublishDialogProps) {
  const platformLabels: Record<string, string> = {
    google: "Google Ads",
    meta: "Meta Ads",
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Confirm Ad Publish
          </DialogTitle>
          <DialogDescription>
            Review your ad deployment settings before going live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platforms */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Platforms</p>
            <div className="flex gap-2">
              {config.platforms.map((p) => (
                <Badge key={p} variant="secondary">
                  {platformLabels[p] || p}
                </Badge>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              Budget
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Daily: ${config.budgetDaily.toFixed(2)}</p>
              <p>Total: ${config.budgetTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Targeting */}
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Targeting
            </p>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>
                Age: {config.targeting.ageRange[0]} -{" "}
                {config.targeting.ageRange[1]}
              </p>
              {config.targeting.locations.length > 0 && (
                <p>Locations: {config.targeting.locations.join(", ")}</p>
              )}
              {config.targeting.interests.length > 0 && (
                <p>Interests: {config.targeting.interests.join(", ")}</p>
              )}
              {config.targeting.languages.length > 0 && (
                <p>Languages: {config.targeting.languages.join(", ")}</p>
              )}
            </div>
          </div>

          {/* Creatives */}
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              Creatives
            </p>
            <p className="text-sm text-muted-foreground">
              {config.creativeCount} creative
              {config.creativeCount !== 1 ? "s" : ""} selected
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            <Megaphone className="h-4 w-4 mr-2" />
            Confirm & Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
