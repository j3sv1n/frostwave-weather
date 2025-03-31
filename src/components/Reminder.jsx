import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "@/components/ui/toast";
import { Bell, Calendar as CalendarIcon } from "lucide-react";
import Cookies from "js-cookie";

const Reminder = ({ weather, fetchWeather }) => {
  const [showReminderCalendar, setShowReminderCalendar] = useState(false);
  const [reminderDate, setReminderDate] = useState(null);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderName, setReminderName] = useState("");
  const [reminderDescription, setReminderDescription] = useState("");
  const [showPreviewCalendar, setShowPreviewCalendar] = useState(false);
  const { toast } = useToast();

  const saveReminder = () => {
    if (reminderDate && reminderName && reminderDescription) {
      const reminder = {
        date: reminderDate.toISOString(),
        name: reminderName,
        description: reminderDescription,
        location: weather?.location?.name,
      };

      let existingReminders = Cookies.get("reminders");
      let reminders = existingReminders ? JSON.parse(existingReminders) : [];
      reminders.push(reminder);
      Cookies.set("reminders", JSON.stringify(reminders), { expires: 365 });

      // Reset state
      setReminderDate(null);
      setReminderName("");
      setReminderDescription("");

      // Show Sonner toast
      toast({
        title: "Reminder Created!",
        description: "Your reminder has been successfully created.",
      });
    }
  };

  const scheduleNotifications = (reminder) => {
    const reminderDate = new Date(reminder.date);
    const now = new Date();

    const timeDiff7Days = reminderDate - now - 7 * 24 * 60 * 60 * 1000;
    const timeDiff2Days = reminderDate - now - 2 * 24 * 60 * 60 * 1000;

    if (timeDiff7Days > 0) {
      setTimeout(() => sendNotification(reminder, "7 days before"), timeDiff7Days);
    }

    if (timeDiff2Days > 0) {
      setTimeout(() => sendNotification(reminder, "2 days before"), timeDiff2Days);
    }
  };

  const sendNotification = async (reminder, timeMessage) => {
    if (reminder.location) {
      await fetchWeather(reminder.location);
      if (weather) {
        const notificationBody = `Reminder: ${reminder.name} on ${new Date(
          reminder.date
        ).toLocaleDateString()} - Weather: ${weather.current.condition.text}, Temp: ${
          weather.current.temp_c
        }°C`;
        if (Notification.permission === "granted") {
          new Notification(`Reminder Alert (${timeMessage})`, { body: notificationBody });
        }
      }
    }
  };

  useEffect(() => {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        const savedReminders = Cookies.get("reminders");
        if (savedReminders) {
          JSON.parse(savedReminders).forEach(scheduleNotifications);
        }
      }
    });
  }, []);

  const getRemindersForCalendar = useCallback(() => {
    const savedReminders = Cookies.get("reminders");
    if (savedReminders) {
      return JSON.parse(savedReminders).reduce((acc, reminder) => {
        const date = new Date(reminder.date).toISOString().split("T")[0];
        acc[date] = acc[date] || [];
        acc[date].push(reminder);
        return acc;
      }, {});
    }
    return {};
  }, []);

  const renderPreviewCalendarDay = (date) => {
    const remindersForDate = getRemindersForCalendar()[date.toISOString().split("T")[0]];
    return remindersForDate ? (
      <Button variant="link" onClick={() => console.log("Reminders for this date:", remindersForDate)}>
        {date.getDate()}
      </Button>
    ) : (
      date.getDate()
    );
  };

  return (
    <div>
      <Dialog open={showReminderCalendar} onOpenChange={setShowReminderCalendar}>
        <DialogTrigger asChild>
          <Button variant="outline" className="ml-2 p-2">
            <Bell className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reminder</DialogTitle>
          </DialogHeader>
          <Calendar mode="single" selected={reminderDate} onSelect={setReminderDate} />
          <DialogFooter>
            <Button onClick={() => { setShowReminderDialog(true); setShowReminderCalendar(false); }}>
              Set Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Reminder Details</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="name" className="text-right">Reminder Name</Label>
            <Input id="name" value={reminderName} onChange={(e) => setReminderName(e.target.value)} />
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={reminderDescription} onChange={(e) => setReminderDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={() => { saveReminder(); setShowReminderDialog(false); }}>
              Save Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="outline" className="ml-2 p-2" onClick={() => setShowPreviewCalendar(true)}>
        <CalendarIcon className="w-4 h-4" /> Preview Reminders
      </Button>

      <Dialog open={showPreviewCalendar} onOpenChange={setShowPreviewCalendar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pending Reminders</DialogTitle>
          </DialogHeader>
          <Calendar renderDay={renderPreviewCalendarDay} />
        </DialogContent>
      </Dialog>
      <Toast />
    </div>
  );
};

export default Reminder;
