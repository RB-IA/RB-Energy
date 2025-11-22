import { ColorScheme, StartScreenPrompt, ThemeOption } from "@openai/chatkit";

export const WORKFLOW_ID =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

export const CREATE_SESSION_ENDPOINT = "/api/create-session";

export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "What makes a strong VC pitch?",
    prompt: "What makes a strong VC pitch?",
    icon: "lightbulb",
  },
  {
    label: "Explain TAM, SAM, and SOM",
    prompt: "Can you explain TAM, SAM, and SOM in venture capital?",
    icon: "chart-line",
  },
  {
    label: "What are key metrics VCs look for?",
    prompt: "What are the key metrics and KPIs that VCs look for in startups?",
    icon: "chart-pie",
  },
  {
    label: "Tell me about valuation methods",
    prompt: "What are the common valuation methods used in venture capital?",
    icon: "money-bill-trend-up",
  },
];

export const PLACEHOLDER_INPUT = "Ask me anything about venture capital...";

export const GREETING = "I'm your VC expert with access to 200+ reports, lectures, and authoritative sources. How can I help you today?";

export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
  // Add other theme options here
  // chatkit.studio/playground to explore config options
});
