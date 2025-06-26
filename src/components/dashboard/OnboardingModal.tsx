'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Sparkles, Target, Heart, TrendingUp, Zap } from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to LifeHub",
      description: "Your personal life management dashboard",
      icon: <Sparkles className="w-8 h-8" />,
      color: "from-blue-500 to-purple-600",
      content: (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto"
          >
            <Sparkles className="w-12 h-12 text-white" />
          </motion.div>
          <div className="space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900"
            >
              Welcome to LifeHub
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 max-w-md mx-auto"
            >
              Your all-in-one platform for managing tasks, tracking mood, monitoring finances, and organizing your life.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center space-x-4"
          >
            <div className="flex items-center space-x-2 text-blue-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Task Management</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Mood Tracking</span>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Finance Monitor</span>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 2,
      title: "Customize Your Dashboard",
      description: "Subscribe to services that matter to you",
      icon: <Target className="w-8 h-8" />,
      color: "from-green-500 to-blue-600",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Personalize Your Experience
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600"
            >
              Choose from a variety of widgets to create your perfect dashboard
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "Task Widget", desc: "Manage your daily tasks", color: "blue" },
              { name: "Mood Tracker", desc: "Track your emotional well-being", color: "purple" },
              { name: "Finance Monitor", desc: "Keep track of your spending", color: "green" },
              { name: "Quick Actions", desc: "Fast access to common tasks", color: "orange" }
            ].map((widget, index) => (
              <motion.div
                key={widget.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 bg-${widget.color}-100 rounded-lg flex items-center justify-center`}>
                    <div className={`w-6 h-6 bg-${widget.color}-600 rounded`}></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{widget.name}</h4>
                    <p className="text-sm text-gray-600">{widget.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Track Your Progress",
      description: "Monitor your life metrics",
      icon: <TrendingUp className="w-8 h-8" />,
      color: "from-purple-500 to-pink-600",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Visualize Your Growth
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-600"
            >
              Get insights into your productivity, mood patterns, and financial health
            </motion.p>
          </div>
          
          <div className="space-y-4">
            {[
              { metric: "Task Completion", value: "85%", trend: "+12%", color: "green" },
              { metric: "Mood Average", value: "7.2/10", trend: "+0.5", color: "blue" },
              { metric: "Savings Rate", value: "23%", trend: "+5%", color: "purple" }
            ].map((stat, index) => (
              <motion.div
                key={stat.metric}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{stat.metric}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`text-${stat.color}-600 font-semibold`}>
                  {stat.trend}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Stay Motivated",
      description: "Build lasting habits",
      icon: <Heart className="w-8 h-8" />,
      color: "from-pink-500 to-red-600",
      content: (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto"
          >
            <Heart className="w-12 h-12 text-white" />
          </motion.div>
          
          <div className="space-y-4">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900"
            >
              You're All Set!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 max-w-md mx-auto"
            >
              Start your journey to better life management. Remember, small steps lead to big changes!
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Quick setup complete</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Dashboard ready</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-purple-600">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Ready to explore</span>
            </div>
          </motion.div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 border-b border-gray-200">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </motion.button>
              
              <div className="flex items-center space-x-4">
                <motion.div
                  className={`w-12 h-12 bg-gradient-to-r ${steps[currentStep].color} rounded-xl flex items-center justify-center`}
                  whileHover={{ scale: 1.1 }}
                >
                  {steps[currentStep].icon}
                </motion.div>
                <div>
                  <motion.h2
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xl font-bold text-gray-900"
                  >
                    {steps[currentStep].title}
                  </motion.h2>
                  <p className="text-gray-600">{steps[currentStep].description}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Step {currentStep + 1} of {steps.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {steps[currentStep].content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Previous</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                {currentStep < steps.length - 1 && <ChevronRight className="w-5 h-5" />}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 