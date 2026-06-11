// Pure function — no DB calls, no HTTP. Input in → output out.

export type NoseGroup = "LN" | "RN" | "DN" | "NONE" | "OVERFLOW";

export interface MatingInput {
  id: string;
  maleName: string;
  henNames: string[];
  henGroups?: (string | null)[];
  sameMarking: boolean | null;
  mandatoryMarking: string | null;
}

export interface MandatoryOverride {
  matingId: string;
  marking: string;
}

export interface HenAssignment {
  henName: string;
  marking: string;
}

export interface MarkingAssignment {
  matingId: string;
  maleName: string;
  noseGroup: NoseGroup;
  hens: HenAssignment[];
}

// ── Feet marks + conflict rules ───────────────────────────────────────────────

const FEET_MARKS = ["LO", "RO", "LI", "RI", "DL", "DR", "OO", "II"] as const;

// shorthand expansions for conflict logic
const EXPANSIONS: Record<string, string[]> = {
  DL: ["LO", "LI"],
  DR: ["RO", "RI"],
  OO: ["LO", "RO"],
  II: ["LI", "RI"],
};

const CONFLICT_PAIRS: [string, string][] = [
  ["LO", "DL"], ["LI", "DL"], ["RO", "DR"], ["RI", "DR"],
  ["LO", "OO"], ["RO", "OO"], ["LI", "II"], ["RI", "II"],
  ["DL", "OO"], ["DR", "OO"], ["DL", "II"], ["DR", "II"],
];

function expandMark(mark: string): string[] {
  return EXPANSIONS[mark] ?? [mark];
}

function hasConflict(combo: string[]): boolean {
  // check explicit conflict pairs
  for (const [a, b] of CONFLICT_PAIRS) {
    if (combo.includes(a) && combo.includes(b)) return true;
  }
  // LO+LI together (without DL) is invalid — must use DL
  if (combo.includes("LO") && combo.includes("LI") && !combo.includes("DL")) return true;
  // RO+RI together (without DR) is invalid — must use DR
  if (combo.includes("RO") && combo.includes("RI") && !combo.includes("DR")) return true;
  return false;
}

function buildFeetCombos(): string[][] {
  const marks = [...FEET_MARKS];
  const results: string[][] = [];

  // power set
  for (let i = 1; i < (1 << marks.length); i++) {
    const combo: string[] = [];
    for (let j = 0; j < marks.length; j++) {
      if (i & (1 << j)) combo.push(marks[j]);
    }
    if (!hasConflict(combo)) results.push(combo);
  }
  return results;
}

const VALID_FEET_COMBOS = buildFeetCombos();

// ── Build the full combo pool grouped by nose ─────────────────────────────────

type GroupedPool = Record<NoseGroup, string[]>;

function buildGroupedPool(): GroupedPool {
  const noses: Array<NoseGroup | null> = ["LN", "RN", "DN", null];
  const pool: GroupedPool = { LN: [], RN: [], DN: [], NONE: [], OVERFLOW: [] };

  for (const nose of noses) {
    const group: NoseGroup = nose ?? "NONE";
    for (const feet of VALID_FEET_COMBOS) {
      const combo = nose ? [nose, ...feet].join("-") : feet.join("-");
      pool[group].push(combo);
    }
    // single-part marks at the end (last resort)
    if (nose) {
      pool[group].push(nose);
    } else {
      for (const f of FEET_MARKS) pool[group].push(f);
    }
  }

  return pool;
}

function pickFromPool(pool: string[], used: Set<string>): string | null {
  const available = pool.filter((c) => !used.has(c));
  // shortest combo first: 2-part before 3-part before 4-part, etc.
  available.sort((a, b) => a.split("-").length - b.split("-").length);
  return available[0] ?? null;
}

function getNoseGroupForCombo(combo: string): NoseGroup {
  if (combo.startsWith("LN")) return "LN";
  if (combo.startsWith("RN")) return "RN";
  if (combo.startsWith("DN")) return "DN";
  return "NONE";
}

// ── Main engine ───────────────────────────────────────────────────────────────

