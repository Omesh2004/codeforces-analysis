"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StudentDialog } from "@/components/student-dialog"
import { Download, Plus, Search, Eye, Edit, Trash2, RefreshCw } from "lucide-react"
// import { formatRelativeTime} from "@/lib/utils"
function formatRelativeTime(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}
import Link from "next/link"
import { Settings } from "lucide-react"

interface StudentTableProps {
  onSelectStudent: (student: any) => void
}

interface Student {
  _id: string
  name: string
  email: string
  phone: string
  codeforcesHandle: string
  currentRating: number
  maxRating: number
  lastUpdated?: string
  isActive?: boolean
  reminderCount?: number
}

export function StudentTable({ onSelectStudent }: StudentTableProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/students")
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      } else {
        console.error("Failed to fetch students:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch students:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.codeforcesHandle.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStudent = async (studentData: any) => {
    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      })

      if (response.ok) {
        const newStudent = await response.json()
        setStudents([newStudent, ...students])
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add student")
      }
    } catch (error) {
      console.error("Failed to add student:", error)
      alert("Failed to add student")
    }
  }

  const handleEditStudent = async (studentData: any) => {
    if (!editingStudent) {
      alert("No student selected for editing.")
      return
    }
    try {
      const response = await fetch(`/api/students/${editingStudent._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      })

      if (response.ok) {
        const updatedStudent = await response.json()
        setStudents(students.map((s) => (s._id === editingStudent._id ? updatedStudent : s)))
        setEditingStudent(null)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update student")
      }
    } catch (error) {
      console.error("Failed to update student:", error)
      alert("Failed to update student")
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return

    try {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setStudents(students.filter((s) => s._id !== id))
      } else {
        alert("Failed to delete student")
      }
    } catch (error) {
      console.error("Failed to delete student:", error)
      alert("Failed to delete student")
    }
  }

  const handleSyncData = async (id: string) => {
    try {
      const response = await fetch("/api/codeforces/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: id }),
      })

      if (response.ok) {
        await fetchStudents() // Refresh the data
      } else {
        alert("Failed to sync data")
      }
    } catch (error) {
      console.error("Failed to sync data:", error)
      alert("Failed to sync data")
    }
  }

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Phone", "Codeforces Handle", "Current Rating", "Max Rating", "Last Updated"]
    const csvContent = [
      headers.join(","),
      ...students.map((s) =>
        [
          s.name,
          s.email,
          s.phone,
          s.codeforcesHandle,
          s.currentRating,
          s.maxRating,
          s.lastUpdated ? new Date(s.lastUpdated).toISOString() : "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" }) // Fixed the closing quote
    const url = window.URL.createObjectURL(blob)
    const downloadLink = document.createElement("a") // Renamed variable to avoid conflict
    downloadLink.href = url
    downloadLink.download = "students.csv"
    downloadLink.click()
    window.URL.revokeObjectURL(url)
  }

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Students Overview</CardTitle>
            <CardDescription>Manage student profiles and track their Codeforces progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search students..." className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>CF Handle</TableHead>
                    <TableHead className="text-center">Current Rating</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">Max Rating</TableHead>
                    <TableHead className="hidden xl:table-cell">Last Updated</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading students...
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Students Overview</CardTitle>
          <CardDescription>Manage student profiles and track their Codeforces progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Link href="/admin">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>CF Handle</TableHead>
                  <TableHead className="text-center">Current Rating</TableHead>
                  <TableHead className="text-center hidden lg:table-cell">Max Rating</TableHead>
                  <TableHead className="hidden xl:table-cell">Last Updated</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading students...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {students.length === 0
                        ? "No students found. Add your first student!"
                        : "No students match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{student.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.phone}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{student.codeforcesHandle}</code>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={student.currentRating >= 1500 ? "default" : "secondary"}>
                          {student.currentRating}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        <Badge variant="outline">{student.maxRating}</Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {formatRelativeTime(student.lastUpdated)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Badge variant={student.isActive ? "default" : "destructive"}>
                            {student.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {student.reminderCount !== undefined && student.reminderCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {student.reminderCount} reminders
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onSelectStudent(student)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingStudent(student)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSyncData(student._id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteStudent(student._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <StudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={editingStudent}
        onSave={editingStudent ? handleEditStudent : handleAddStudent}
      />
    </div>
  )
}
