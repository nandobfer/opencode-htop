import { Rpc } from "@opencode/plugin/rpc"

/**
 * One resource reading: a percentage plus the raw used/total figures.
 *
 * `used` and `total` are bytes for memory, swap, and disk, and logical cores
 * for CPU.
 */
export interface Usage {
  readonly percent: number
  readonly used: number
  readonly total: number
}

export interface Stats {
  readonly cpu: Usage
  readonly memory: Usage
  readonly swap: Usage
  readonly disk: Usage
}

const usageSchema = {
  type: "object",
  properties: {
    percent: { type: "number" },
    used: { type: "number" },
    total: { type: "number" },
  },
  required: ["percent", "used", "total"],
  additionalProperties: false,
} as const

/**
 * Shared RPC contract between the server plugin (`index.ts`) and the TUI plugin
 * (`tui.tsx`). The server registers it; the client calls it over the OpenCode
 * connection, so it works against a remote server.
 */
export const Htop = Rpc.define({
  id: "opencode-htop",
  methods: {
    stats: {
      input: { type: "object", additionalProperties: false },
      output: {
        type: "object",
        properties: {
          cpu: usageSchema,
          memory: usageSchema,
          swap: usageSchema,
          disk: usageSchema,
        },
        required: ["cpu", "memory", "swap", "disk"],
        additionalProperties: false,
      },
    },
  },
  events: {},
})
