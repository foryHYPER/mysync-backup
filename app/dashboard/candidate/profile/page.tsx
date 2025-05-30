"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AccountSection from "./AccountSection";
import AppearanceSection from "./AppearanceSection";
import NotificationsSection from "./NotificationsSection";
import DisplaySection from "./DisplaySection";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  IconUser, 
  IconPalette, 
  IconBell, 
  IconLayoutGrid,
} from "@tabler/icons-react";

export default function CandidateProfilePage() {
  const [tab, setTab] = useState("account");

  return (
    <div className="flex-1">
      <div className="container mx-auto p-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profil-Einstellungen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie hier Ihre persönlichen Daten, Erscheinungsbild und Benachrichtigungseinstellungen.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Profil</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="w-full justify-start h-auto p-1.5 bg-muted/50 rounded-lg mb-4">
                <TabsTrigger 
                  value="account" 
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:hover:!bg-primary/90 rounded-md transition-all duration-200 hover:bg-muted/80"
                >
                  <IconUser className="h-4 w-4" />
                  <span>Persönliche Daten</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="appearance" 
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:hover:!bg-primary/90 rounded-md transition-all duration-200 hover:bg-muted/80"
                >
                  <IconPalette className="h-4 w-4" />
                  <span>Erscheinungsbild</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:hover:!bg-primary/90 rounded-md transition-all duration-200 hover:bg-muted/80"
                >
                  <IconBell className="h-4 w-4" />
                  <span>Benachrichtigungen</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="display" 
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:hover:!bg-primary/90 rounded-md transition-all duration-200 hover:bg-muted/80"
                >
                  <IconLayoutGrid className="h-4 w-4" />
                  <span>Anzeige</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="mt-0">
                <AccountSection />
              </TabsContent>
              <TabsContent value="appearance" className="mt-0">
                <AppearanceSection />
              </TabsContent>
              <TabsContent value="notifications" className="mt-0">
                <NotificationsSection />
              </TabsContent>
              <TabsContent value="display" className="mt-0">
                <DisplaySection />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 