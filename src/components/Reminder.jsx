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
import { Bell } from "lucide-react";
import Cookies from "js-cookie";
import { Separator } from "@/components/ui/separator";

const Reminder = ({ weather, fetchWeather }) => {
    const [showReminderDialog, setShowReminderDialog] = useState(false);
    const [reminderDate, setReminderDate] = useState(null);
    const [reminderName, setReminderName] = useState("");
    const [reminderDescription, setReminderDescription] = useState("");
    const { toast } = useToast();
    const [selectedDateReminders, setSelectedDateReminders] = useState([]);

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

            console.log("Reminder saved to cookie:", document.cookie); // Log the entire cookie string

            // Reset state
            setReminderDate(null);
            setReminderName("");
            setReminderDescription("");

            // Show Sonner toast
            toast({
                title: "Reminder Created!",
                description: "Your reminder has been successfully created.",
            });
            setShowReminderDialog(false);
        }
    };

    const scheduleNotifications = (reminder) => {
        console.log("scheduleNotifications called for:", reminder);
        const reminderDate = new Date(reminder.date);
        const now = new Date();

        const timeDiff7Days = now.getTime() + 10 * 1000 - now.getTime();
        const timeDiff2Days = now.getTime() + 5 * 1000 - now.getTime();

        console.log("Time difference (7 days):", timeDiff7Days / 1000, "seconds");
        console.log("Time difference (2 days):", timeDiff2Days / 1000, "seconds");

        if (timeDiff7Days > 0) {
            console.log("Setting timeout for 7-day notification");
            setTimeout(() => sendNotification(reminder, "7 days before (TEST)"), timeDiff7Days);
        } else {
            console.log("7-day notification time already passed (or very close)");
        }

        if (timeDiff2Days > 0) {
            console.log("Setting timeout for 2-day notification");
            setTimeout(() => sendNotification(reminder, "2 days before (TEST)"), timeDiff2Days);
        } else {
            console.log("2-day notification time already passed (or very close)");
        }
    };

    const sendNotification = async (reminder, timeMessage) => {
        console.log("sendNotification called with:", reminder, timeMessage);
        if (reminder.location) {
            console.log("Fetching weather for:", reminder.location);
            const weatherData = await fetchWeather(reminder.location);
            console.log("Weather data received:", weatherData);
            if (weatherData) {
                const notificationBody = `Reminder: ${reminder.name} on ${new Date(
                    reminder.date
                ).toLocaleDateString()} - Weather: ${weatherData.current.condition.text}, Temp: ${
                    weatherData.current.temp_c
                }°C`;
                if (Notification.permission === "granted") {
                    console.log("Sending browser notification:", `Reminder Alert (${timeMessage})`, notificationBody);
                    new Notification(`Reminder Alert (${timeMessage})`, { body: notificationBody });
                } else {
                    console.log("Notification permission not granted.");
                }
            } else {
                console.log("Weather data is null.");
            }
        } else {
            console.log("Reminder location is not set.");
        }
    };

    useEffect(() => {
        console.log("Reminder component mounted or re-rendered");
        Notification.requestPermission().then((permission) => {
            console.log("Notification permission:", permission);
            if (permission === "granted") {
                const savedReminders = Cookies.get("reminders");
                console.log("Reminders from cookie:", savedReminders);
                if (savedReminders) {
                    try {
                        const reminders = JSON.parse(savedReminders);
                        reminders.forEach(scheduleNotifications);
                    } catch (error) {
                        console.error("Error parsing reminders from cookie:", error);
                    }
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

    const handleDateClick = (date) => {
        setReminderDate(date);
        const reminders = getRemindersForCalendar()[date.toISOString().split("T")[0]] || [];
        setSelectedDateReminders(reminders);
    };

    return (
        <div>
            <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="ml-2 p-2">
                        <Bell className="w-4 h-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    {" "}
                    {/* Reduced max-width */}
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            Reminders
                            {reminderDate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2"
                                    style={{ marginTop: '-19px', marginRight: '15px' }}
                                    onClick={() => {
                                        setSelectedDateReminders([]);
                                        setReminderDate(null);
                                    }}
                                >
                                    Clear Date
                                </Button>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col sm:flex-row gap-2">
                        {" "}
                        {/* Reduced gap */}
                        <div className="flex-1">
                            <Calendar
                                mode="single"
                                selected={reminderDate}
                                onSelect={(date) => handleDateClick(date)}
                            />
                        </div>
                        <Separator orientation="vertical" className="hidden sm:block" />
                        <div className="flex-1">
                            {reminderDate ? (
                                <div>
                                    <h4 className="font-semibold mb-1">
                                        {" "}
                                        {/* Reduced margin */}
                                        Reminders for {reminderDate.toLocaleDateString()}
                                    </h4>
                                    {selectedDateReminders.length > 0 ? (
                                        <ul className="list-disc pl-4">
                                            {selectedDateReminders.map((reminder, index) => (
                                                <li key={index}>
                                                    {reminder.name} - {reminder.description}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No reminders for this date.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Select a date to view reminders.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-2 py-2">
                        {" "}
                        {/* Reduced gap and padding */}
                        <Label htmlFor="name" className="text-left">
                            Reminder Name
                        </Label>
                        <Input
                            id="name"
                            value={reminderName}
                            onChange={(e) => setReminderName(e.target.value)}
                            className="col-span-3"
                        />
                        <Label htmlFor="description" className="text-left">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={reminderDescription}
                            onChange={(e) => setReminderDescription(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <DialogFooter>
                        <Button onClick={saveReminder}>Save Reminder</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Toast />
        </div>
    );
};

export default Reminder;