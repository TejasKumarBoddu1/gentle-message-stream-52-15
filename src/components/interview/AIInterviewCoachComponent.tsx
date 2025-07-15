
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Brain, BarChart3, Headphones, Target, Sparkles } from "lucide-react";
import IntegratedAIInterviewWithTracking from './IntegratedAIInterviewWithTracking';
import { MetricsProvider } from '@/context/MetricsContext';

const AIInterviewCoachComponent: React.FC = () => {
  return (
    <MetricsProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative container mx-auto px-6 py-12">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl"></div>
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6 border border-white/20">
                    <Bot className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                AI Interview Coach
              </h1>
              
              <p className="text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed mb-6">
                Practice with our advanced AI interviewer powered by enhanced speech recognition, 
                real-time analytics, and intelligent feedback systems.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <Headphones className="h-6 w-6 text-white mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Enhanced Speech Recognition</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <BarChart3 className="h-6 w-6 text-white mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Real-time Analytics</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <Brain className="h-6 w-6 text-white mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">AI-Powered Questions</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <Sparkles className="h-6 w-6 text-white mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">Smart Feedback</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Component */}
        <div className="container mx-auto px-6 py-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Interview Coach - Enhanced Mode
              </CardTitle>
              <CardDescription className="text-center">
                Complete interview experience with enhanced speech recognition, real-time analytics, and intelligent feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <IntegratedAIInterviewWithTracking />
            </CardContent>
          </Card>
        </div>
      </div>
    </MetricsProvider>
  );
};

export default AIInterviewCoachComponent;
