import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  computeDAGLayout,
  useHostTheme,
} from "cursor/canvas";
import type { CSSProperties } from "react";
import { useMemo } from "react";

/**
 * ARCH-SYNC-INTENT-IDENTITY — agreed sync logic after debate #37.
 * Source: docs/pilot/results/UX-OBS-TT-SOAK/37-sync-intent-identity-debate.md
 */

const INTENTS: Array<{
  rank: string;
  term: string;
  gloss: string;
  kind: "safe" | "destructive";
  note: string;
}> = [
  {
    rank: "1",
    term: "Link",
    gloss: "привязка маркера",
    kind: "safe",
    note: "Rebind / Rematch; stamp tombstones on displaced ids",
  },
  {
    rank: "2",
    term: "DetachMarker",
    gloss: "снять id, текст оставить",
    kind: "safe",
    note: "Remote-gone in-session; drains hold — stops Rebind loop",
  },
  {
    rank: "3",
    term: "InsertLine",
    gloss: "вставить строку",
    kind: "safe",
    note: "New vault line for unmatched remote / rematch insert",
  },
  {
    rank: "4",
    term: "PullStripVault",
    gloss: "убрать строку из vault",
    kind: "destructive",
    note: "Residual only; UI Confirm / Apply",
  },
  {
    rank: "5",
    term: "PushDeleteTT",
    gloss: "удалить в TickTick",
    kind: "destructive",
    note: "Only proven user-removed or explicit authorize",
  },
];

const BROKEN_NODES = [
  { id: "prep", label: "prepare" },
  { id: "del", label: "delete planners" },
  { id: "hold", label: "hold ~195 detach" },
  { id: "rebind", label: "Rebind ~28" },
  { id: "confirm", label: "Confirm wipe" },
  { id: "loop", label: "holds again" },
];

const BROKEN_EDGES = [
  { from: "prep", to: "del" },
  { from: "del", to: "hold" },
  { from: "hold", to: "rebind" },
  { from: "rebind", to: "confirm" },
  { from: "confirm", to: "loop" },
  { from: "loop", to: "hold" },
];

const TARGET_NODES = [
  { id: "prep", label: "prepare" },
  { id: "id", label: "identity pass" },
  { id: "scan", label: "re-scan presentIds" },
  { id: "intents", label: "compile intents" },
  { id: "apply", label: "apply by precedence" },
  { id: "ui", label: "Sync discrepancies" },
];

const TARGET_EDGES = [
  { from: "prep", to: "id" },
  { from: "id", to: "scan" },
  { from: "scan", to: "intents" },
  { from: "intents", to: "apply" },
  { from: "apply", to: "ui" },
];

