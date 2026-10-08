# opencode-htop

An [OpenCode](https://opencode.ai) plugin that shows live system usage — CPU,
memory, swap, and disk — as compact colored bars in the sidebar.

```text
CPU                     33% 2.0/6
███████████████░░░░░░░░░░░░░░░░░░░░░░░░
MEM                  30% 3.5G/11.7G
██████████████░░░░░░░░░░░░░░░░░░░░░░░░░
SWP                   26% 2.1G/8.0G
████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░
DSK                  74% 143G/193G
█████████████████████████████████░░░░░░
```

Each resource takes two lines: the label on the left and the percentage with
used/total on the right, above a bar that stretches to the full width of the
sidebar. The bar and its figures change color as consumption rises. The numbers
come from the OpenCode **server**, so the bars reflect the machine that is
actually running your sessions — even when the TUI is attached to a remote
server with `opencode --server`.

## How it works

The package has two halves that talk over OpenCode's [RPC](https://opencode.ai/build/plugins/rpc)
mechanism:

- **Server (`index.ts`)** — registers the `opencode-htop.stats` RPC. It reads
  `/proc/stat`, `/proc/meminfo`, `/proc/swaps`, and `statfs("/")` directly, with
  **no subprocesses**.
- **TUI (`tui.tsx`)** — calls that RPC on an interval and renders the bars in the
  `sidebar.content` slot.

Because the readings happen on the server and travel as one small HTTP call, the
plugin adds no meaningful load: it reads virtual files and posts a few numbers.

## Requirements

- OpenCode **V2** (`opencode --version` → `2.x`).
- A Linux server (the metrics come from `/proc` and `statfs`).
- `session.sidebar` must not be `"hidden"` for the bars to be visible.

## Install

Add the plugin to the **OpenCode server's** config. The CLI loads the TUI
component automatically — including when it connects to a remote server — so a
single entry is enough:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:nandobfer/opencode-htop"]
}
```

A local checkout works too:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-htop"]
}
```

> The package is **not published to npm yet**, so use the git specifier or a
> local path. You do not need to add it to `cli.json`; that file is for
> CLI-only plugins that have no server side.

## Options

Pass options through the object form of the plugin entry:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "github:nandobfer/opencode-htop",
      "options": {
        "interval": 3000,
        "position": "bottom"
      }
    }
  ]
}
```

| Option     | Type                     | Default    | Description                                              |
| ---------- | ------------------------ | ---------- | -------------------------------------------------------- |
| `interval` | `number` (ms)            | `3000`     | How often the bars refresh.                              |
| `position` | `"bottom"` \| `"top"`    | `"bottom"` | Where the bars sit inside the sidebar content. `"bottom"` appends them, so they follow the plugin order; `"top"` pins them above the other sections. |

## Colors

The bar and its figures change color with the reading:

| Range      | Color |
| ---------- | ----- |
| `< 60%`    | green |
| `60–85%`   | amber |
| `≥ 85%`    | red   |

## Reading the bars

| Label | Meaning | Used / total            |
| ----- | ------- | ----------------------- |
| `CPU` | busy fraction since the previous refresh | busy cores / logical cores |
| `MEM` | `MemTotal − MemAvailable` | GiB |
| `SWP` | `SwapTotal − SwapFree`    | GiB |
| `DSK` | `statfs("/")`             | GiB |

## Development

```bash
npm install
npm run typecheck
```

## License

MIT
