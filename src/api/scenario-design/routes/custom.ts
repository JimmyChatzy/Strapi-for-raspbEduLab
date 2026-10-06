export default {
  routes: [
    {
      method: 'GET',
      path: '/scenario-design/schema/:documentId',
      handler: 'scenario-design.schema',
      config: {
        auth: false,
      },
    },
  ],
};