export function generateMarkings(
  matings: MatingInput[],
  mandatoryOverrides: MandatoryOverride[] = []
): MarkingAssignment[] {
  const basePool = buildGroupedPool();
  // deep-clone the pool so the engine is stateless
  const pool: GroupedPool = {
    LN: [...basePool.LN],
    RN: [...basePool.RN],
    DN: [...basePool.DN],
    NONE: [...basePool.NONE],
    OVERFLOW: [...basePool.OVERFLOW],
  };

  const usedCombos = new Set<string>();
  const claimedGroups = new Set<NoseGroup>();
  const results: MarkingAssignment[] = [];

  const overrideMap = new Map(mandatoryOverrides.map((o) => [o.matingId, o.marking]));

  // resolve effective mandatory marking per mating
  const effective = matings.map((m) => ({
    ...m,
    effectiveMandatory: overrideMap.get(m.id) ?? m.mandatoryMarking ?? null,
  }));

  // Pass 1 — mandatory matings first
  const mandatory = effective.filter((m) => m.effectiveMandatory !== null);
  const rest = effective.filter((m) => m.effectiveMandatory === null);

  function assignMating(m: typeof effective[0], group: NoseGroup): MarkingAssignment {
    const groupPool = pool[group];
    const henCount = m.henNames.length;
    const hens: HenAssignment[] = [];

    if (m.effectiveMandatory) {
      // first hen gets mandatory
      usedCombos.add(m.effectiveMandatory);
      hens.push({ henName: m.henNames[0], marking: m.effectiveMandatory });
      // remaining hens get next available from same group
      for (let i = 1; i < henCount; i++) {
        const next = pickFromPool(groupPool, usedCombos);
        if (!next) throw new Error(`Pool exhausted for group ${group} (mating ${m.maleName})`);
        usedCombos.add(next);
        hens.push({ henName: m.henNames[i], marking: next });
      }
    } else if (m.sameMarking === true || henCount === 1) {
      const combo = pickFromPool(groupPool, usedCombos);
      if (!combo) throw new Error(`Pool exhausted for group ${group} (mating ${m.maleName})`);
      usedCombos.add(combo);
      for (const name of m.henNames) hens.push({ henName: name, marking: combo });
    } else {
      // diff marking — hens with the same group label share one combo, ungrouped hens get unique
      const groupMarkingMap = new Map<string, string>(); // group label → assigned combo
      for (let i = 0; i < m.henNames.length; i++) {
        const name = m.henNames[i];
        const grpLabel = m.henGroups?.[i] ?? null;
        if (grpLabel && groupMarkingMap.has(grpLabel)) {
          // sister — reuse same combo as the group leader
          hens.push({ henName: name, marking: groupMarkingMap.get(grpLabel)! });
        } else {
          const combo = pickFromPool(groupPool, usedCombos);
          if (!combo) throw new Error(`Pool exhausted for group ${group} (mating ${m.maleName})`);
          usedCombos.add(combo);
          hens.push({ henName: name, marking: combo });
          if (grpLabel) groupMarkingMap.set(grpLabel, combo);
        }
      }
    }

    return { matingId: m.id, maleName: m.maleName, noseGroup: group, hens };
  }

  for (const m of mandatory) {
    const group = getNoseGroupForCombo(m.effectiveMandatory!);
    if (!claimedGroups.has(group)) claimedGroups.add(group);
    results.push(assignMating(m, group));
  }

  // Pass 2 — remaining matings
  const priority: NoseGroup[] = ["LN", "RN", "DN", "NONE"];

  for (const m of rest) {
    let group: NoseGroup | null = null;
    for (const g of priority) {
      if (!claimedGroups.has(g)) {
        group = g;
        claimedGroups.add(g);
        break;
      }
    }
    if (!group) {
      // OVERFLOW — pick group with most remaining combos
      let best: NoseGroup = "LN";
      let bestCount = 0;
      for (const g of priority) {
        const avail = pool[g].filter((c) => !usedCombos.has(c)).length;
        if (avail > bestCount) { bestCount = avail; best = g; }
      }
      group = best;
    }
    results.push(assignMating(m, group));
  }

  // ── Duplicate scan ────────────────────────────────────────────────────────
  // Each unique combo must appear in at most one mating (same-marking within
  // a mating is fine — sisters share intentionally). Cross-mating duplicates
  // would mean two different stags share a marking combo, which is invalid.
  const seenCombos = new Map<string, string>(); // combo → maleName
  for (const r of results) {
    const uniqueInMating = new Set(r.hens.map((h) => h.marking));
    for (const combo of uniqueInMating) {
      if (seenCombos.has(combo)) {
        throw new Error(
          `Duplicate marking "${combo}" assigned to both "${seenCombos.get(combo)}" and "${r.maleName}". Pool may be exhausted.`
        );
      }
      seenCombos.set(combo, r.maleName);
    }
  }

  return results;
}

// ── Validation helpers ────────────────────────────────────────────────────────

export function isValidCombo(combo: string): boolean {
  const basePool = buildGroupedPool();
  return Object.values(basePool).flat().includes(combo);
}
