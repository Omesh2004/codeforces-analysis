"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmailTestPanel } from "@/components/email-test-panel"
import { DatabaseTestPanel } from "@/components/database-test-panel"
import { CodeforcesTestPanel } from "@/components/codeforces-test-panel"
import { SystemHealthPanel } from "@/components/system-health-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, Database, Mail, Globe, Activity } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Admin Dashboard
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg text-muted-foreground">System testing and configuration panel</h2>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Testing
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="codeforces" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Codeforces API
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <SystemHealthPanel />
          </TabsContent>

          <TabsContent value="email">
            <EmailTestPanel />
          </TabsContent>

          <TabsContent value="database">
            <DatabaseTestPanel />
          </TabsContent>

          <TabsContent value="codeforces">
            <CodeforcesTestPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
