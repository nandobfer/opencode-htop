import { readFile, statfs } from "node:fs/promises"
import { cpus } from "node:os"
import { Plugin } from "@opencode/plugin"
import { Htop, type Usage } from "./rpc"

/** Filesystem measured by the disk bar. */
const DISK_PATH = "/"

/** Window used only for the very first CPU reading, before a delta exists. */
const CPU_SAMPLE_WINDOW_MS = 150

/** Re-seed the CPU delta when the previous sample is older than this. */
const CPU_STALE_MS = 10_000

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function usage(used: number, total: number): Usage {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0
  const safeUsed = Number.isFinite(used) && used > 0 ? used : 0
  return {
    percent: safeTotal > 0 ? clampPercent((safeUsed / safeTotal) * 100) : 0,
    used: safeUsed,
    total: safeTotal,
  }
}

interface CpuSample {
  readonly idle: number
  readonly total: number
  readonly at: number
}

/** Reads the aggregate CPU line of `/proc/stat`. */
async function sampleCpu(): Promise<CpuSample> {
  const text = await readFile("/proc/stat", "utf8")
  const line = text.slice(0, text.indexOf("\n"))
  const fields = line
    .trim()
    .split(/\s+/)
    .slice(1)
    .map(Number)
  const idle = (fields[3] ?? 0) + (fields[4] ?? 0)
  let total = 0
  for (const field of fields) if (Number.isFinite(field)) total += field
  return { idle, total, at: Date.now() }
}

let previousCpu: CpuSample | undefined

/**
 * Busy fraction since the previous reading. The first reading (or one after a
 * long gap) takes two samples a few milliseconds apart.
 */
async function cpuUsage(): Promise<Usage> {
  const cores = cpus().length || 1
  let before = previousCpu
  let after: CpuSample

  if (!before || Date.now() - before.at > CPU_STALE_MS) {
    before = await sampleCpu()
    await new Promise((resolve) => setTimeout(resolve, CPU_SAMPLE_WINDOW_MS))
    after = await sampleCpu()
  } else {
    after = await sampleCpu()
  }
  previousCpu = after

  const totalDelta = after.total - before.total
  const idleDelta = after.idle - before.idle
  const percent = totalDelta > 0 ? clampPercent(((totalDelta - idleDelta) / totalDelta) * 100) : 0
  return { percent, used: (percent / 100) * cores, total: cores }
}

async function memoryUsage(): Promise<{ memory: Usage; swap: Usage }> {
  const text = await readFile("/proc/meminfo", "utf8")
  const info: Record<string, number> = {}
  for (const line of text.split("\n")) {
    const match = /^([A-Za-z_()]+):\s+(\d+)\s+kB/.exec(line)
    if (match) info[match[1]!] = Number(match[2]) * 1024
  }

  const total = info.MemTotal ?? 0
  const available =
    info.MemAvailable ?? (info.MemFree ?? 0) + (info.Buffers ?? 0) + (info.Cached ?? 0)
  const swapTotal = info.SwapTotal ?? 0
  const swapFree = info.SwapFree ?? 0

  return {
    memory: usage(total - available, total),
    swap: usage(swapTotal - swapFree, swapTotal),
  }
}

async function diskUsage(path: string): Promise<Usage> {
  const stats = await statfs(path)
  const blockSize = Number(stats.bsize)
  const total = Number(stats.blocks) * blockSize
  const free = Number(stats.bavail) * blockSize
  return usage(total - free, total)
}

/**
 * Server-side plugin. Reads host metrics from `/proc` and `statfs` (no
 * subprocesses) and exposes them over RPC, so a TUI attached to this server —
 * local or remote — can render them.
 */
export default Plugin.define({
  id: "opencode-htop",
  async setup(ctx) {
    await ctx.rpc.register(Htop, {
      stats: async () => {
        const [cpu, mem, disk] = await Promise.all([
          cpuUsage(),
          memoryUsage(),
          diskUsage(DISK_PATH),
        ])
        return { cpu, memory: mem.memory, swap: mem.swap, disk }
      },
    })
  },
})
