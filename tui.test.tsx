/** @jsxImportSource @opentui/solid */
import { expect, test } from "bun:test"
import { testRender } from "@opentui/solid"
import { createSignal } from "solid-js"
import { Section } from "./src/tui"
import type { Stats } from "./rpc"

// Import the same precompiled entrypoint used by Git/npm installations.
// @ts-ignore Generated JavaScript has no separate declaration file.
import { Section as InstalledSection } from "./dist/tui.js"

for (const [name, View] of [["source", Section], ["installed", InstalledSection]] as const) {
test(`${name}: starts collapsed and title click switches layouts`, async () => {
  const usage = { percent: 50, used: 3, total: 6 }
  const [stats, setStats] = createSignal<Stats>({ cpu: usage, memory: usage, swap: usage, disk: usage } as Stats)
  const setup = await testRender(() => (
    <View stats={stats} failed={() => false} mode="dark" title="System" titleColor="#ffffff" />
  ), { width: 40, height: 14 })
  try {
    await setup.renderOnce()
    expect(setup.captureCharFrame()).toContain("▶ System")
    expect(setup.captureCharFrame()).toContain("CPU 50% --------")
    await setup.mockMouse.click(3, 0)
    await setup.renderOnce()
    expect(setup.captureCharFrame()).toContain("▼ System")
    expect(setup.captureCharFrame()).not.toContain("--------")
    setStats({ ...stats(), cpu: { percent: 25, used: 1.5, total: 6 } })
    await setup.renderOnce()
    expect(setup.captureCharFrame()).toContain("▼ System")
    expect(setup.captureCharFrame()).toContain("CPU 25%")
    await setup.mockMouse.click(0, 0)
    await setup.renderOnce()
    expect(setup.captureCharFrame()).toContain("▶ System")
    expect(setup.captureCharFrame()).toContain("CPU 25% ----")
  } finally {
    setup.renderer.destroy()
  }
})

test(`${name}: starts expanded when initialOpen is true`, async () => {
  const usage = { percent: 50, used: 3, total: 6 }
  const [stats] = createSignal<Stats>({ cpu: usage, memory: usage, swap: usage, disk: usage } as Stats)
  const setup = await testRender(() => (
    <View stats={stats} failed={() => false} mode="dark" title="System" titleColor="#ffffff" initialOpen={true} />
  ), { width: 40, height: 14 })
  try {
    await setup.renderOnce()
    expect(setup.captureCharFrame()).toContain("▼ System")
    expect(setup.captureCharFrame()).not.toContain("--------")
  } finally {
    setup.renderer.destroy()
  }
})
}
