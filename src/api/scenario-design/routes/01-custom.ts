export default {
  routes: [
    { method: "GET", path: "/scenario-designs/mine", handler: "scenario-design.mine" },
    {
      method: "POST",
      path: "/scenario-designs/:documentId/submit",
      handler: "scenario-design.submit",
      config: { policies: ["api::scenario-design.is-owner"] },
    },
  ],
};