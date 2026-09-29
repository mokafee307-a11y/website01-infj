/** Prepare the first module while the opaque launch screen still covers it. */
export function prepareFirstModule(view: Pick<Window, "history" | "location" | "scrollTo">) {
  view.history.replaceState(view.history.state, "", `${view.location.pathname}${view.location.search}#map`);
  view.scrollTo({ top: 0, left: 0, behavior: "instant" });
}
