
import React from 'react';
import AIInterviewCoachComponent from '@/components/interview/AIInterviewCoachComponent';
import StudentDashboardLayout from '@/components/layout/StudentDashboardLayout';

const AIInterviewCoach: React.FC = () => {
  return (
    <StudentDashboardLayout>
      <AIInterviewCoachComponent />
    </StudentDashboardLayout>
  );
};

export default AIInterviewCoach;
