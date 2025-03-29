"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface VacationCategory {
  id: string
  name: string
  color: string
}

interface VacationCategoriesProps {
  plannedDays: string[]
  onCategorize: (day: string, categoryId: string) => void
  dayCategories: Record<string, string>
}

const DEFAULT_CATEGORIES: VacationCategory[] = [
  { id: "beach", name: "Beach", color: "bg-blue-100 text-blue-800" },
  { id: "mountains", name: "Mountains", color: "bg-emerald-100 text-emerald-800" },
  { id: "city", name: "City Trip", color: "bg-purple-100 text-purple-800" },
  { id: "family", name: "Family Visit", color: "bg-amber-100 text-amber-800" },
  { id: "staycation", name: "Staycation", color: "bg-gray-100 text-gray-800" },
]

export function VacationCategories({ plannedDays, onCategorize, dayCategories }: VacationCategoriesProps) {
  const [categories, setCategories] = useState<VacationCategory[]>(DEFAULT_CATEGORIES)
  const [newCategoryName, setNewCategoryName] = useState("")

  const addCategory = () => {
    if (!newCategoryName.trim()) return

    const newCategory: VacationCategory = {
      id: `category-${Date.now()}`,
      name: newCategoryName,
      color: getRandomColor(),
    }

    setCategories([...categories, newCategory])
    setNewCategoryName("")
  }

  const getRandomColor = () => {
    const colors = [
      "bg-red-100 text-red-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800",
      "bg-indigo-100 text-indigo-800",
      "bg-pink-100 text-pink-800",
      "bg-cyan-100 text-cyan-800",
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const getCategoryById = (id: string) => {
    return categories.find((cat) => cat.id === id)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Vacation Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addCategory}>Add</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.id} className={category.color}>
                {category.name}
              </Badge>
            ))}
          </div>

          <div className="border rounded-md p-4">
            <Label className="mb-2 block">Assign Categories to Days</Label>
            <div className="space-y-2">
              {plannedDays.sort().map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <span>{new Date(day).toLocaleDateString("sv-SE")}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        {dayCategories[day] ? getCategoryById(dayCategories[day])?.name || "Select" : "Select"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-1">
                        {categories.map((category) => (
                          <Button
                            key={category.id}
                            variant="ghost"
                            className={cn("w-full justify-start", dayCategories[day] === category.id && "bg-accent")}
                            onClick={() => onCategorize(day, category.id)}
                          >
                            <Badge className={category.color + " mr-2"}>{category.name}</Badge>
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

