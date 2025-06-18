"use client"

import { useState } from "react"
import { StudentTable } from "@/components/student-table"
import { StudentProfile } from "@/components/student-profile"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Settings } from "lucide-react"

type Student = {
  name: string
  // add other properties as needed
}

export default function Home() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedStudent && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>
            )}
            <h1 className="text-2xl font-bold">
              {selectedStudent ? `${selectedStudent.name} - Profile` : "Student Progress Management"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {selectedStudent ? (
          <StudentProfile student={selectedStudent} />
        ) : (
          <StudentTable onSelectStudent={setSelectedStudent} />
        )}
      </main>
    </div>
  )
}
