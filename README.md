# opencode-htop

An [OpenCode](https://opencode.ai) plugin that shows live system usage — CPU,
memory, swap, and disk — as compact colored bars in the sidebar.

Each bar shows the percentage and the used/total figures, and changes color as
consumption rises. The numbers come from the OpenCode **server**, so the bars
reflect the machine that is actually running your sessions, even when the TUI
is attached to a remote server with `opencode --server`.

> Work in progress.
