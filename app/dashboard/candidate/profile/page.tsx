"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AccountSection from "./AccountSection";
import AppearanceSection from "./AppearanceSection";
import NotificationsSection from "./NotificationsSection";
import DisplaySection from "./DisplaySection";
import { useState } from "react";

export default function CandidateProfilePage() {
  const [tab, setTab] = useState("account");

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="account">Konto</TabsTrigger>
                <TabsTrigger value="appearance">Darstellung</TabsTrigger>
                <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
                <TabsTrigger value="display">Anzeige</TabsTrigger>
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