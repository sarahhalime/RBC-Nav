import type { DimensionId, Expectation, Intern } from "./types";

export const MAYA_PROFILE = {
  first: "Maria",
  mentor: "Daniel Okafor",
  manager: "Sofia Tremblay",
  lastMentorChat: "3 weeks ago",
  nextMentorChat: "Thursday, 2:30 PM",
  skills: ["Kotlin coroutines", "Payments API design", "Writing clear PR descriptions"],
  /** Experiences logged before the demo starts, so Wrapped is never empty. */
  baseExperiences: { workshop: 2, cross_team_lunch: 0, mentor_coffee: 1, senior_ama: 0 },
  recognition: { points: 1250, shoutouts: 4 },
};

export const SAMPLE_REFLECTION =
  "Shipped my first PR to the payments API this week and learned a lot. But I rarely see my mentor, our 1:1 got rescheduled again, and I'm not sure what roles exist after this term.";

export const CLOSE_GAP: Record<DimensionId, { title: string; body: string; tip: string; href: string }> = {
  cross_team: {
    title: "3 cross-team coffee chats are open this week",
    body: "You wanted cross-team exposure. Data and AI and Cyber Defence both have intern hosts this Friday.",
    tip: "Tap your nametag at the Cross-Team Lunch station to log it.",
    href: "/nfc",
  },
  mentor_access: {
    title: "Book 20 minutes with Daniel",
    body: "You wanted regular mentor time. Your last chat was 3 weeks ago. Daniel has 2 open slots on Thursday.",
    tip: "Tap the Mentor Coffee Chat station when you meet.",
    href: "/nfc",
  },
  career_clarity: {
    title: "Career path workshop on Tuesday",
    body: "Four recent grads walk through how they got their roles. Bring one question.",
    tip: "Tap the Workshop station to log it.",
    href: "/nfc",
  },
  senior_access: {
    title: "Senior Leader AMA next Wednesday",
    body: "Submit a question anonymously ahead of time. Leaders answer the top 5 live.",
    tip: "Tap the Senior Leader AMA station when you join.",
    href: "/nfc",
  },
  feedback: {
    title: "Try the 3 question feedback ask",
    body: "What should I keep doing, start doing, and do differently? Ask your manager on Friday.",
    tip: "Log how it went in tonight's reflection.",
    href: "/intern/reflect",
  },
  network: {
    title: "Connect with 2 interns outside your team",
    body: "Friday's intern social has people from all 6 business areas.",
    tip: "Use Tap to Connect. Both of you approve first.",
    href: "/nfc",
  },
  meaningful_work: {
    title: "Ask how your project reaches clients",
    body: "A 10 minute chat with your product owner can connect your work to real outcomes.",
    tip: "Reflect on it tonight.",
    href: "/intern/reflect",
  },
  learning: {
    title: "Pick one new skill for week 7",
    body: "The internal learning portal has short paths on cloud, data and security.",
    tip: "Tap the Workshop station at the next session.",
    href: "/nfc",
  },
  belonging: {
    title: "Join a team ritual this week",
    body: "Standup demos, Friday coffee, or the Intern Council. Small moments add up.",
    tip: "Reflect on how it felt.",
    href: "/intern/reflect",
  },
};

export function mayaExpectations(maya: Intern, override: Expectation | null): Expectation {
  return override ?? maya.expectations;
}
