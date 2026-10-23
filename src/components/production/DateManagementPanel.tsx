import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Lock } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getBlockedDates,
  blockDate,
  unblockDate,
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/services/productionCalendarService";
import type { BlockedDateEntity, HolidayEntity, BlockDateRequest, HolidayRequest } from "@/types/productionCalendar";
import toast from "react-hot-toast";

/**
 * Date & Holiday Management panel.
 * Lets OWNER/ADMIN lock dates and manage shop holidays.
 */
export default function DateManagementPanel() {
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntity[]>([]);
  const [holidays, setHolidays] = useState<HolidayEntity[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);

  // Block date dialog state
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockForm, setBlockForm] = useState<BlockDateRequest>({
    date: "",
    reason: "",
    deliveryAllowed: false,
    workersWorking: false,
    capacityPercentage: 0,
  });

  // Holiday dialog state
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayEntity | null>(null);
  const [holidayForm, setHolidayForm] = useState<HolidayRequest>({
    date: "",
    name: "",
    description: "",
    deliveryAllowed: false,
    workersWorking: false,
    capacityPercentage: 0,
    recurring: false,
  });

  useEffect(() => {
    loadBlockedDates();
    loadHolidays();
  }, []);

  const loadBlockedDates = async () => {
    setLoadingBlocked(true);
    try {
      const data = await getBlockedDates();
      setBlockedDates(data);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const loadHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const data = await getHolidays();
      setHolidays(data);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleBlockDate = async () => {
    if (!blockForm.date) { toast.error("Please select a date"); return; }
    try {
      await blockDate(blockForm);
      toast.success("Date blocked successfully");
      setShowBlockDialog(false);
      setBlockForm({ date: "", reason: "", deliveryAllowed: false, workersWorking: false, capacityPercentage: 0 });
      loadBlockedDates();
    } catch {
      toast.error("Failed to block date");
    }
  };

  const handleUnblockDate = async (id: number) => {
    try {
      await unblockDate(id);
      toast.success("Date unblocked");
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Failed to unblock date");
    }
  };

  const openHolidayDialog = (holiday?: HolidayEntity) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setHolidayForm({
        date: holiday.holidayDate,
        name: holiday.name,
        description: holiday.description ?? "",
        deliveryAllowed: holiday.deliveryAllowed,
        workersWorking: holiday.workersWorking,
        capacityPercentage: holiday.capacityPercentage,
        recurring: holiday.recurring,
      });
    } else {
      setEditingHoliday(null);
      setHolidayForm({ date: "", name: "", description: "", deliveryAllowed: false, workersWorking: false, capacityPercentage: 0, recurring: false });
    }
    setShowHolidayDialog(true);
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.date || !holidayForm.name) { toast.error("Date and name are required"); return; }
    try {
      if (editingHoliday) {
        await updateHoliday(editingHoliday.id, holidayForm);
        toast.success("Holiday updated");
      } else {
        await createHoliday(holidayForm);
        toast.success("Holiday added");
      }
      setShowHolidayDialog(false);
      loadHolidays();
    } catch {
      toast.error("Failed to save holiday");
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await deleteHoliday(id);
      toast.success("Holiday removed");
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch {
      toast.error("Failed to delete holiday");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* BLOCKED DATES */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  Blocked Delivery Dates
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Prevent new order deliveries from being scheduled on specific dates.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowBlockDialog(true)} className="gap-1.5 rounded-xl">
                <Plus className="w-3.5 h-3.5" /> Lock Date
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingBlocked ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-muted/60 animate-pulse" />
                ))}
              </div>
            ) : blockedDates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/25 py-8 text-center">
                <p className="text-sm text-muted-foreground">No blocked dates.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {blockedDates.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/35 px-3.5 py-2.5 transition hover:bg-muted/55"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {format(parseISO(b.blockedDate), "EEEE, d MMM yyyy")}
                      </p>
                      {b.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">{b.reason}</p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/12"
                      onClick={() => handleUnblockDate(b.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* HOLIDAYS */}
        <Card className="border-border/80 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    🎉
                  </div>
                  Holidays & Shop Closures
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure festival holidays, worker off-days, and custom capacity.
                </p>
              </div>
              <Button size="sm" onClick={() => openHolidayDialog()} className="gap-1.5 rounded-xl">
                <Plus className="w-3.5 h-3.5" /> Add Holiday
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHolidays ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-muted/60 animate-pulse" />
                ))}
              </div>
            ) : holidays.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/25 py-8 text-center">
                <p className="text-sm text-muted-foreground">No holidays configured.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {holidays.map((h) => (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between rounded-xl border border-purple-500/25 bg-purple-500/8 dark:bg-purple-500/12 px-3.5 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(h.holidayDate), "d MMM yyyy")}
                        {h.recurring ? " · Recurring" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {!h.deliveryAllowed && (
                          <Badge
                            variant="outline"
                            className="text-[11px] bg-rose-500/12 text-rose-600 dark:text-rose-300 border-rose-500/30"
                          >
                            No Delivery
                          </Badge>
                        )}
                        {!h.workersWorking && (
                          <Badge
                            variant="outline"
                            className="text-[11px] bg-muted text-muted-foreground border-border"
                          >
                            Workers Off
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openHolidayDialog(h)}>
                        Edit
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/12"
                        onClick={() => handleDeleteHoliday(h.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BLOCK DATE DIALOG */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lock Delivery Date</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <DatePicker value={blockForm.date} onChange={(newDate) => setBlockForm(f => ({ ...f, date: newDate }))} />
            </div>
            <div>
              <Label>Reason</Label>
              <Input placeholder="E.g., Shop event, equipment maintenance..." value={blockForm.reason ?? ""} onChange={(e) => setBlockForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Workers working?</Label>
              <Switch checked={blockForm.workersWorking} onCheckedChange={(v) => setBlockForm(f => ({ ...f, workersWorking: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>Cancel</Button>
            <Button onClick={handleBlockDate}>Lock Date</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HOLIDAY DIALOG */}
      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingHoliday ? "Edit Holiday" : "Add Holiday"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <DatePicker value={holidayForm.date} onChange={(newDate) => setHolidayForm(f => ({ ...f, date: newDate }))} />
            </div>
            <div>
              <Label>Name</Label>
              <Input placeholder="Diwali, Holi, Sunday..." value={holidayForm.name} onChange={(e) => setHolidayForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input placeholder="Additional details..." value={holidayForm.description ?? ""} onChange={(e) => setHolidayForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Delivery allowed?</Label>
              <Switch checked={holidayForm.deliveryAllowed} onCheckedChange={(v) => setHolidayForm(f => ({ ...f, deliveryAllowed: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Workers working?</Label>
              <Switch checked={holidayForm.workersWorking} onCheckedChange={(v) => setHolidayForm(f => ({ ...f, workersWorking: v }))} />
            </div>
            <div>
              <Label>Capacity % on this day (0 = closed, 100 = full)</Label>
              <Input type="number" min={0} max={100} value={holidayForm.capacityPercentage} onChange={(e) => setHolidayForm(f => ({ ...f, capacityPercentage: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Recurring yearly?</Label>
              <Switch checked={holidayForm.recurring} onCheckedChange={(v) => setHolidayForm(f => ({ ...f, recurring: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHolidayDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveHoliday}>{editingHoliday ? "Update" : "Add"} Holiday</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
