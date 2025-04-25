"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Vote, Trophy } from "lucide-react"

export function MetricCards({ totalUsers, totalVotes, topWinner, loading }) {
  const metrics = [
    {
      title: "Total Users",
      value: totalUsers,
      description: "Registered users",
      icon: <Users className="h-4 w-4 text-green-500" />,
    },
    {
      title: "Total Votes",
      value: totalVotes,
      description: "Votes cast",
      icon: <Vote className="h-4 w-4 text-green-500" />,
    },
    {
      title: "Top Winner",
      value: topWinner.displayName,
      description: `${topWinner.wins} wins`,
      icon: <Trophy className="h-4 w-4 text-green-500" />,
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-24 mb-1" />
              <Skeleton className="h-4 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric, index) => (
        <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <CardDescription>{metric.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
