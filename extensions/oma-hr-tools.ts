import { Type } from "@earendil-works/pi-ai";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

// Job-management tools for the built-in HR agent. They call the platform's
// admin-only /api/hr surface with a short-lived capability token that the app
// injects per chat; without that token every call fails closed.

const DEFAULT_TIMEOUT_MS = 30_000;

function platformEndpoint(path: string): { url: string; token: string } {
  const base = (process.env.OMA_INTERNAL_BASE_URL?.trim() || "http://127.0.0.1:8000").replace(/\/+$/, "");
  const token = process.env.OMA_TOOL_TOKEN?.trim();
  if (!token) throw new Error("OMA_TOOL_TOKEN is not set for this chat");
  return { url: `${base}${path}`, token };
}

async function callPlatform(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<unknown> {
  const { url, token } = platformEndpoint(path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-OMA-Tool-Token": token,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }
    if (!response.ok) {
      const detail = asRecord(payload)?.detail ?? payload;
      throw new Error(`${method} ${path} failed (${response.status}): ${stringify(detail).slice(0, 900)}`);
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function recordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.map((item) => asRecord(item)).filter((item): item is Record<string, unknown> => item !== null)
    : [];
}

function fieldText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function fieldCount(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return Array.isArray(value) ? value.length : 0;
}

function listAgentRows(agents: Record<string, unknown>[]): string {
  if (!agents.length) return "No jobs yet.";
  return agents
    .map((agent) =>
      [
        `- ${fieldText(agent, "name")} (${fieldText(agent, "id")})`,
        `  deliverable: ${fieldText(agent, "deliverable") || "(missing)"}`,
        `  description: ${fieldText(agent, "description") || "(missing)"}`,
        `  skills: ${fieldCount(agent, "skills")}, tools: ${fieldCount(agent, "tools")}, acceptance: ${fieldCount(agent, "acceptance")}`,
      ].join("\n"),
    )
    .join("\n");
}

const listAgentsTool = defineTool({
  name: "list_agents",
  label: "List Jobs",
  description: "List the admin's agent jobs with delivery, skills, tools and acceptance counts.",
  promptSnippet: "list_agents: see every job and its shape before proposing changes.",
  parameters: Type.Object({}),
  async execute() {
    const payload = asRecord(await callPlatform("GET", "/api/hr/agents"));
    const agents = recordList(payload?.agents);
    return { content: [{ type: "text", text: listAgentRows(agents) }], details: { count: agents.length } };
  },
});

const getAgentTool = defineTool({
  name: "get_agent",
  label: "Get Job",
  description: "Read one job definition together with the definition-lint findings.",
  promptSnippet: "get_agent: read the full job and any pending lint findings.",
  parameters: Type.Object({ agent_id: Type.String({ description: "Job id." }) }),
  async execute(_toolCallId, params) {
    const payload = asRecord(await callPlatform("GET", `/api/hr/agents/${encodeURIComponent(params.agent_id.trim())}`));
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const findAgentsTool = defineTool({
  name: "find_agents",
  label: "Find Similar Jobs",
  description: "Compare a proposed job against existing jobs and return similarity so a duplicate is not created.",
  promptSnippet: "find_agents: check for an existing job that already covers this work.",
  parameters: Type.Object({
    name: Type.String({ description: "Proposed job name." }),
    instruction: Type.String({ description: "Draft instruction (any length)." }),
    description: Type.Optional(Type.String({ description: "One-line recruiting summary." })),
    deliverable: Type.Optional(Type.String({ description: "The single output this job owns." })),
    skills: Type.Optional(Type.Array(Type.String(), { description: "Selected skill paths." })),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("POST", "/api/hr/agents/find", {
      name: params.name,
      instruction: params.instruction,
      description: params.description ?? null,
      deliverable: params.deliverable ?? null,
      acceptance: [],
      skills: params.skills ?? [],
    });
    return { content: [{ type: "text", text: stringify(asRecord(payload)?.matches ?? []) }], details: {} };
  },
});

const createAgentTool = defineTool({
  name: "create_agent",
  label: "Create Job",
  description:
    "Create a job. Requires a deliverable, at least three acceptance criteria and confirm=true. Duplicate matches block creation unless duplicate_decision is new or variant.",
  promptSnippet: "create_agent: hire a job only after the user confirms the job card.",
  parameters: Type.Object({
    name: Type.String({ description: "Job name." }),
    instruction: Type.String({ description: "Job description using Role/Deliverable/Boundaries/Routing/Environment." }),
    description: Type.String({ description: "One-line recruiting summary (max 240)." }),
    deliverable: Type.String({ description: "The single output this job owns." }),
    acceptance: Type.Array(Type.String(), { description: "Three or more checkable acceptance criteria." }),
    skills: Type.Optional(Type.Array(Type.String(), { description: "Skill paths to attach." })),
    tools: Type.Optional(
      Type.Array(Type.String(), { description: "Tool names; defaults to the platform default set." }),
    ),
    tags: Type.Optional(Type.Array(Type.String())),
    quickstarts: Type.Optional(Type.Array(Type.String())),
    duplicate_decision: Type.Optional(
      Type.String({ description: "new or variant when a similar job already exists." }),
    ),
    confirm: Type.Boolean({ description: "Set true only when the user confirmed the job card." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("POST", "/api/hr/agents", params);
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const updateAgentTool = defineTool({
  name: "update_agent",
  label: "Update Job",
  description: "Patch a job definition. Re-runs the definition lint and requires confirm=true.",
  promptSnippet: "update_agent: change an existing job after the user agrees to the new job card.",
  parameters: Type.Object({
    agent_id: Type.String({ description: "Job id." }),
    patch: Type.Record(Type.String(), Type.Unknown(), {
      description:
        "Subset of name, instruction, description, deliverable, acceptance, tags, quickstarts, tools, skills.",
    }),
    confirm: Type.Boolean({ description: "Set true only when the user confirmed the change." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("PATCH", `/api/hr/agents/${encodeURIComponent(params.agent_id.trim())}`, {
      ...(asRecord(params.patch) ?? {}),
      confirm: params.confirm,
    });
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const deleteAgentTool = defineTool({
  name: "delete_agent",
  label: "Retire Job",
  description: "Soft-delete a job. Irreversible through the API; requires confirm=true.",
  promptSnippet: "delete_agent: retire a job only after a second explicit confirmation.",
  parameters: Type.Object({
    agent_id: Type.String({ description: "Job id." }),
    confirm: Type.Boolean({ description: "Set true only after the user confirmed the retirement." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform(
      "DELETE",
      `/api/hr/agents/${encodeURIComponent(params.agent_id.trim())}?confirm=${params.confirm ? "true" : "false"}`,
    );
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const listSkillsTool = defineTool({
  name: "list_skills",
  label: "List Skills",
  description: "List every installed skill with its routing description and the jobs that use it.",
  promptSnippet: "list_skills: see the capability catalogue before inventing a new skill.",
  parameters: Type.Object({}),
  async execute() {
    const payload = asRecord(await callPlatform("GET", "/api/hr/skills"));
    const skills = recordList(payload?.skills);
    const text = skills.length
      ? skills
          .map(
            (skill) =>
              `- ${fieldText(skill, "name")}: ${fieldText(skill, "description").slice(0, 140)} (used by ${fieldCount(skill, "agents")})`,
          )
          .join("\n")
      : "No skills installed.";
    return { content: [{ type: "text", text }], details: { count: skills.length } };
  },
});

const findSkillsTool = defineTool({
  name: "find_skills",
  label: "Find Skills",
  description: "Search installed skills by natural-language need or keyword.",
  promptSnippet: "find_skills: look for an existing capability before proposing new work.",
  parameters: Type.Object({ query: Type.String({ description: "What the job needs to do." }) }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("POST", "/api/hr/skills/find", { query: params.query });
    return { content: [{ type: "text", text: stringify(asRecord(payload)?.skills ?? []) }], details: {} };
  },
});

const getSkillTool = defineTool({
  name: "get_skill",
  label: "Read Skill",
  description: "Read one skill's SKILL.md, file list and the jobs that use it.",
  promptSnippet: "get_skill: read a skill before deciding whether it fits the job.",
  parameters: Type.Object({ name: Type.String({ description: "Skill name or path." }) }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("GET", `/api/hr/skills/${encodeURIComponent(params.name.trim())}`);
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const attachSkillTool = defineTool({
  name: "attach_skill",
  label: "Attach Skill",
  description: "Attach an installed skill to a job. Requires confirm=true.",
  promptSnippet: "attach_skill: grant a job a capability it needs.",
  parameters: Type.Object({
    agent_id: Type.String({ description: "Job id." }),
    skill: Type.String({ description: "Skill name or path." }),
    confirm: Type.Boolean({ description: "Set true only when the user confirmed the grant." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("POST", `/api/hr/agents/${encodeURIComponent(params.agent_id.trim())}/skills`, {
      skill: params.skill,
      confirm: params.confirm,
    });
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const detachSkillTool = defineTool({
  name: "detach_skill",
  label: "Detach Skill",
  description: "Remove a skill from a job. Requires confirm=true.",
  promptSnippet: "detach_skill: revoke a capability a job does not need.",
  parameters: Type.Object({
    agent_id: Type.String({ description: "Job id." }),
    skill: Type.String({ description: "Skill name." }),
    confirm: Type.Boolean({ description: "Set true only when the user confirmed the revocation." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform(
      "DELETE",
      `/api/hr/agents/${encodeURIComponent(params.agent_id.trim())}/skills/${encodeURIComponent(
        params.skill.trim(),
      )}?confirm=${params.confirm ? "true" : "false"}`,
    );
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const listToolsTool = defineTool({
  name: "list_tools",
  label: "List Tools",
  description: "List the platform's available tools and how many jobs use each one.",
  promptSnippet: "list_tools: choose the smallest permission set for a job.",
  parameters: Type.Object({}),
  async execute() {
    const payload = asRecord(await callPlatform("GET", "/api/hr/tools"));
    const tools = recordList(payload?.tools);
    const text = tools
      .map(
        (tool) =>
          `- ${fieldText(tool, "name")} (${fieldText(tool, "source")}, used by ${fieldCount(tool, "agents")}): ${fieldText(tool, "description")}`,
      )
      .join("\n");
    return { content: [{ type: "text", text }], details: { count: tools.length } };
  },
});

const createSkillTool = defineTool({
  name: "create_skill",
  label: "Create Skill",
  description:
    "Author a new skill in the shared skills root. Requires confirm=true. Fails when the name is taken or the body, description or references break the size rules.",
  promptSnippet:
    "create_skill: write the skill itself only when no installed skill covers the capability.",
  parameters: Type.Object({
    name: Type.String({ description: "Lowercase dash-separated name, max 64 characters." }),
    description: Type.String({
      description: "Single-line routing description: what it does and when to use it. Max 500 characters.",
    }),
    body: Type.String({ description: "SKILL.md body in Markdown (frontmatter is generated)." }),
    references: Type.Optional(
      Type.Record(Type.String(), Type.String(), {
        description: "Optional extra files keyed by relative path, for example references/checklist.md.",
      }),
    ),
    confirm: Type.Boolean({ description: "Set true only when the user confirmed the skill content." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("POST", "/api/hr/skills", {
      name: params.name,
      description: params.description,
      body: params.body,
      references: asRecord(params.references) ?? {},
      confirm: params.confirm,
    });
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const updateSkillTool = defineTool({
  name: "update_skill",
  label: "Update Skill",
  description:
    "Patch a platform-authored skill. Refuses skills it did not create. Requires confirm=true.",
  promptSnippet: "update_skill: revise a skill after the user agrees to the new wording.",
  parameters: Type.Object({
    name: Type.String({ description: "Skill name." }),
    description: Type.Optional(Type.String({ description: "Replacement routing description." })),
    body: Type.Optional(Type.String({ description: "Replacement SKILL.md body." })),
    references: Type.Optional(
      Type.Record(Type.String(), Type.String(), { description: "Files to write or overwrite." }),
    ),
    remove_references: Type.Optional(
      Type.Array(Type.String(), { description: "Relative reference paths to delete." }),
    ),
    confirm: Type.Boolean({ description: "Set true only when the user confirmed the change." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("PATCH", `/api/hr/skills/${encodeURIComponent(params.name.trim())}`, {
      ...(params.description === undefined ? {} : { description: params.description }),
      ...(params.body === undefined ? {} : { body: params.body }),
      references: asRecord(params.references) ?? {},
      remove_references: params.remove_references ?? [],
      confirm: params.confirm,
    });
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const deleteSkillTool = defineTool({
  name: "delete_skill",
  label: "Delete Skill",
  description:
    "Delete a platform-authored skill. Refuses skills that are still attached to a job or were not created here.",
  promptSnippet: "delete_skill: remove a skill only after detaching it from every job.",
  parameters: Type.Object({
    name: Type.String({ description: "Skill name." }),
    confirm: Type.Boolean({ description: "Set true only after the user confirmed the removal." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform(
      "DELETE",
      `/api/hr/skills/${encodeURIComponent(params.name.trim())}?confirm=${params.confirm ? "true" : "false"}`,
    );
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const installSkillTool = defineTool({
  name: "install_skill",
  label: "Install Skill",
  description:
    "Install a skill from a GitHub repository or skills.sh source using the platform's skills CLI.",
  promptSnippet: "install_skill: pull an existing public skill instead of rewriting it.",
  parameters: Type.Object({
    source: Type.String({ description: "GitHub repository or skill URL." }),
    skill: Type.String({ description: "Skill name inside that source." }),
    confirm: Type.Boolean({ description: "Set true only when the user confirmed the install." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("POST", "/api/hr/skills/install", params);
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

const uninstallSkillTool = defineTool({
  name: "uninstall_skill",
  label: "Uninstall Skill",
  description: "Remove an installed skill. Refuses skills that are still attached to a job.",
  promptSnippet: "uninstall_skill: remove an installed skill after detaching it from every job.",
  parameters: Type.Object({
    skill: Type.String({ description: "Skill name." }),
    source: Type.Optional(Type.String({ description: "Original source, when known." })),
    confirm: Type.Boolean({ description: "Set true only after the user confirmed the removal." }),
  }),
  async execute(_toolCallId, params) {
    const payload = await callPlatform("POST", "/api/hr/skills/uninstall", {
      source: params.source ?? "",
      skill: params.skill,
      confirm: params.confirm,
    });
    return { content: [{ type: "text", text: stringify(payload) }], details: {} };
  },
});

export default function (pi: ExtensionAPI) {
  pi.registerTool(listAgentsTool);
  pi.registerTool(getAgentTool);
  pi.registerTool(findAgentsTool);
  pi.registerTool(createAgentTool);
  pi.registerTool(updateAgentTool);
  pi.registerTool(deleteAgentTool);
  pi.registerTool(listSkillsTool);
  pi.registerTool(findSkillsTool);
  pi.registerTool(getSkillTool);
  pi.registerTool(attachSkillTool);
  pi.registerTool(detachSkillTool);
  pi.registerTool(createSkillTool);
  pi.registerTool(updateSkillTool);
  pi.registerTool(deleteSkillTool);
  pi.registerTool(installSkillTool);
  pi.registerTool(uninstallSkillTool);
  pi.registerTool(listToolsTool);
}
