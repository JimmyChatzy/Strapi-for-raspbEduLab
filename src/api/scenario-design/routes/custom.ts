export default {
  routes: [
    {
      method: 'GET',
      path: '/scenario-design/schema/:documentId',
      handler: 'scenario-design.schema',
      config: { auth: false },
    },
    { method: 'GET', path: '/scenario-designs/mine', handler: 'scenario-design.mine' },
    { method: 'POST', path: '/scenario-designs/:id/submit', handler: 'scenario-design.submit' },
  ],
};
