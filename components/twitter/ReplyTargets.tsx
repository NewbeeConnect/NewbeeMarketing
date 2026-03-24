"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Search, Users, MessageSquare } from "lucide-react";

const TARGET_ACCOUNTS = [
  { handle: "SimpleGermany", desc: "Expat tips & guides", followers: "50K+", priority: "high" },
  { handle: "AllAboutBerlin", desc: "Berlin living guide", followers: "30K+", priority: "high" },
  { handle: "GermanyVisa", desc: "Visa & immigration", followers: "20K+", priority: "high" },
  { handle: "DW_Turkce", desc: "Deutsche Welle Türkçe", followers: "500K+", priority: "medium" },
  { handle: "InterNations", desc: "Global expat network", followers: "100K+", priority: "medium" },
  { handle: "MakeItInGermany", desc: "Official DE portal", followers: "80K+", priority: "medium" },
  { handle: "StudyInGermany", desc: "Student immigration", followers: "40K+", priority: "medium" },
  { handle: "ExpatFocus", desc: "Expat community", followers: "15K+", priority: "low" },
  { handle: "LiveWorkGermany", desc: "Jobs & career", followers: "10K+", priority: "low" },
  { handle: "RedditGermany", desc: "Reddit Germany posts", followers: "5K+", priority: "low" },
];

const SEARCH_QUERIES = [
  { query: "moving to Germany", emoji: "🇩🇪", desc: "People planning to move" },
  { query: "expat Germany help", emoji: "🆘", desc: "Expats seeking help" },
  { query: "Anmeldung OR Ausländerbehörde", emoji: "📋", desc: "Bureaucracy struggles" },
  { query: "new in Berlin OR new in Munich OR new in Frankfurt", emoji: "🏙️", desc: "New arrivals in cities" },
  { query: "Germany visa rejected OR visa waiting", emoji: "😰", desc: "Visa frustrations" },
  { query: "#ExpatLife Germany", emoji: "✈️", desc: "Expat community posts" },
  { query: "looking for friends Germany", emoji: "🤝", desc: "Lonely expats" },
  { query: "German bureaucracy", emoji: "😤", desc: "Bureaucracy complaints" },
  { query: "Almanya'ya taşınmak OR Almanya vize", emoji: "🇹🇷", desc: "Turkish expat queries" },
  { query: "Deutschland Einwanderung OR neu in Deutschland", emoji: "🇩🇪", desc: "German-language queries" },
];

const PRIORITY_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

export function ReplyTargets() {
  return (
    <div className="space-y-4">
      {/* Search Queries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Reply Targets — Search Queries
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Click to search X for these queries. Reply to 2-3 tweets from each search daily.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {SEARCH_QUERIES.map((item) => (
            <div key={item.query} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{item.emoji}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.desc}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.query}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 shrink-0" asChild>
                <a
                  href={`https://x.com/search?q=${encodeURIComponent(item.query)}&f=live`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Target Accounts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Reply Targets — Accounts
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Reply to recent tweets from these accounts. Add value, don't just promote.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {TARGET_ACCOUNTS.map((account) => (
            <div key={account.handle} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={PRIORITY_COLORS[account.priority]} className="text-xs shrink-0">
                  {account.priority}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm font-medium">@{account.handle}</p>
                  <p className="text-xs text-muted-foreground">{account.desc} · {account.followers}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 shrink-0" asChild>
                <a
                  href={`https://x.com/${account.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reply Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reply Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• <strong>Add value first</strong> — answer their question, share experience</p>
          <p>• <strong>Never link in replies</strong> — say "check our bio" instead</p>
          <p>• <strong>Be human</strong> — use "we", "our team", share genuine tips</p>
          <p>• <strong>20 replies/day target</strong> — 2 per search query</p>
          <p>• <strong>Best times:</strong> 08-09, 12-13, 18-19 CET</p>
          <p>• <strong>Reply to recent tweets</strong> — within last 6 hours for visibility</p>
        </CardContent>
      </Card>
    </div>
  );
}
