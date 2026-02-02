import fs from "node:fs/promises";
import path from "node:path";
import { createSubsystemLogger } from "../logging/subsystem.js";

const log = createSubsystemLogger("memory:consolidation");

export interface ConsolidationConfig {
  /** Process session logs older than N days (default: 7) */
  maxAgeDays: number;
  /** Archive MEMORY.md entries not referenced in N days (default: 60) */
  staleThresholdDays: number;
}

export interface ConsolidationResult {
  processedFiles: string[];
  archivedFiles: string[];
  extractedFacts: number;
  dynamicProfileUpdated: boolean;
}

const DEFAULT_CONFIG: ConsolidationConfig = {
  maxAgeDays: 7,
  staleThresholdDays: 60,
};

/**
 * Consolidates daily session logs into MEMORY.md and manages staleness.
 *
 * Flow:
 * 1. List memory/*.md files older than maxAgeDays
 * 2. For each, call summarize() to extract key facts (LLM call)
 * 3. Read current MEMORY.md
 * 4. Merge new facts (caller handles contradiction detection)
 * 5. Move processed daily logs to memory/archive/
 * 6. Generate/update Dynamic Profile section in MEMORY.md
 */
export async function consolidateMemory(params: {
  workspaceDir: string;
  config?: Partial<ConsolidationConfig>;
  summarize: (text: string, prompt: string) => Promise<string>;
}): Promise<ConsolidationResult> {
  const config = { ...DEFAULT_CONFIG, ...params.config };
  const memoryDir = path.join(params.workspaceDir, "memory");
  const archiveDir = path.join(memoryDir, "archive");
  const memoryMdPath = path.join(params.workspaceDir, "MEMORY.md");

  const result: ConsolidationResult = {
    processedFiles: [],
    archivedFiles: [],
    extractedFacts: 0,
    dynamicProfileUpdated: false,
  };

  // 1. Find old daily logs
  const cutoffMs = Date.now() - config.maxAgeDays * 86_400_000;
  let files: string[];
  try {
    const entries = await fs.readdir(memoryDir, { withFileTypes: true });
    files = entries
      .filter((e) => e.isFile() && /^\d{4}-\d{2}-\d{2}\.md$/.test(e.name))
      .map((e) => path.join(memoryDir, e.name));
  } catch {
    log.debug("No memory directory found, skipping consolidation");
    return result;
  }

  const oldFiles: Array<{ absPath: string; name: string }> = [];
  for (const absPath of files) {
    try {
      const stat = await fs.stat(absPath);
      if (stat.mtimeMs < cutoffMs) {
        oldFiles.push({ absPath, name: path.basename(absPath) });
      }
    } catch {
      continue;
    }
  }

  if (oldFiles.length === 0) {
    log.debug("No old session logs to consolidate");
    return result;
  }

  // 2. Extract facts from each old file
  const allFacts: string[] = [];
  for (const file of oldFiles) {
    try {
      const content = await fs.readFile(file.absPath, "utf-8");
      if (!content.trim()) continue;

      const facts = await params.summarize(
        content,
        `Extract key facts from this daily session log as a bullet list.
Focus on: user preferences, financial patterns, merchant info, important decisions, recurring behaviors.
Skip: greetings, small talk, tool call details, temporary notes.
Format each fact as: - **key**: value
Return ONLY the bullet list, no other text.`,
      );

      if (facts.trim()) {
        const factLines = facts.split("\n").filter((l) => l.trim().startsWith("-"));
        allFacts.push(...factLines);
        result.extractedFacts += factLines.length;
      }
      result.processedFiles.push(file.name);
    } catch (err) {
      log.warn(`Failed to summarize ${file.name}: ${String(err)}`);
    }
  }

  // 3. Read current MEMORY.md
  let memoryContent = "";
  try {
    memoryContent = await fs.readFile(memoryMdPath, "utf-8");
  } catch {
    memoryContent =
      "# น้อง Rari - Long-Term Memory\n\n*This file stores curated insights and patterns.*\n";
  }

  // 4. Merge new facts into MEMORY.md
  if (allFacts.length > 0) {
    const consolidatedSection = `\n## Consolidated from Daily Logs (auto-generated)\n${allFacts.join("\n")}\n`;

    // Replace existing consolidated section or append before Dynamic Profile
    const consolidatedMarker = "## Consolidated from Daily Logs (auto-generated)";
    const dynamicMarker = "## Dynamic Profile (auto-generated)";
    const archivedMarker = "## Archived";

    if (memoryContent.includes(consolidatedMarker)) {
      // Replace existing section
      const start = memoryContent.indexOf(consolidatedMarker);
      let end = memoryContent.length;
      for (const marker of [dynamicMarker, archivedMarker]) {
        const idx = memoryContent.indexOf(marker, start + consolidatedMarker.length);
        if (idx !== -1 && idx < end) end = idx;
      }
      memoryContent =
        memoryContent.slice(0, start) +
        consolidatedSection.trim() +
        "\n\n" +
        memoryContent.slice(end);
    } else {
      // Insert before Dynamic Profile or Archived, or append at end
      let insertAt = memoryContent.length;
      for (const marker of [dynamicMarker, archivedMarker]) {
        const idx = memoryContent.indexOf(marker);
        if (idx !== -1 && idx < insertAt) insertAt = idx;
      }
      memoryContent =
        memoryContent.slice(0, insertAt) +
        consolidatedSection +
        "\n" +
        memoryContent.slice(insertAt);
    }
  }

  // 5. Generate Dynamic Profile from recent activity
  const recentFiles = files.filter((f) => {
    const name = path.basename(f, ".md");
    return /^\d{4}-\d{2}-\d{2}$/.test(name);
  });
  const recentNames = recentFiles
    .map((f) => path.basename(f, ".md"))
    .sort()
    .reverse()
    .slice(0, 7);

  if (recentNames.length > 0) {
    let recentContent = "";
    for (const name of recentNames) {
      try {
        const content = await fs.readFile(path.join(memoryDir, `${name}.md`), "utf-8");
        recentContent += `\n--- ${name} ---\n${content.slice(0, 2000)}\n`;
      } catch {
        continue;
      }
    }

    if (recentContent.trim()) {
      try {
        const profile = await params.summarize(
          recentContent,
          `Based on these recent daily logs, generate a brief "Dynamic Profile" with two sections:
### Current Focus
- List 2-4 things the user is currently focused on (projects, goals, events)

### Recently Active Merchants
- List merchants seen in the last 7 days with last-seen date

Format as markdown. Be concise.`,
        );

        if (profile.trim()) {
          const dynamicSection = `\n## Dynamic Profile (auto-generated)\n${profile.trim()}\n`;
          const dynamicMarker = "## Dynamic Profile (auto-generated)";
          const archivedMarker = "## Archived";

          if (memoryContent.includes(dynamicMarker)) {
            const start = memoryContent.indexOf(dynamicMarker);
            let end = memoryContent.length;
            const archiveIdx = memoryContent.indexOf(archivedMarker, start + dynamicMarker.length);
            if (archiveIdx !== -1) end = archiveIdx;
            memoryContent =
              memoryContent.slice(0, start) +
              dynamicSection.trim() +
              "\n\n" +
              memoryContent.slice(end);
          } else {
            const archiveIdx = memoryContent.indexOf(archivedMarker);
            const insertAt = archiveIdx !== -1 ? archiveIdx : memoryContent.length;
            memoryContent =
              memoryContent.slice(0, insertAt) +
              dynamicSection +
              "\n" +
              memoryContent.slice(insertAt);
          }
          result.dynamicProfileUpdated = true;
        }
      } catch (err) {
        log.warn(`Failed to generate dynamic profile: ${String(err)}`);
      }
    }
  }

  // Ensure Archived section exists
  if (!memoryContent.includes("## Archived")) {
    memoryContent +=
      "\n## Archived\n\n*Entries not seen in 60+ days are moved here automatically.*\n";
  }

  // 6. Write updated MEMORY.md
  await fs.writeFile(memoryMdPath, memoryContent, "utf-8");

  // 7. Move processed files to archive
  try {
    await fs.mkdir(archiveDir, { recursive: true });
  } catch {
    // already exists
  }

  for (const file of oldFiles) {
    if (!result.processedFiles.includes(file.name)) continue;
    try {
      await fs.rename(file.absPath, path.join(archiveDir, file.name));
      result.archivedFiles.push(file.name);
    } catch (err) {
      log.warn(`Failed to archive ${file.name}: ${String(err)}`);
    }
  }

  log.debug("consolidation complete", {
    processed: result.processedFiles.length,
    archived: result.archivedFiles.length,
    facts: result.extractedFacts,
    profileUpdated: result.dynamicProfileUpdated,
  });

  return result;
}
