"use client"

import { ArrowRight, Sparkles, BookOpen, BarChart3, Users, Zap, CheckCircle, Brain, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-grid-gray-200/50 bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Quiz Generation
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your Teaching with{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  AI-Generated Quizzes
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create intelligent assessments in seconds, track student progress with powerful analytics, and revolutionize how you teach with EduQuizAI.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full h-[500px]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
                <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
                <div className="absolute bottom-0 left-20 w-80 h-80 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

                <div className="relative flex items-center justify-center h-full">
                  <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <Brain className="w-40 h-40 text-blue-600 mb-4" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">AI-Powered</p>
                      <p className="text-gray-600">Smart Assessment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Modern Education
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're a teacher creating assessments or a student practicing for exams, EduQuizAI has the tools to help you succeed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-blue-600" />}
              title="AI Quiz Generation"
              description="Generate comprehensive quizzes from any topic, text, or PDF in seconds using advanced AI technology."
            />

            <FeatureCard
              icon={<BookOpen className="w-8 h-8 text-indigo-600" />}
              title="Smart Question Bank"
              description="Build and manage your question library with intelligent organization and easy reusability."
            />

            <FeatureCard
              icon={<BarChart3 className="w-8 h-8 text-purple-600" />}
              title="Analytics Dashboard"
              description="Track student performance, identify learning gaps, and make data-driven decisions with detailed insights."
            />

            <FeatureCard
              icon={<Users className="w-8 h-8 text-pink-600" />}
              title="Class Management"
              description="Organize students into classes, assign quizzes seamlessly, and manage everything from one place."
            />

            <FeatureCard
              icon={<GraduationCap className="w-8 h-8 text-orange-600" />}
              title="Student Playground"
              description="Students can practice with AI-generated quizzes on any topic, anytime, for better exam preparation."
            />

            <FeatureCard
              icon={<CheckCircle className="w-8 h-8 text-green-600" />}
              title="Automated Grading"
              description="Save hours with AI-powered grading for multiple choice and short answer questions with instant feedback."
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="Sign Up & Choose Role"
              description="Create your free account and select whether you're a teacher or student to access your personalized dashboard."
              icon={<Users className="w-12 h-12 text-blue-600" />}
            />

            <StepCard
              number="2"
              title="Generate or Join"
              description="Teachers: Generate AI quizzes from any content. Students: Join classes and access assigned quizzes."
              icon={<Sparkles className="w-12 h-12 text-indigo-600" />}
            />

            <StepCard
              number="3"
              title="Track & Improve"
              description="Monitor progress with real-time analytics, get AI-powered feedback, and continuously improve learning outcomes."
              icon={<BarChart3 className="w-12 h-12 text-purple-600" />}
            />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                For Teachers: Create Better Assessments in Less Time
              </h2>
              <div className="space-y-4">
                <BenefitItem text="Upload PDFs, paste text, or enter topics to generate quizzes instantly" />
                <BenefitItem text="Customize questions with multiple choice, true/false, and short answer formats" />
                <BenefitItem text="Track student performance with detailed analytics and insights" />
                <BenefitItem text="Manage multiple classes and assign quizzes with ease" />
                <BenefitItem text="Save hours on quiz creation and grading every week" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-12 rounded-3xl">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Quiz Generator</h3>
                    <p className="text-gray-600">AI-Powered Creation</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Topic</p>
                    <p className="font-semibold text-gray-900">World War II History</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Questions Generated</p>
                    <p className="font-semibold text-gray-900">15 questions in 8 seconds</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-12 rounded-3xl order-2 lg:order-1">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Student Dashboard</h3>
                    <p className="text-gray-600">Track Your Progress</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <span className="text-gray-700">Quizzes Completed</span>
                    <span className="font-bold text-2xl text-green-600">12</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <span className="text-gray-700">Average Score</span>
                    <span className="font-bold text-2xl text-blue-600">87%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                For Students: Practice Smarter, Not Harder
              </h2>
              <div className="space-y-4">
                <BenefitItem text="Access quizzes assigned by your teachers instantly" />
                <BenefitItem text="Practice with AI-generated quizzes on any topic you want" />
                <BenefitItem text="Get instant feedback and detailed explanations" />
                <BenefitItem text="Track your progress and identify areas for improvement" />
                <BenefitItem text="Prepare for exams with unlimited practice opportunities" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of teachers and students already using EduQuizAI to make education more effective and engaging.
          </p>

          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-10 py-6 text-lg font-semibold shadow-2xl hover:shadow-xl transition-all duration-200"
          >
            Start Free Today
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="mt-6 text-blue-200 text-sm">
            No credit card required. Get started in under 60 seconds.
          </p>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div className="absolute -top-6 left-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
          {number}
        </div>
        <div className="mt-6 mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-1">
        <CheckCircle className="w-6 h-6 text-green-600" />
      </div>
      <p className="text-gray-700 text-lg">{text}</p>
    </div>
  )
}
