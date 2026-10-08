/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui"
import type { ColorInput } from "@opentui/core"
import { Show, createSignal } from "solid-js"
import { Htop, type Stats, type Usage } from "../rpc"

const GREEN = "#22c55e"
const AMBER = "#f59e0b"
const RED = "#ef4444"

const TRACK_DARK = "#3f3f46"
const TRACK_LIGHT = "#d4d4d8"

const DEFAULT_INTERVAL_MS = 3000
const DEFAULT_TITLE = "System"

/** How many hyphens make up a full (100%) bar in the collapsed view. */
const COLLAPSED_BAR_WIDTH = 16

function numberOption(options: Readonly<Record<string, any>>, key: string, fallback: number): number {
  const value = options[key]
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback
}

function stringOption(options: Readonly<Record<string, any>>, key: string): string | undefined {
  const value = options[key]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** Threshold color for a percentage: green, then amber, then red. */
function thresholdColor(percent: number): string {
  const value = clampPercent(percent)
  if (value >= 85) return RED
  if (value >= 60) return AMBER
  return GREEN
}

function labelColor(mode: "dark" | "light"): string {
  return mode === "light" ? "#52525b" : "#a1a1aa"
}

function trackColor(mode: "dark" | "light"): string {
  return mode === "light" ? TRACK_LIGHT : TRACK_DARK
}

function formatBytes(bytes: number): string {
  const units = ["B", "K", "M", "G", "T", "P"]
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1
  return `${value.toFixed(digits)}${units[unit]}`
}

function bytesDetail(reading: Usage): string {
  return `${formatBytes(reading.used)}/${formatBytes(reading.total)}`
}

function cpuDetail(reading: Usage): string {
  return `${reading.used.toFixed(1)}/${reading.total.toFixed(0)}`
}

interface ResourceDef {
  readonly label: string
  readonly usage: (stats: Stats) => Usage
  readonly detail: (stats: Stats) => string
}

const RESOURCES: readonly ResourceDef[] = [
  { label: "CPU", usage: (stats) => stats.cpu, detail: (stats) => cpuDetail(stats.cpu) },
  { label: "MEM", usage: (stats) => stats.memory, detail: (stats) => bytesDetail(stats.memory) },
  { label: "SWP", usage: (stats) => stats.swap, detail: (stats) => bytesDetail(stats.swap) },
  { label: "DSK", usage: (stats) => stats.disk, detail: (stats) => bytesDetail(stats.disk) },
]

interface ResourceProps {
  readonly label: string
  readonly usage: Usage
  readonly detail: string
  readonly mode: "dark" | "light"
}

/**
 * A bar that stretches to the full width of its container: two flex children
 * split the row in the used/remaining proportion, each filled with its color.
 */
function Bar(props: { percent: number; color: string; track: string }) {
  const used = () => clampPercent(props.percent)
  return (
    <box flexDirection="row" height={1} width="100%">
      <box flexGrow={used()} height={1} backgroundColor={props.color} />
      <box flexGrow={100 - used()} height={1} backgroundColor={props.track} />
    </box>
  )
}

/** Expanded: label and percent left, used/total right, above a full-width bar. */
function Resource(props: ResourceProps) {
  const percent = () => clampPercent(props.usage.percent)
  const color = () => thresholdColor(props.usage.percent)
  return (
    <box flexDirection="column">
      <box flexDirection="row" width="100%" justifyContent="space-between">
        <box flexDirection="row" gap={1}>
          <text fg={labelColor(props.mode)}>{props.label}</text>
          <text fg={color()}>{`${Math.round(percent())}%`}</text>
        </box>
        <text fg={color()}>{props.detail}</text>
      </box>
      <Bar percent={percent()} color={color()} track={trackColor(props.mode)} />
    </box>
  )
}

/** Collapsed: one line, hyphens standing in for the bar, values at the end. */
function Compact(props: ResourceProps) {
  const percent = () => clampPercent(props.usage.percent)
  const color = () => thresholdColor(props.usage.percent)
  const dashes = () => "-".repeat(Math.round((percent() / 100) * COLLAPSED_BAR_WIDTH))
  return (
    <box flexDirection="row" width="100%" justifyContent="space-between">
      <box flexDirection="row">
        <text fg={labelColor(props.mode)}>{`${props.label} `}</text>
        <text fg={color()}>{`${Math.round(percent())}% ${dashes()}`}</text>
      </box>
      <text fg={color()}>{props.detail}</text>
    </box>
  )
}

function StatsList(props: { stats: Stats; mode: "dark" | "light"; compact: boolean }) {
  return (
    <box flexDirection="column" width="100%">
      {RESOURCES.map((resource) =>
        props.compact ? (
          <Compact
            label={resource.label}
            usage={resource.usage(props.stats)}
            detail={resource.detail(props.stats)}
            mode={props.mode}
          />
        ) : (
          <Resource
            label={resource.label}
            usage={resource.usage(props.stats)}
            detail={resource.detail(props.stats)}
            mode={props.mode}
          />
        ),
      )}
    </box>
  )
}

interface SectionProps {
  readonly stats: () => Stats | undefined
  readonly failed: () => boolean
  readonly mode: "dark" | "light"
  readonly title: string
  readonly titleColor: ColorInput
  /** Whether the section starts expanded. Defaults to collapsed. */
  readonly initialOpen?: boolean
}

/**
 * The sidebar section: a title with a triangle that expands or collapses the
 * contents on click, like the Quota section. Collapsed (the default) shows one
 * compact line per resource; expanded shows the full-width bars.
 */
export function Section(props: SectionProps) {
  const [open, setOpen] = createSignal(props.initialOpen === true)
  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" gap={1} onMouseDown={() => setOpen((value) => !value)}>
        <text fg={props.titleColor}>{open() ? "▼" : "▶"}</text>
        <text fg={props.titleColor}>
          <b>{props.title}</b>
        </text>
      </box>
      <Show
        when={props.stats()}
        fallback={
          <text fg={labelColor(props.mode)}>{props.failed() ? "htop unavailable" : "htop …"}</text>
        }
      >
        {(stats: () => Stats) => (
          <StatsList stats={stats()} mode={props.mode} compact={!open()} />
        )}
      </Show>
    </box>
  )
}

