"use client"

import type React from "react"
import { TrendingUp, ListChecks, CheckCircle, LayoutDashboard, HelpCircle } from "lucide-react"

export function AnalyticsDashboard({ quizzes }: { quizzes: any[] }) {
  const quizzesWithAttempts = quizzes.filter((q) => q.totalAttempts > 0)
  const totalQuizzes = quizzes.length
  const totalAttempts = quizzes.reduce((sum, q) => sum + (q.totalAttempts || 0), 0)
  const totalScorePoints = quizzesWithAttempts.reduce((sum, q) => sum + (q.avgScore / 100) * q.totalAttempts, 0)
  const overallAvgScore = totalAttempts > 0 ? (totalScorePoints / totalAttempts) * 100 : 0
  const weakestQuiz = quizzesWithAttempts.sort((a, b) => (a.avgScore || 100) - (b.avgScore || 100))[0]

  const mockChartData = [
    { name: "Knowledge", value: 400, color: "bg-indigo-500" },
    { name: "Application", value: 300, color: "bg-green-500" },
    { name: "Analysis", value: 200, color: "bg-red-500" },
  ]

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string
    value: React.ReactNode
    icon: any
    color: string
  }) => (
    <div className="p-5 bg-white rounded-xl shadow-md border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color.replace("text-", "bg-")}/20 text-white`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <TrendingUp className="w-6 h-6 mr-2 text-primary" /> Class Analytics Overview
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Quizzes" value={totalQuizzes} icon={ListChecks} color="text-primary" />
        <StatCard title="Total Attempts" value={totalAttempts} icon={CheckCircle} color="text-success" />
        <StatCard
          title="Avg. Class Score"
          value={`${overallAvgScore.toFixed(1)}%`}
          icon={LayoutDashboard}
          color="text-yellow-600"
        />
        <StatCard
          title="Weakest Topic"
          value={weakestQuiz ? weakestQuiz.title : "N/A"}
          icon={HelpCircle}
          color="text-error"
        />
      </div>

      {totalAttempts === 0 && (
        <div className="p-4 text-center bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-300">
          No student attempts recorded yet. Ask a student to take a quiz!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Questions by Bloom's Level (Visualization Placeholder)
          </h3>
          <div className="flex flex-col space-y-4">
            {mockChartData.map((data) => (
              <div key={data.name}>
                <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                  <span>{data.name}</span>
                  <span>{data.value} Questions</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${data.color}`}
                    style={{ width: `${(data.value / 900) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4">
            This chart requires a visualization library (like Recharts) for live data.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 3 Most Missed Concepts (Placeholder)</h3>
          <ul className="space-y-3 text-sm">
            <li className="p-2 border-b border-gray-100 text-error">1. Newton's Third Law (Physics 101)</li>
            <li className="p-2 border-b border-gray-100 text-yellow-600">
              2. Prokaryotic vs. Eukaryotic Cells (Biology)
            </li>
            <li className="p-2 border-b border-gray-100 text-gray-600">3. Matrix Inversion (Algebra II)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
