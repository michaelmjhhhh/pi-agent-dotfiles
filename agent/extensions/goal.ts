/**
 * /goal extension — Pi's answer to Claude Code's /goal command.
 *
 * How it works:
 *   1. User types /goal <condition> — stores the goal, injects system prompt
 *   2. Model works normally toward the condition
 *   3. When the model believes the condition is met, it calls goal_achieved()
 *   4. Extension validates, clears the goal, and notifies the user
 *   5. Loop repeats if goal not yet met (turn_end bumps iteration counter)
 *
 * This mirrors Claude Code's Stop-hook-based architecture but uses Pi's
 * custom tool + event-hook system instead.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoalState {
  condition: string;
  iterations: number;
  setAt: number;          // Date.now() when goal was set
  lastReason?: string;    // from the most recent evaluation
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CONDITION_LENGTH = 4000;
const CLEAR_KEYWORDS = new Set(["clear", "stop", "off", "reset", "none", "cancel"]);
const GOAL_STATE_KEY = "goal:active";

// ---------------------------------------------------------------------------
// System-prompt fragment injected when a goal is active
// ---------------------------------------------------------------------------

function buildGoalPrompt(condition: string): string {
  return `## Active Goal

A goal condition is now active: "${condition}"

- Treat the condition itself as your directive. Do not ask the user for confirmation.
- Work toward the goal with your normal tools (read, bash, edit, write, etc.).
- When you believe the condition has been fully met, call the \`goal_achieved\` tool
  with the condition text and a brief reason explaining how it was satisfied.
- If you are already done when you read this, call \`goal_achieved\` immediately.
- IMPORTANT: After calling \`goal_achieved\`, continue working until the
  tool result comes back — do not stop early. The tool result will tell you
  whether to keep going or wrap up.
- Do NOT tell the user to run \`/goal clear\` — that's only for manual
  cancellation. The goal auto-clears on success.`;
}

// ---------------------------------------------------------------------------
// Extension entry point
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
  // ---- in-memory state (rebuilt from session entries on load) ----------

  let goal: GoalState | null = null;
  let hookInstalled = false; // track whether we've wired up the event hooks

  // ---- helpers ----------------------------------------------------------

  function setGoalState(condition: string) {
    goal = { condition, iterations: 0, setAt: Date.now() };
    pi.appendEntry(GOAL_STATE_KEY, goal);
    installHooksOnce();
  }

  function clearGoalState() {
    goal = null;
    pi.appendEntry(GOAL_STATE_KEY, null); // tombstone — signals "no goal"
  }

  /** Remove the goal-related widget and status. */
  function removeGoalIndicator(ctx?: any) {
    try {
      if (ctx?.ui) {
        ctx.ui.setStatus("goal", undefined);
        ctx.ui.setWidget("goal", undefined);
      }
    } catch {
      // ctx may not have ui in non-interactive modes
    }
  }

  /** Show goal status in the TUI widget and footer. */
  function renderGoalIndicator(ctx: any) {
    if (!goal || !ctx?.ui) return;

    const elapsed = formatDuration(Date.now() - goal.setAt);
    const iters = goal.iterations === 0
      ? "not yet evaluated"
      : `${goal.iterations} ${goal.iterations === 1 ? "turn" : "turns"}`;

    ctx.ui.setStatus("goal", `🎯 ${goal.condition} (${iters}, ${elapsed})`);

    const lines = [
      `🎯 Goal: ${goal.condition}`,
      `   Turns: ${iters}  ·  Elapsed: ${elapsed}`,
    ];
    if (goal.lastReason) {
      lines.push(`   Last check: ${goal.lastReason}`);
    }
    ctx.ui.setWidget("goal", lines, { placement: "belowEditor" });
  }

  // ---- session start: restore goal state from persistence ---------------

  function installHooksOnce() {
    if (hookInstalled) return;
    hookInstalled = true;

    // ── before_agent_start: inject goal system prompt ──────────────────
    pi.on("before_agent_start", async (event, ctx) => {
      if (!goal) return;

      // Append goal instructions to the system prompt
      return {
        systemPrompt: event.systemPrompt
          + "\n\n"
          + buildGoalPrompt(goal.condition),
      };
    });

    // ── turn_end: bump iteration counter, render widget ────────────────
    pi.on("turn_end", async (_event, ctx) => {
      if (!goal) return;

      // Bump iteration count
      goal = { ...goal, iterations: goal.iterations + 1 };
      pi.appendEntry(GOAL_STATE_KEY, goal);

      renderGoalIndicator(ctx);
    });

    // ── agent_end: keep the TUI up to date ──────────────────────────────
    pi.on("agent_end", async (_event, ctx) => {
      if (goal) {
        renderGoalIndicator(ctx);
      } else {
        removeGoalIndicator(ctx);
      }
    });

    // ── session_start: restore from persisted state, flush indicator ────
    pi.on("session_start", async (_event, ctx) => {
      goal = null;
      for (const entry of ctx.sessionManager.getBranch()) {
        if (
          entry.type === "custom"
          && entry.customType === "goal:active"
          && entry.data !== null
        ) {
          goal = entry.data as GoalState;
        }
      }

      if (goal) {
        renderGoalIndicator(ctx);
      } else {
        removeGoalIndicator(ctx);
      }
    });
  }

  // Always install hooks on first load so they pick up restored goals
  installHooksOnce();

  // ---- session_start for initial load (also handled in installHooksOnce,
  //      but we also need to run it eagerly for newly started sessions) ---

  // ---- /goal command ----------------------------------------------------

  pi.registerCommand("goal", {
    description: "Set a goal the agent checks before stopping. Usage: /goal <condition> | clear | status",
    getArgumentCompletions: (prefix: string) => {
      const items = [
        { value: "clear", label: "clear", description: "Clear the active goal" },
        { value: "status", label: "status", description: "Show goal status" },
        { value: "all tests pass", label: "all tests pass", description: "Example: run full test suite and verify all pass" },
        { value: "no lint errors", label: "no lint errors", description: "Example: lint project with zero errors" },
        { value: "deploy to staging", label: "deploy to staging", description: "Example: build and deploy to staging" },
      ];
      if (!prefix) return items;
      return items.filter((i) => i.value.startsWith(prefix.toLowerCase()));
    },
    handler: async (args, ctx) => {
      const input = (args ?? "").trim();

      // ── No args: show status ──────────────────────────────────────
      if (!input) {
        if (!goal) {
          ctx.ui.notify("No goal set. Usage: /goal <condition>", "info");
          return;
        }
        const elapsed = formatDuration(Date.now() - goal.setAt);
        const iters = goal.iterations === 0
          ? "not yet evaluated"
          : `${goal.iterations} ${goal.iterations === 1 ? "turn" : "turns"}`;
        let msg = `🎯 Goal active: "${goal.condition}" (${iters}, ${elapsed})`;
        if (goal.lastReason) msg += `\n   Last check: ${goal.lastReason}`;
        ctx.ui.notify(msg, "info");
        return;
      }

      // ── Clear keywords ─────────────────────────────────────────────
      if (CLEAR_KEYWORDS.has(input.toLowerCase())) {
        if (!goal) {
          ctx.ui.notify("No goal set.", "info");
          return;
        }
        const cleared = goal.condition;
        clearGoalState();
        ctx.ui.notify(`Goal cleared: "${cleared}"`, "info");
        removeGoalIndicator(ctx);
        pi.setSessionName(undefined); // restore default session name
        return;
      }

      // ── "status" keyword ────────────────────────────────────────────
      if (input.toLowerCase() === "status") {
        if (!goal) {
          ctx.ui.notify("No goal set. Usage: /goal <condition>", "info");
          return;
        }
        const elapsed = formatDuration(Date.now() - goal.setAt);
        const iters = goal.iterations === 0
          ? "not yet evaluated"
          : `${goal.iterations} ${goal.iterations === 1 ? "turn" : "turns"}`;
        ctx.ui.notify(
          `🎯 Goal: "${goal.condition}" (${iters}, ${elapsed})`
          + (goal.lastReason ? `\n   Last: ${goal.lastReason}` : ""),
          "info",
        );
        return;
      }

      // ── Length check ────────────────────────────────────────────────
      if (input.length > MAX_CONDITION_LENGTH) {
        ctx.ui.notify(
          `Goal condition is limited to ${MAX_CONDITION_LENGTH} characters (got ${input.length}).`,
          "warning",
        );
        return;
      }

      // ── Set new goal ────────────────────────────────────────────────
      setGoalState(input);

      // Name the session after the goal for easy identification
      const sessionName = `🎯 ${input.length > 60 ? input.slice(0, 57) + "..." : input}`;
      pi.setSessionName(sessionName);

      // Show the goal indicator
      renderGoalIndicator(ctx);

      // Trigger the agent with the goal
      const goalPrompt = `I've set a goal: "${input}". Please start working toward it now.`;
      ctx.ui.notify(`🎯 Goal set: "${input}"`, "info");

      // Send the goal as a user message so the model starts working
      pi.sendUserMessage(goalPrompt);
    },
  });

  // ---- goal_achieved tool (called by the model) -------------------------

  pi.registerTool({
    name: "goal_achieved",
    label: "Goal Achieved",
    description:
      "Call this tool when you believe the active goal condition has been fully met. "
      + "Pass the exact condition text and a brief reason. "
      + "The tool result tells you whether the goal was accepted or if you should keep working.",
    promptSnippet: "Call goal_achieved when the active goal condition is met",
    promptGuidelines: [
      "Use goal_achieved to signal that the active goal condition has been satisfied.",
      "Only call it when you are confident the condition is fully met.",
      "Provide a concise reason explaining what evidence confirms the goal condition.",
      "After calling goal_achieved, wait for the tool result — it will tell you whether to continue or wrap up.",
    ],
    parameters: Type.Object({
      condition: Type.String({ description: "The exact goal condition that was set" }),
      reason: Type.String({ description: "Brief explanation of why the condition is met" }),
    }),
    async execute(toolCallId, params, _signal, _onUpdate, ctx) {
      // Validate: is there an active goal?
      if (!goal) {
        return {
          content: [{
            type: "text" as const,
            text: "No active goal set. Nothing to do — continue with your normal work.",
          }],
          details: { accepted: false },
        };
      }

      // Validate: condition matches
      if (params.condition !== goal.condition) {
        return {
          content: [{
            type: "text" as const,
            text: `The active goal condition is "${goal.condition}", not "${params.condition}". Keep working toward the correct goal.`,
          }],
          details: { accepted: false },
        };
      }

      // ── Goal achieved! ──────────────────────────────────────────────

      const iterations = goal.iterations + 1;
      const durationMs = Date.now() - goal.setAt;
      const elapsed = formatDuration(durationMs);

      // Record the reason for the final status
      goal = { ...goal, iterations, lastReason: params.reason };

      ctx.ui.notify(
        `🎯 Goal achieved: "${goal.condition}" (${iterations} ${iterations === 1 ? "turn" : "turns"}, ${elapsed})\n   ${params.reason}`,
        "info",
      );

      // Clear goal state
      const achievedCondition = goal.condition;
      clearGoalState();
      removeGoalIndicator(ctx);

      // Reset session name
      pi.setSessionName(undefined);

      // Telemetry-style feedback
      console.log(
        `[goal] achieved: "${achievedCondition}" ${iterations}turns ${durationMs}ms`,
      );

      return {
        content: [{
          type: "text" as const,
          text: `✅ Goal achieved: "${achievedCondition}"\n\nReason: ${params.reason}\n\nThis goal is now complete. Wrap up anything you were doing and present the final results to the user.`,
        }],
        details: {
          accepted: true,
          condition: achievedCondition,
          iterations,
          durationMs,
          reason: params.reason,
        },
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m ${secs}s`;
}
