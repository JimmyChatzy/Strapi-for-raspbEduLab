import type { Core } from '@strapi/strapi';

const SD = 'api::scenario-design.scenario-design';

const GRANTS: Record<string, string[]> = {
  public: [`${SD}.find`, `${SD}.findOne`],
  authenticated: [
    `${SD}.find`, `${SD}.findOne`, `${SD}.create`, `${SD}.update`, `${SD}.delete`,
    `${SD}.mine`, `${SD}.submit`,
    'plugin::upload.content-api.upload',
    'plugin::upload.content-api.find',
    'plugin::upload.content-api.findOne',
  ],
};

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    for (const [type, actions] of Object.entries(GRANTS)) {
      const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type } });
      if (!role) continue;

      for (const action of actions) {
        const exists = await strapi.db
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action, role: role.id } });
        if (!exists) {
          await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
        }
      }
    }
  },
};