"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/app/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Switch = ({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
      checked ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
    }`}
  >
    <span
      data-state={checked ? "checked" : "unchecked"}
      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

export const NotificationSettings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    update: true,
    response: true,
    reported: false,
    threshold: false,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getNotificationSettings();
        setSettings({
          update: data.update,
          response: data.response,
          reported: data.reported,
          threshold: data.threshold,
        });
      } catch (error) {
        console.error("Failed to load settings", error);
        toast.error("Failed to load notification settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    try {
      await updateNotificationSettings(newSettings);
      toast.success("Settings saved");
    } catch (error) {
      console.error("Failed to update settings", error);
      toast.error("Failed to save settings");
      setSettings(settings); // Revert
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how you receive in-app notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between space-x-2">
          <Label
            htmlFor="update"
            className="flex flex-col space-y-1 items-start"
          >
            <span>Petition Updates</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Receive notifications when petitions you follow post an update.
            </span>
          </Label>
          <Switch
            id="update"
            checked={settings.update}
            onCheckedChange={() => handleToggle("update")}
          />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label
            htmlFor="response"
            className="flex flex-col space-y-1 items-start"
          >
            <span>Official Responses</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Receive notifications when petitions you follow get a response.
            </span>
          </Label>
          <Switch
            id="response"
            checked={settings.response}
            onCheckedChange={() => handleToggle("response")}
          />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label
            htmlFor="reported"
            className="flex flex-col space-y-1 items-start"
          >
            <span>Report Status</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Get notified about updates to reports you've made.
            </span>
          </Label>
          <Switch
            id="reported"
            checked={settings.reported}
            onCheckedChange={() => handleToggle("reported")}
          />
        </div>
        <div className="flex items-center justify-between space-x-2">
          <Label
            htmlFor="threshold"
            className="flex flex-col space-y-1 items-start"
          >
            <span>Signature Thresholds</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Get notified when petitions reach significant signature
              milestones.
            </span>
          </Label>
          <Switch
            id="threshold"
            checked={settings.threshold}
            onCheckedChange={() => handleToggle("threshold")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
