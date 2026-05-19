// ============================================
// Ignis AI Facilitator — Gemini Prompt Templates
// ============================================

export const ACTIVITY_GENERATION_PROMPT = (
  grade: string,
  topic: string,
  languageFocus: string,
  lifeSkillFocus: string
) => `
You are an expert educational facilitator for Ignis, an activity-based learning platform.

Generate a comprehensive classroom activity worksheet for the following parameters:
- Grade: ${grade}
- Topic: ${topic}
- Language Focus: ${languageFocus}
- Life Skill Focus: ${lifeSkillFocus}

Return a valid JSON object with this EXACT structure (no markdown, no extra text):
{
  "title": "Creative, engaging activity title",
  "objectives": ["Learning objective 1", "Learning objective 2", "Learning objective 3"],
  "estimatedTime": "45 minutes",
  "materials": ["Material 1", "Material 2"],
  "imagePrompt": "A highly detailed, child-friendly, colorful vector illustration prompt describing an educational scene relevant to the topic. Do NOT include any text inside the image. Keep it descriptive (e.g. 'A vibrant modern village showing solar panels on roofs, small wind turbines, green vegetable patches, a modern schoolhouse, children playing together, and clear blue sky.')",
  "instructions": "Detailed step-by-step instructions for the teacher to facilitate this activity",
  "discussionQuestions": [
    "Discussion question 1?",
    "Discussion question 2?",
    "Discussion question 3?",
    "Discussion question 4?"
  ],
  "presentationTask": "Description of what students will present or create as final output",
  "worksheet": [
    {
      "heading": "Introduction",
      "content": "Student-facing introduction text and warm-up activity",
      "type": "instructions"
    },
    {
      "heading": "Main Activity",
      "content": "Primary activity instructions and tasks for students",
      "type": "activity"
    },
    {
      "heading": "Discussion Questions",
      "content": "1. Question one?\\n2. Question two?\\n3. Question three?",
      "type": "questions"
    },
    {
      "heading": "Reflection",
      "content": "What did you learn today? How can you apply ${lifeSkillFocus} in your daily life?",
      "type": "reflection"
    }
  ],
  "rubric": [
    {
      "criterion": "Language Use (${languageFocus})",
      "excellent": "Consistently and correctly uses ${languageFocus} with variety",
      "good": "Mostly uses ${languageFocus} correctly with minor errors",
      "developing": "Sometimes uses ${languageFocus} but with frequent errors",
      "beginning": "Rarely uses ${languageFocus} or uses it incorrectly"
    },
    {
      "criterion": "Life Skills (${lifeSkillFocus})",
      "excellent": "Demonstrates exceptional ${lifeSkillFocus} throughout the activity",
      "good": "Shows good ${lifeSkillFocus} with occasional guidance needed",
      "developing": "Shows some ${lifeSkillFocus} but needs frequent support",
      "beginning": "Struggles to demonstrate ${lifeSkillFocus}"
    },
    {
      "criterion": "Creativity & Engagement",
      "excellent": "Highly creative, original ideas, fully engaged",
      "good": "Creative ideas, engaged most of the time",
      "developing": "Some creative ideas, partially engaged",
      "beginning": "Limited creativity, needs encouragement to engage"
    },
    {
      "criterion": "Communication",
      "excellent": "Communicates ideas clearly and confidently",
      "good": "Communicates ideas with minor hesitation",
      "developing": "Communicates basic ideas with support",
      "beginning": "Struggles to communicate ideas clearly"
    }
  ]
}

Make the activity engaging, age-appropriate for ${grade}, and focused on the topic of "${topic}". The language should be educational but accessible.
`;

export const EVALUATION_PROMPT = (submissionText?: string) => `
You are an expert educational evaluator for Ignis, an activity-based learning platform.

${submissionText ? `Analyze this student's written submission:\n\n"${submissionText}"` : 'Analyze the uploaded student worksheet image.'}

Evaluate the student's work and return a valid JSON object with this EXACT structure (no markdown, no extra text):
{
  "scores": {
    "creativity": 7,
    "grammar": 8,
    "communication": 7,
    "understanding": 8,
    "participation": 9,
    "overall": 8
  },
  "strengths": [
    "Specific strength 1 observed in the work",
    "Specific strength 2 observed in the work",
    "Specific strength 3 observed in the work"
  ],
  "improvements": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2",
    "Specific improvement suggestion 3"
  ],
  "overallComment": "A warm, encouraging 2-3 sentence overall comment about the student's work, highlighting their effort and potential."
}

Scores should be out of 10. Be encouraging, specific, and constructive. Focus on growth mindset language.
`;

export const REPORT_GENERATION_PROMPT = (data: {
  schoolName: string;
  teacherName: string;
  visitCount: number;
  dateRange: string;
  activitiesCompleted: number;
  observations: string;
  achievements: string;
  challenges: string;
  supportRequired: string;
  suggestions: string;
}) => `
You are an expert educational report writer for Ignis, an activity-based learning platform.

Generate a professional school implementation report based on the following information:

School: ${data.schoolName}
Teacher/Facilitator: ${data.teacherName}
Visit Count: ${data.visitCount}
Date Range: ${data.dateRange}
Activities Completed: ${data.activitiesCompleted}

Teacher Observations: ${data.observations}
Achievements: ${data.achievements}
Challenges Faced: ${data.challenges}
Support Required: ${data.supportRequired}
Suggestions: ${data.suggestions}

Generate a professional, formal educational implementation report. Format it clearly with these sections:

# IGNIS IMPLEMENTATION REPORT
## ${data.schoolName}
### Reporting Period: ${data.dateRange}

---

**Prepared by:** ${data.teacherName}  
**Total Visits:** ${data.visitCount}  
**Activities Implemented:** ${data.activitiesCompleted}  
**Date Generated:** ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

---

## 1. EXECUTIVE SUMMARY
[Write a professional 2-3 paragraph executive summary of the implementation]

## 2. CLASSROOM OBSERVATIONS
[Expand the teacher's observations into professional, detailed prose]

## 3. KEY ACHIEVEMENTS
[Transform the achievements into a bulleted, professional list with context]

## 4. CHALLENGES & ANALYSIS
[Professionally describe challenges with analytical perspective]

## 5. SUPPORT REQUIRED
[List and elaborate on the support needed with clear action items]

## 6. RECOMMENDATIONS & SUGGESTIONS
[Transform suggestions into professional recommendations with rationale]

## 7. CONCLUSION
[Write a motivating, professional conclusion with next steps]

---
*This report was generated by the Ignis AI Facilitator Assistant. All observations are based on facilitator inputs and AI analysis.*

Use professional educational language. Be specific, constructive, and insightful. The report should demonstrate the value of the Ignis program.
`;