function FlowDag({
  title,
  subtitle,
  nodes,
  edges,
  dangerCycle,
}: {
  title: string;
  subtitle: string;
  nodes: Array<{ id: string; label: string }>;
  edges: Array<{ from: string; to: string }>;
  dangerCycle?: boolean;
}) {
  const theme = useHostTheme();
  const layout = useMemo(
    () =>
      computeDAGLayout({
        nodes,
        edges,
        direction: "horizontal",
        nodeWidth: 118,
        nodeHeight: 36,
        rankGap: 36,
        nodeGap: 16,
        padding: 8,
      }),
    [nodes, edges],
  );

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const dangerStroke = theme.diff.removedLine;

  return (
    <Card>
      <CardHeader
        trailing={
          dangerCycle ? (
            <Pill tone="deleted" active size="sm">
              broken
            </Pill>
          ) : (
            <Pill tone="success" active size="sm">
              target
            </Pill>
          )
        }
      >
        {title}
      </CardHeader>
      <CardBody style={{ padding: 12 }}>
        <Text size="small" tone="secondary">
          {subtitle}
        </Text>
        <svg
          width="100%"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{ display: "block", maxHeight: 120, marginTop: 8 }}
        >
          {layout.edges.map((e, i) => (
            <line
              key={i}
              x1={e.sourceX}
              y1={e.sourceY}
              x2={e.targetX}
              y2={e.targetY}
              stroke={
                e.isBackEdge || dangerCycle
                  ? dangerStroke
                  : theme.stroke.secondary
              }
              strokeWidth={1.5}
              strokeDasharray={e.isBackEdge ? "4 3" : undefined}
            />
          ))}
          {layout.nodes.map((n) => {
            const label = byId[n.id]?.label ?? n.id;
            const isDanger =
              dangerCycle &&
              (n.id === "confirm" || n.id === "loop" || n.id === "hold");
            const isAccent = !dangerCycle && (n.id === "id" || n.id === "ui");
            return (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={118}
                  height={36}
                  rx={4}
                  fill={
                    isDanger || isAccent
                      ? theme.fill.secondary
                      : theme.fill.tertiary
                  }
                  stroke={
                    isDanger
                      ? dangerStroke
                      : isAccent
                        ? theme.accent.primary
                        : theme.stroke.secondary
                  }
                />
                <text
                  x={n.x + 59}
                  y={n.y + 22}
                  textAnchor="middle"
                  fill={theme.text.primary}
                  fontSize={11}
                  fontFamily="inherit"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </CardBody>
    </Card>
  );
}

function PrecedenceBar() {
  const theme = useHostTheme();
  const chip = (destructive?: boolean): CSSProperties => ({
    padding: "6px 10px",
    borderRadius: 4,
    border: `1px solid ${
      destructive
        ? theme.diff.removedLine
        : theme.stroke.secondary
    }`,
    background: theme.fill.tertiary,
    fontSize: 12,
    color: theme.text.primary,
    whiteSpace: "nowrap",
  });

  return (
    <Stack gap={8}>
      <H3>Precedence (приоритет применения)</H3>
      <Row gap={6} align="center" wrap>
        <span style={chip()}>Link (привязка маркера)</span>
        <Text tone="secondary" size="small" as="span">
          ≻
        </Text>
        <span style={chip()}>
          DetachMarker (снять id, текст оставить)
        </span>
        <Text tone="secondary" size="small" as="span">
          ≻
        </Text>
        <span style={chip()}>InsertLine (вставить строку)</span>
        <Text tone="secondary" size="small" as="span">
          ≻
        </Text>
        <span style={chip(true)}>
          PullStripVault (убрать строку из vault)
        </span>
        <Text tone="secondary" size="small" as="span">
          ≻
        </Text>
        <span style={chip(true)}>PushDeleteTT (удалить в TickTick)</span>
      </Row>
    </Stack>
  );
}

export default function SyncIntentIdentityCanvas() {
  const theme = useHostTheme();

  return (
    <Stack gap={20} style={{ padding: 20, maxWidth: 1080 }}>
      <Stack gap={6}>
        <Row gap={10} align="center" justify="space-between" wrap>
          <H1>Sync intent × identity</H1>
          <Pill tone="warning" active>
            ARCH-SYNC-INTENT-IDENTITY
          </Pill>
        </Row>
        <Text tone="secondary">
          Agreed model from debate #37 — identity pass before destructive plan.
          Terms show Russian gloss in parentheses.
        </Text>
      </Stack>

      <Callout tone="danger" title="Invariant (инвариант)">
        Mismatch ≠ auto PushDeleteTT (удалить в TickTick). Confirm / Apply only
        for proven user-removed or explicit authorize. Threshold (порог
        mass-delete) counts destructive intents only.
      </Callout>

      <Grid columns={3} gap={12}>
        <Stat value="Link ≻ …" label="Precedence order" tone="info" />
        <Stat
          value="identity first"
          label="Before delete planners"
          tone="success"
        />
        <Stat value="≠ wipe" label="Mismatch auto-delete" tone="danger" />
      </Grid>

      <Stack gap={10}>
        <H2>Broken vs target flow</H2>
        <Grid columns={1} gap={12}>
          <FlowDag
            title="Current broken"
            subtitle="Delete planners early → Rebind loop → false Confirm wipe"
            nodes={BROKEN_NODES}
            edges={BROKEN_EDGES}
            dangerCycle
          />
          <FlowDag
            title="Target"
            subtitle="prepare → identity/Link → re-scan → intents → precedence → UI"
            nodes={TARGET_NODES}
            edges={TARGET_EDGES}
          />
        </Grid>
        <Text size="small" tone="secondary">
          identity pass (проход идентичности до удалений) applies Link /
          DetachMarker / InsertLine with provenance; Sync discrepancies (окно
          расхождений) shows residual destructives only.
        </Text>
      </Stack>

      <Divider />

      <PrecedenceBar />

      <Divider />

      <Stack gap={10}>
        <H2>Intents (намерения мутации)</H2>
        <Table
          headers={["#", "Intent", "Kind", "Role"]}
          columnAlign={["center", "left", "left", "left"]}
          rows={INTENTS.map((i) => [
            i.rank,
            `${i.term} (${i.gloss})`,
            i.kind === "destructive" ? "destructive" : "safe / identity",
            i.note,
          ])}
          rowTone={INTENTS.map((i) =>
            i.kind === "destructive" ? "danger" : "success",
          )}
        />
      </Stack>

      <Grid columns={2} gap={12}>
        <Card>
          <CardHeader>Identity pass (до удалений)</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text size="small">
                Link (привязка маркера) + DetachMarker (снять id, текст
                оставить) + InsertLine (вставить строку) run with provenance.
                Link tombstones block PushDeleteTT (удалить в TickTick) same
                run.
              </Text>
              <Text size="small" tone="secondary">
                Remote-gone → DetachMarker drains hold; must not re-hold after
                Rebind.
              </Text>
            </Stack>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Sync discrepancies (окно расхождений)</CardHeader>
          <CardBody>
            <Stack gap={8}>
              <Text size="small">
                One UI for held + Confirm residual destructives:
                PullStripVault (убрать строку из vault) and PushDeleteTT
                (удалить в TickTick).
              </Text>
              <Text size="small" tone="secondary">
                Check cache uses the same intent enumerator — no second wipe
                dialect. Empty Dexie / checkPoint 0 stays fail-closed.
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <Callout tone="info" title="Pilot gate">
        Mixed hold after Rebind must not Confirm-wipe rebound / displaced ids.
        Prove ×2 on &lt;pilot-vault&gt; before live pass. Plan:
        38-sync-intent-identity-plan.md
      </Callout>

      <Text size="small" tone="tertiary">
        Source: UX-OBS-TT-SOAK/37 · Case ARCH-SYNC-INTENT-IDENTITY · no code in
        debate phase · theme {theme.kind}
      </Text>
    </Stack>
  );
}
