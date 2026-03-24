"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { useGenerateTweets } from "@/hooks/useTweets";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "value_content", label: "Value Content (Tips & Guides)" },
  { value: "community_story", label: "Community Story" },
  { value: "engagement", label: "Engagement (Questions & Polls)" },
  { value: "product_cta", label: "Product CTA" },
  { value: "trend_hack", label: "Trend Hack" },
  { value: "did_you_know", label: "Did You Know? (Facts)" },
  { value: "thread_guide", label: "Thread Guide" },
  { value: "motivation", label: "Motivation" },
];

const LANGUAGES = [
  { value: "en", label: "🇬🇧 English" },
  { value: "tr", label: "🇹🇷 Türkçe" },
  { value: "de", label: "🇩🇪 Deutsch" },
];

export function GenerateTweetsDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("value_content");
  const [language, setLanguage] = useState("en");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);

  const generateMutation = useGenerateTweets();

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({
        category,
        language,
        topic: topic || undefined,
        count,
        threadLength: category === "thread_guide" ? 5 : undefined,
      });
      toast.success(`${count} tweet(s) generated!`);
      setOpen(false);
      setTopic("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Tweets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate AI Tweets</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Topic (optional)</Label>
            <Input
              placeholder="e.g., Anmeldung process, finding housing..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Number of tweets</Label>
            <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 10].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} tweet{n > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
