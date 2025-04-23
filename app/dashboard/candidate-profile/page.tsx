"use client";

import { useProfile } from "@/context/ProfileContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AccountSection from "@/app/dashboard/candidate-profile/AccountSection";
import AppearanceSection from "@/app/dashboard/candidate-profile/AppearanceSection";
import NotificationsSection from "@/app/dashboard/candidate-profile/NotificationsSection";
import DisplaySection from "@/app/dashboard/candidate-profile/DisplaySection";
import { useState } from "react";

export default function CandidateProfilePage() {
  const profile = useProfile();
  const [tab, setTab] = useState("account");

  // Hier kannst du weitere Daten laden, aber NICHT nochmal Sidebar oder user bauen!

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="display">Display</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <AccountSection />
              </TabsContent>
              <TabsContent value="appearance">
                <AppearanceSection />
              </TabsContent>
              <TabsContent value="notifications">
                <NotificationsSection />
              </TabsContent>
              <TabsContent value="display">
                <DisplaySection />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 