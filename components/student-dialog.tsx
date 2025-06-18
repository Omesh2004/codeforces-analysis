"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

interface StudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: any
  onSave: (studentData: any) => void
}

export function StudentDialog({ open, onOpenChange, student, onSave }: StudentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    codeforcesHandle: "",
    currentRating: 0,
    maxRating: 0,
    emailEnabled: true,
  })

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        codeforcesHandle: student.codeforcesHandle || "",
        currentRating: student.currentRating || 0,
        maxRating: student.maxRating || 0,
        emailEnabled: student.emailEnabled ?? true,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        codeforcesHandle: "",
        currentRating: 0,
        maxRating: 0,
        emailEnabled: true,
      })
    }
  }, [student, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {student ? "Update student information" : "Enter student details to add them to the system"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="handle">Codeforces Handle</Label>
              <Input
                id="handle"
                value={formData.codeforcesHandle}
                onChange={(e) => setFormData({ ...formData, codeforcesHandle: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="current">Current Rating</Label>
                <Input
                  id="current"
                  type="number"
                  value={formData.currentRating}
                  onChange={(e) => setFormData({ ...formData, currentRating: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max">Max Rating</Label>
                <Input
                  id="max"
                  type="number"
                  value={formData.maxRating}
                  onChange={(e) => setFormData({ ...formData, maxRating: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="email-enabled"
                checked={formData.emailEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, emailEnabled: checked })}
              />
              <Label htmlFor="email-enabled">Enable reminder emails</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{student ? "Update" : "Add"} Student</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
