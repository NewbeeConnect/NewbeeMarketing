"use client";

import { useState, useMemo } from "react";
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from "@/hooks/useCalendar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PLATFORMS } from "@/lib/constants";
import type { CalendarEvent } from "@/types/database";

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-gray-100 text-gray-700 border-gray-300",
  ready: "bg-blue-100 text-blue-700 border-blue-300",
  published: "bg-green-100 text-green-700 border-green-300",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const { data: events, isLoading } = useCalendarEvents(monthStr);
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
    const totalDays = lastDay.getDate();

    const days: { date: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        date: d,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        date: d,
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: true,
      });
    }

    // Next month padding (fill to complete last week)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const m = currentMonth + 2 > 12 ? 1 : currentMonth + 2;
        const y = currentMonth + 2 > 12 ? currentYear + 1 : currentYear;
        days.push({
          date: d,
          dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events ?? []) {
      const key = event.scheduled_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEvent.mutateAsync(deleteId);
      toast.success("Event deleted");
      setSelectedEvent(null);
    } catch {
      toast.error("Failed to delete event");
    }
    setDeleteId(null);
  };

  const handleStatusChange = async (event: CalendarEvent, status: string) => {
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: { status: status as "planned" | "ready" | "published" },
      });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <>
      <AppHeader title="Content Calendar" />
      <div className="flex-1 p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Content Calendar</h2>
            <p className="text-sm text-muted-foreground">
              Plan and schedule your content across platforms
            </p>
          </div>
          <Button onClick={() => { setSelectedDate(todayStr); setShowCreate(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-medium min-w-[160px] text-center">
              {monthLabel}
            </h3>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <Card>
            <CardContent className="p-0">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayEvents = eventsByDate.get(day.dateStr) ?? [];
                  const isToday = day.dateStr === todayStr;

                  return (
                    <div
                      key={i}
                      className={`min-h-[100px] border-b border-r p-1.5 cursor-pointer hover:bg-muted/50 transition-colors ${
                        !day.isCurrentMonth ? "bg-muted/30" : ""
                      } ${i % 7 === 6 ? "border-r-0" : ""}`}
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setShowCreate(true);
                      }}
                    >
                      <div
                        className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : day.isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {day.date}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            className={`w-full text-left text-[10px] px-1 py-0.5 rounded truncate border ${STATUS_COLORS[event.status] ?? ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                          >
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-[10px] text-muted-foreground px-1">
                            +{dayEvents.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
            Planned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
            Ready
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />
            Published
          </span>
        </div>
      </div>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        defaultDate={selectedDate ?? todayStr}
        onSubmit={async (data) => {
          try {
            await createEvent.mutateAsync(data);
            toast.success("Event created!");
            setShowCreate(false);
          } catch {
            toast.error("Failed to create event");
          }
        }}
        isPending={createEvent.isPending}
      />

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={STATUS_COLORS[selectedEvent.status]}>
                    {selectedEvent.status}
                  </Badge>
                  {selectedEvent.platform && (
                    <Badge variant="outline">{selectedEvent.platform}</Badge>
                  )}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Date: </span>
                  {new Date(selectedEvent.scheduled_date + "T00:00:00").toLocaleDateString()}
                </div>
                {selectedEvent.notes && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.notes}
                  </p>
                )}
                <div className="space-y-2">
                  <Label className="text-xs">Change Status</Label>
                  <Select
                    value={selectedEvent.status}
                    onValueChange={(v) => handleStatusChange(selectedEvent, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteId(selectedEvent.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this calendar event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CreateEventDialog({
  open,
  onClose,
  defaultDate,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  onSubmit: (data: {
    title: string;
    scheduled_date: string;
    platform?: string;
    notes?: string;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [platform, setPlatform] = useState("");
  const [notes, setNotes] = useState("");

  // Update date when defaultDate changes
  const prevDefault = useState(defaultDate)[0];
  if (prevDefault !== defaultDate) {
    setDate(defaultDate);
  }

  const handleSubmit = async () => {
    if (!title.trim() || !date) return;
    await onSubmit({
      title: title.trim(),
      scheduled_date: date,
      platform: platform || undefined,
      notes: notes.trim() || undefined,
    });
    setTitle("");
    setPlatform("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Calendar Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Instagram Reel - App Launch"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !date || isPending}
          >
            {isPending ? "Adding..." : "Add Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
