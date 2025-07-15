
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Video, MessageSquare, BarChart3, Brain } from "lucide-react";
import AIInterviewSimulator from './AIInterviewSimulator';
import EnhancedCamera from './EnhancedCamera';

const InterviewCoachNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState("simulator");

  return (
    <div className="container max-w-7xl py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">QwiXed360 AI Interview Coach</h1>
          <p className="text-muted-foreground">
            Practice and improve your interview skills with AI-powered coaching, emotion detection, and real-time feedback
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simulator" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Interview Simulator
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Camera & Posture Training
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulator">
            <AIInterviewSimulator />
          </TabsContent>

          <TabsContent value="camera">
            <EnhancedCamera />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
                <CardDescription>
                  View your interview performance trends and improvement areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Complete some interview sessions to see your analytics here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InterviewCoachNew;
