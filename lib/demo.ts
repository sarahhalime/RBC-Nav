import type { Role } from "./types";

export interface DemoStep {
  path: string;
  role: Role;
  title: string;
  text: string;
}

/** Maya's journey. About 10 to 12 seconds per step keeps the full story under 90 seconds. */
export const DEMO_STEPS: DemoStep[] = [
  {
    path: "/t/maya-7f3a",
    role: "intern",
    title: "1. Maya taps her nametag",
    text: "Her RBC nametag holds only a link. She signs in with RBC and lands in Nav. No location, no tracking.",
  },
  {
    path: "/intern",
    role: "intern",
    title: "2. A 30 second daily check-in",
    text: "Week 6 of 16. One mood tap, one goal, her next mentor chat. Private by default.",
  },
  {
    path: "/intern/reflect",
    role: "intern",
    title: "3. Reflect and get private insight",
    text: "Maya writes that she rarely sees her mentor. Nav finds the theme on device and offers support, only if she wants it.",
  },
  {
    path: "/nfc",
    role: "intern",
    title: "4. The magic moment: tap at a station",
    text: "Pick Cross-Team Lunch and press Simulate tap. Watch the program gap shrink and Maya's Wrapped update live.",
  },
  {
    path: "/intern/wrapped",
    role: "intern",
    title: "5. Her biweekly Wrapped",
    text: "Connections and experiences come from real taps. Her own gap journey, in her pocket.",
  },
  {
    path: "/insights",
    role: "leader",
    title: "6. The leader sees the Experience Gap",
    text: "Expected vs experienced across 9 dimensions. Groups under 10 stay hidden. Calgary mentor time is widening fast.",
  },
  {
    path: "/insights#simulator",
    role: "leader",
    title: "7. Close the gap, then green-light it",
    text: "Pick an intervention, set intensity, see cost, effort and owner. Press Green-light this.",
  },
  {
    path: "/act",
    role: "leader",
    title: "8. You Spoke. We Acted.",
    text: "Interns see the loop close: gap flagged, action launched, gap trend after. That is how you keep talent.",
  },
];
