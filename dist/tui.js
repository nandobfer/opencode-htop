import { memo as _$memo } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui";
import { Show, createSignal } from "solid-js";
import { Htop } from "../rpc.ts";
const GREEN = "#22c55e";
const AMBER = "#f59e0b";
const RED = "#ef4444";
const TRACK_DARK = "#3f3f46";
const TRACK_LIGHT = "#d4d4d8";
const DEFAULT_INTERVAL_MS = 3000;
const DEFAULT_TITLE = "System";

/** How many hyphens make up a full (100%) bar in the collapsed view. */
const COLLAPSED_BAR_WIDTH = 16;
function numberOption(options, key, fallback) {
  const value = options[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}
function stringOption(options, key) {
  const value = options[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Threshold color for a percentage: green, then amber, then red. */
function thresholdColor(percent) {
  const value = clampPercent(percent);
  if (value >= 85) return RED;
  if (value >= 60) return AMBER;
  return GREEN;
}
function labelColor(mode) {
  return mode === "light" ? "#52525b" : "#a1a1aa";
}
function trackColor(mode) {
  return mode === "light" ? TRACK_LIGHT : TRACK_DARK;
}
function formatBytes(bytes) {
  const units = ["B", "K", "M", "G", "T", "P"];
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1;
  return `${value.toFixed(digits)}${units[unit]}`;
}
function bytesDetail(reading) {
  return `${formatBytes(reading.used)}/${formatBytes(reading.total)}`;
}
function cpuDetail(reading) {
  return `${reading.used.toFixed(1)}/${reading.total.toFixed(0)}`;
}
const RESOURCES = [{
  label: "CPU",
  usage: stats => stats.cpu,
  detail: stats => cpuDetail(stats.cpu)
}, {
  label: "MEM",
  usage: stats => stats.memory,
  detail: stats => bytesDetail(stats.memory)
}, {
  label: "SWP",
  usage: stats => stats.swap,
  detail: stats => bytesDetail(stats.swap)
}, {
  label: "DSK",
  usage: stats => stats.disk,
  detail: stats => bytesDetail(stats.disk)
}];
/**
 * A bar that stretches to the full width of its container: two flex children
 * split the row in the used/remaining proportion, each filled with its color.
 */
function Bar(props) {
  const used = () => clampPercent(props.percent);
  return (() => {
    var _el$ = _$createElement("box"),
      _el$2 = _$createElement("box"),
      _el$3 = _$createElement("box");
    _$insertNode(_el$, _el$2);
    _$insertNode(_el$, _el$3);
    _$setProp(_el$, "flexDirection", "row");
    _$setProp(_el$, "height", 1);
    _$setProp(_el$, "width", "100%");
    _$setProp(_el$2, "height", 1);
    _$setProp(_el$3, "height", 1);
    _$effect(_p$ => {
      var _v$ = used(),
        _v$2 = props.color,
        _v$3 = 100 - used(),
        _v$4 = props.track;
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$2, "flexGrow", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$2, "backgroundColor", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$3, "flexGrow", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp(_el$3, "backgroundColor", _v$4, _p$.o));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined
    });
    return _el$;
  })();
}

/** Expanded: label and percent left, used/total right, above a full-width bar. */
function Resource(props) {
  const percent = () => clampPercent(props.usage.percent);
  const color = () => thresholdColor(props.usage.percent);
  return (() => {
    var _el$4 = _$createElement("box"),
      _el$5 = _$createElement("box"),
      _el$6 = _$createElement("box"),
      _el$7 = _$createElement("text"),
      _el$8 = _$createElement("text"),
      _el$9 = _$createElement("text");
    _$insertNode(_el$4, _el$5);
    _$setProp(_el$4, "flexDirection", "column");
    _$insertNode(_el$5, _el$6);
    _$insertNode(_el$5, _el$9);
    _$setProp(_el$5, "flexDirection", "row");
    _$setProp(_el$5, "width", "100%");
    _$setProp(_el$5, "justifyContent", "space-between");
    _$insertNode(_el$6, _el$7);
    _$insertNode(_el$6, _el$8);
    _$setProp(_el$6, "flexDirection", "row");
    _$setProp(_el$6, "gap", 1);
    _$insert(_el$7, () => props.label);
    _$insert(_el$8, () => `${Math.round(percent())}%`);
    _$insert(_el$9, () => props.detail);
    _$insert(_el$4, _$createComponent(Bar, {
      get percent() {
        return percent();
      },
      get color() {
        return color();
      },
      get track() {
        return trackColor(props.mode);
      }
    }), null);
    _$effect(_p$ => {
      var _v$5 = labelColor(props.mode),
        _v$6 = color(),
        _v$7 = color();
      _v$5 !== _p$.e && (_p$.e = _$setProp(_el$7, "fg", _v$5, _p$.e));
      _v$6 !== _p$.t && (_p$.t = _$setProp(_el$8, "fg", _v$6, _p$.t));
      _v$7 !== _p$.a && (_p$.a = _$setProp(_el$9, "fg", _v$7, _p$.a));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined
    });
    return _el$4;
  })();
}

/** Collapsed: one line, hyphens standing in for the bar, values at the end. */
function Compact(props) {
  const percent = () => clampPercent(props.usage.percent);
  const color = () => thresholdColor(props.usage.percent);
  const dashes = () => "-".repeat(Math.round(percent() / 100 * COLLAPSED_BAR_WIDTH));
  return (() => {
    var _el$0 = _$createElement("box"),
      _el$1 = _$createElement("box"),
      _el$10 = _$createElement("text"),
      _el$11 = _$createElement("text"),
      _el$12 = _$createElement("text");
    _$insertNode(_el$0, _el$1);
    _$insertNode(_el$0, _el$12);
    _$setProp(_el$0, "flexDirection", "row");
    _$setProp(_el$0, "width", "100%");
    _$setProp(_el$0, "justifyContent", "space-between");
    _$insertNode(_el$1, _el$10);
    _$insertNode(_el$1, _el$11);
    _$setProp(_el$1, "flexDirection", "row");
    _$insert(_el$10, () => `${props.label} `);
    _$insert(_el$11, () => `${Math.round(percent())}% ${dashes()}`);
    _$insert(_el$12, () => props.detail);
    _$effect(_p$ => {
      var _v$8 = labelColor(props.mode),
        _v$9 = color(),
        _v$0 = color();
      _v$8 !== _p$.e && (_p$.e = _$setProp(_el$10, "fg", _v$8, _p$.e));
      _v$9 !== _p$.t && (_p$.t = _$setProp(_el$11, "fg", _v$9, _p$.t));
      _v$0 !== _p$.a && (_p$.a = _$setProp(_el$12, "fg", _v$0, _p$.a));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined
    });
    return _el$0;
  })();
}
function StatsList(props) {
  return (() => {
    var _el$13 = _$createElement("box");
    _$setProp(_el$13, "flexDirection", "column");
    _$setProp(_el$13, "width", "100%");
    _$insert(_el$13, () => RESOURCES.map(resource => props.compact ? _$createComponent(Compact, {
      get label() {
        return resource.label;
      },
      get usage() {
        return resource.usage(props.stats);
      },
      get detail() {
        return resource.detail(props.stats);
      },
      get mode() {
        return props.mode;
      }
    }) : _$createComponent(Resource, {
      get label() {
        return resource.label;
      },
      get usage() {
        return resource.usage(props.stats);
      },
      get detail() {
        return resource.detail(props.stats);
      },
      get mode() {
        return props.mode;
      }
    })));
    return _el$13;
  })();
}
/**
 * The sidebar section: a title with a triangle that expands or collapses the
 * contents on click, like the Quota section. Collapsed (the default) shows one
 * compact line per resource; expanded shows the full-width bars.
 */
export function Section(props) {
  const [open, setOpen] = createSignal(props.initialOpen === true);
  return (() => {
    var _el$14 = _$createElement("box"),
      _el$15 = _$createElement("box"),
      _el$16 = _$createElement("text"),
      _el$17 = _$createElement("text"),
      _el$18 = _$createElement("b");
    _$insertNode(_el$14, _el$15);
    _$setProp(_el$14, "flexDirection", "column");
    _$setProp(_el$14, "width", "100%");
    _$insertNode(_el$15, _el$16);
    _$insertNode(_el$15, _el$17);
    _$setProp(_el$15, "flexDirection", "row");
    _$setProp(_el$15, "gap", 1);
    _$setProp(_el$15, "onMouseDown", () => setOpen(value => !value));
    _$insert(_el$16, () => open() ? "▼" : "▶");
    _$insertNode(_el$17, _el$18);
    _$insert(_el$18, () => props.title);
    _$insert(_el$14, _$createComponent(Show, {
      get when() {
        return props.stats();
      },
      get fallback() {
        return (() => {
          var _el$19 = _$createElement("text");
          _$insert(_el$19, () => props.failed() ? "htop unavailable" : "htop …");
          _$effect(_$p => _$setProp(_el$19, "fg", labelColor(props.mode), _$p));
          return _el$19;
        })();
      },
      children: stats => _$createComponent(StatsList, {
        get stats() {
          return stats();
        },
        get mode() {
          return props.mode;
        },
        get compact() {
          return !open();
        }
      })
    }), null);
    _$effect(_p$ => {
      var _v$1 = props.titleColor,
        _v$10 = props.titleColor;
      _v$1 !== _p$.e && (_p$.e = _$setProp(_el$16, "fg", _v$1, _p$.e));
      _v$10 !== _p$.t && (_p$.t = _$setProp(_el$17, "fg", _v$10, _p$.t));
      return _p$;
    }, {
      e: undefined,
      t: undefined
    });
    return _el$14;
  })();
}

/**
 * Client-side TUI plugin. Polls the server's `stats` RPC and renders the bars
 * in the sidebar. It only calls the server on an interval and never spawns
 * local processes.
 */
export default Plugin.define({
  id: "opencode-htop",
  setup(context) {
    const interval = numberOption(context.options, "interval", DEFAULT_INTERVAL_MS);
    const position = stringOption(context.options, "position") === "top" ? "top" : "bottom";
    const title = stringOption(context.options, "title") ?? DEFAULT_TITLE;
    const expanded = context.options.expanded === true;
    const [stats, setStats] = createSignal();
    const [failed, setFailed] = createSignal(false);
    const htop = context.client.rpc(Htop);
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        setStats(await htop.stats({}, context.location ? {
          location: {
            directory: context.location.directory
          }
        } : undefined));
        setFailed(false);
      } catch {
        setFailed(true);
      } finally {
        inFlight = false;
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), interval);
    const render = () => _$createComponent(Section, {
      stats: stats,
      failed: failed,
      get mode() {
        return context.themeMode;
      },
      title: title,
      get titleColor() {
        return context.theme.text.base;
      },
      initialOpen: expanded
    });
    const unregister = position === "bottom" ? context.ui.slot({
      append: "sidebar.content",
      render
    }) : context.ui.slot({
      prepend: "sidebar.content",
      render
    });
    return () => {
      clearInterval(timer);
      unregister();
    };
  }
});