/**
 * Client-side TUI plugin. Polls the server's `stats` RPC and renders the bars
 * in the sidebar. It only calls the server on an interval and never spawns
 * local processes.
 */
export default Plugin.define({
  id: "opencode-htop",
  setup(context) {
    const interval = numberOption(context.options, "interval", DEFAULT_INTERVAL_MS)
    const position = stringOption(context.options, "position") === "top" ? "top" : "bottom"
    const title = stringOption(context.options, "title") ?? DEFAULT_TITLE
    const expanded = context.options.expanded === true
    const [stats, setStats] = createSignal<Stats>()
    const [failed, setFailed] = createSignal(false)
    const htop = context.client.rpc(Htop)

    let inFlight = false
    const refresh = async () => {
      if (inFlight) return
      inFlight = true
      try {
        setStats(
          (await htop.stats(
            {},
            context.location ? { location: { directory: context.location.directory } } : undefined,
          )) as Stats,
        )
        setFailed(false)
      } catch {
        setFailed(true)
      } finally {
        inFlight = false
      }
    }

    void refresh()
    const timer = setInterval(() => void refresh(), interval)

    const render = () => (
      <Section
        stats={stats}
        failed={failed}
        mode={context.themeMode}
        title={title}
        titleColor={context.theme.text.base}
        initialOpen={expanded}
      />
    )
    const unregister =
      position === "bottom"
        ? context.ui.slot({ append: "sidebar.content", render })
        : context.ui.slot({ prepend: "sidebar.content", render })

    return () => {
      clearInterval(timer)
      unregister()
    }
  },
})
