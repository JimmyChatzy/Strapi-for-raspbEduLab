import { factories } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const UID = "api::scenario-design.scenario-design";

async function loadOwned(strapi: Core.Strapi, ctx: any) {
  const user = ctx.state.user;
  if (!user) throw new errors.UnauthorizedError('You must be logged in');

  const doc = await strapi.documents(UID).findOne({
    documentId: ctx.params.documentId,
    populate: { author: true },
  });
  if (!doc) throw new errors.NotFoundError('Scenario not found');
  if (doc.author?.documentId !== user.documentId) {
    throw new errors.ForbiddenError('You can only modify your own scenarios');
  }
  return doc;
}

interface ContentManagerFieldMetadata {
  edit?: {
    label?: string;
    description?: string;
    placeholder?: string;
    visible?: boolean;
    editable?: boolean;
    mainField?: string;
  };
  list?: {
    label?: string;
    searchable?: boolean;
    sortable?: boolean;
  };
}

interface ContentManagerLayoutField {
  name: string;
  size?: number;
}

interface ContentManagerConfiguration {
  metadatas?: Record<
    string,
    ContentManagerFieldMetadata
  >;

  layouts?: {
    edit?: ContentManagerLayoutField[][];
    list?: ContentManagerLayoutField[];
  };

  settings?: Record<string, unknown>;
}




export default factories.createCoreController(UID, ({ strapi }) => ({
  // ...keep your existing schema handler here

      async schema(ctx) {
      const documentId = ctx.params.documentId;

      if (!documentId) {
        return ctx.badRequest(
          'Scenario Design documentId is required'
        );
      }

      /*
       * Get the Scenario Design content type.
       *
       * This is our actual source of truth for:
       * - fields
       * - field types
       * - required
       * - enum options
       */
      const model = strapi.contentType(UID);

      if (!model) {
        return ctx.notFound(
          'Scenario Design content type not found'
        );
      }
    
      /*
       * ----------------------------------------------------
       * Content Manager configuration
       * ----------------------------------------------------
       *
       * Strapi stores the Content Manager configuration
       * in the core-store under:
       *
       * plugin_content_manager_configuration_content_types::<UID>
       *
       * This contains presentation metadata such as:
       * - label
       * - description
       * - placeholder
       * - editable
       * - visible
       * - layout / size
       */
      const configurationEntry = await strapi.db
        .query('strapi::core-store')
        .findOne({
          where: {
            key: `plugin_content_manager_configuration_content_types::${UID}`,
          },
        });

      let configuration: ContentManagerConfiguration =
        {};

      if (configurationEntry?.value) {
        try {
          configuration =
            typeof configurationEntry.value === 'string'
              ? JSON.parse(configurationEntry.value)
              : configurationEntry.value;
        } catch {
          return ctx.internalServerError(
            'Failed to parse Content Manager configuration'
          );
        }
      }

      /*
       * ----------------------------------------------------
       * Edit layout
       * ----------------------------------------------------
       *
       * Strapi stores the edit layout as rows.
       *
       * Example:
       *
       * edit: [
       *   [
       *     { name: 'title', size: 12 },
       *     { name: 'difficulty', size: 6 }
       *   ]
       * ]
       *
       * Flatten it so we can easily find a field by name.
       */
      const editLayout =
        configuration.layouts?.edit?.flat() ?? [];

      /*
       * ----------------------------------------------------
       * System fields
       * ----------------------------------------------------
       *
       * These are Strapi internal fields and should not
       * become part of our scenario schema.
       */
      const systemFields = new Set([
        'createdAt',
        'updatedAt',
        'publishedAt',
        'createdBy',
        'updatedBy',
        'locale',
        'localizations',
        'author',
        'reviewStatus'
      ]);

      /*
       * ----------------------------------------------------
       * Build schema fields
       * ----------------------------------------------------
       *
       * IMPORTANT:
       *
       * The content type remains the source of truth.
       *
       * Content Manager configuration only provides
       * presentation information through `view`.
       */
      const fields = Object.entries(model.attributes)
        .filter(([name, attribute]) => {
          if (systemFields.has(name)) {
            return false;
          }

          if (attribute.private === true) {
            return false;
          }

          if (attribute.visible === false) {
            return false;
          }

          return true;
        })
        .map(([name, attribute]) => {
          /*
           * Content Manager field metadata
           */
          const editMetadata =
            configuration.metadatas?.[name]?.edit;

          /*
           * Content Manager field layout
           *
           * This is where `size` comes from.
           */
          const layoutField = editLayout.find(
            (item) => item.name === name
          );

          /*
           * Our public schema representation.
           */
          const field: {
            name: string;
            type: string;
            required?: boolean;
            options?: string[];
            multiple?: boolean;
            allowedTypes?: string[];
            view: {
              label: string;
              description?: string;
              placeholder?: string;
              editable?: boolean;
              visible?: boolean;
              size?: number;
            };
          } = {
            name,
            type: attribute.type,

            view: {
              /*
               * Content Manager label
               */
              label:
                editMetadata?.label ?? name,

              /*
               * Content Manager description
               */
              description:
                editMetadata?.description,

              /*
               * Content Manager placeholder
               */
              placeholder:
                editMetadata?.placeholder,

              /*
               * Whether the field is editable
               */
              editable:
                editMetadata?.editable,

              /*
               * Whether the field is visible
               */
              visible:
                editMetadata?.visible,

              /*
               * Content Manager layout size
               *
               * This is now exposed through our API.
               */
              size:
                layoutField?.size,
            },
          };

          /*
           * Required
           */
          if (
            'required' in attribute &&
            attribute.required !== undefined
          ) {
            field.required = attribute.required;
          }

          /*
           * Enumeration options
           */
          if (
            'enum' in attribute &&
            Array.isArray(attribute.enum)
          ) {
            field.options = attribute.enum;
          }
          if (attribute.type === 'media') {
            field.multiple = attribute.multiple ?? false;
  // Strapi types it as `'images' | 'files' | ('images'|'files')[]`, so normalize to an array
            field.allowedTypes = attribute.allowedTypes ? [attribute.allowedTypes].flat() : undefined;
}
          return field;
        });

      /*
       * ----------------------------------------------------
       * Tabs
       * ----------------------------------------------------
       *
       * Current Tab configuration is connected to the
       * Scenario Design through `scenario_design`.
       *
       * The fields inside the tab are only field names.
       *
       * Example:
       *
       * {
       *   label: "Γενικές πληροφορίες",
       *   fields: ["title", "difficulty"]
       * }
       *
       * The actual field definition still comes from
       * Scenario Design above.
       */
      const tabConfig = await strapi
        .documents('api::tab.tab')
        .findFirst({
          filters: {
            scenario_design: {
              documentId: {
                $eq: documentId,
              },
            },
          },
          populate: {
            tab: true,
          },
        });

      const tabs =
        tabConfig?.tab
          ?.map((tab) => ({
            label: tab.label,
            order: tab.order,
            fields: Array.isArray(tab.fields)
              ? tab.fields
              : [],
          }))
          .sort(
            (a, b) =>
              (a.order ?? 0) -
              (b.order ?? 0)
          ) ?? [];

      /*
       * ----------------------------------------------------
       * Public schema API response
       * ----------------------------------------------------
       */
      ctx.body = {
        data: {
          documentId,
          fields,
          tabs,
        },
      };
    },

  // Public list: only published scenarios, enforced server-side.
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      filters: { ...(ctx.query.filters as object), reviewStatus: { $eq: 'published' } },
    };
    return super.find(ctx);
  },

  // Published: anyone. Drafts: owner only. `meta.isOwner` is used by the edit page.
  async findOne(ctx) {
    const user = ctx.state.user;
    const doc = await strapi.documents(UID).findOne({
      documentId: ctx.params.documentId,
      populate: { author: true },
    });
    if (!doc) throw new errors.NotFoundError('Scenario not found');

    const isOwner = !!user && doc.author?.documentId === user.documentId;
    if (doc.reviewStatus !== 'published' && !isOwner) {
      throw new errors.NotFoundError('Scenario not found');
    }

    const response: any = await super.findOne(ctx);
    return { ...response, meta: { ...response.meta, isOwner } };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) throw new errors.UnauthorizedError('You must be logged in');

    const document = await strapi.documents(UID).create({
      data: {
        ...ctx.request.body.data,
        author: user.documentId, // never trust the client
        reviewStatus: 'draft',
      },
    });
    ctx.body = { data: document };
  },

  async update(ctx) {
    const doc = await loadOwned(strapi, ctx);

    const data = { ...ctx.request.body.data, reviewStatus: 'draft' }; // an edit needs review again
    delete data.author;

    const document = await strapi.documents(UID).update({ documentId: doc.documentId, data });
    ctx.body = { data: document };
  },

  async delete(ctx) {
    const doc = await loadOwned(strapi, ctx);
    await strapi.documents(UID).delete({ documentId: doc.documentId });
    ctx.status = 204;
  },

  async mine(ctx) {
    const user = ctx.state.user;
    if (!user) throw new errors.UnauthorizedError('You must be logged in');

    const docs = await strapi.documents(UID).findMany({
      filters: { author: { documentId: { $eq: user.documentId } } },
      sort: 'createdAt:desc',
    });
    ctx.body = { data: docs, meta: {} };
  },

  async submit(ctx) {
    const doc = await loadOwned(strapi, ctx);

    if (doc.reviewStatus === 'pending_review' || doc.reviewStatus === 'published') {
      throw new errors.ApplicationError('Το σενάριο έχει ήδη υποβληθεί.');
    }

    await strapi.documents(UID).update({
      documentId: doc.documentId,
      data: { reviewStatus: 'pending_review' },
    });

    const to = process.env.REVIEW_NOTIFY_EMAIL;
    if (to) {
      try {
        await strapi.plugin('email').service('email').send({
          to,
          subject: 'Νέο σενάριο προς έλεγχο',
          text:
            `Ένα σενάριο περιμένει έγκριση.\n\n` +
            `${process.env.STRAPI_ADMIN_URL ?? 'http://localhost:1337'}/admin/content-manager/collection-types/${UID}/${doc.documentId}`,
        });
      } catch (err) {
        strapi.log.error('Review email failed', err); // the submission still succeeds
      }
    }

    ctx.body = { data: { documentId: doc.documentId, reviewStatus: 'pending_review' } };
  },
}));

/*

export default factories.createCoreController(
  'api::scenario-design.scenario-design',
  ({ strapi }) => ({
    async schema(ctx) {
      const documentId = ctx.params.documentId;

      if (!documentId) {
        return ctx.badRequest(
          'Scenario Design documentId is required'
        );
      }

      const uid =
        'api::scenario-design.scenario-design';

      
       * Get the Scenario Design content type.
       *
       * This is our actual source of truth for:
       * - fields
       * - field types
       * - required
       * - enum options
       
      const model = strapi.contentType(uid);

      if (!model) {
        return ctx.notFound(
          'Scenario Design content type not found'
        );
      }

      
       * ----------------------------------------------------
       * Content Manager configuration
       * ----------------------------------------------------
       *
       * Strapi stores the Content Manager configuration
       * in the core-store under:
       *
       * plugin_content_manager_configuration_content_types::<UID>
       *
       * This contains presentation metadata such as:
       * - label
       * - description
       * - placeholder
       * - editable
       * - visible
       * - layout / size
       
      const configurationEntry = await strapi.db
        .query('strapi::core-store')
        .findOne({
          where: {
            key: `plugin_content_manager_configuration_content_types::${uid}`,
          },
        });

      let configuration: ContentManagerConfiguration =
        {};

      if (configurationEntry?.value) {
        try {
          configuration =
            typeof configurationEntry.value === 'string'
              ? JSON.parse(configurationEntry.value)
              : configurationEntry.value;
        } catch {
          return ctx.internalServerError(
            'Failed to parse Content Manager configuration'
          );
        }
      }

      
       * ----------------------------------------------------
       * Edit layout
       * ----------------------------------------------------
       *
       * Strapi stores the edit layout as rows.
       *
       * Example:
       *
       * edit: [
       *   [
       *     { name: 'title', size: 12 },
       *     { name: 'difficulty', size: 6 }
       *   ]
       * ]
       *
       * Flatten it so we can easily find a field by name.
       
      const editLayout =
        configuration.layouts?.edit?.flat() ?? [];

      
       * ----------------------------------------------------
       * System fields
       * ----------------------------------------------------
       *
       * These are Strapi internal fields and should not
       * become part of our scenario schema.
       
      const systemFields = new Set([
        'createdAt',
        'updatedAt',
        'publishedAt',
        'createdBy',
        'updatedBy',
        'locale',
        'localizations',
      ]);

      
       * ----------------------------------------------------
       * Build schema fields
       * ----------------------------------------------------
       *
       * IMPORTANT:
       *
       * The content type remains the source of truth.
       *
       * Content Manager configuration only provides
       * presentation information through `view`.
       
      const fields = Object.entries(model.attributes)
        .filter(([name, attribute]) => {
          if (systemFields.has(name)) {
            return false;
          }

          if (attribute.private === true) {
            return false;
          }

          if (attribute.visible === false) {
            return false;
          }

          return true;
        })
        .map(([name, attribute]) => {
          
           * Content Manager field metadata
           
          const editMetadata =
            configuration.metadatas?.[name]?.edit;

          
           * Content Manager field layout
           *
           * This is where `size` comes from.
           
          const layoutField = editLayout.find(
            (item) => item.name === name
          );

          
           // Our public schema representation.
           
          const field: {
            name: string;
            type: string;
            required?: boolean;
            options?: string[];
            view: {
              label: string;
              description?: string;
              placeholder?: string;
              editable?: boolean;
              visible?: boolean;
              size?: number;
            };
          } = {
            name,
            type: attribute.type,

            view: {
              
               //Content Manager label
               
              label:
                editMetadata?.label ?? name,

              
               // Content Manager description
               
              description:
                editMetadata?.description,

              
               // Content Manager placeholder
               
              placeholder:
                editMetadata?.placeholder,

              
               // Whether the field is editable
               
              editable:
                editMetadata?.editable,

              
              //  Whether the field is visible
               
              visible:
                editMetadata?.visible,

              
               * Content Manager layout size
               *
               * This is now exposed through our API.
               
              size:
                layoutField?.size,
            },
          };

          
           // Required
           
          if (
            'required' in attribute &&
            attribute.required !== undefined
          ) {
            field.required = attribute.required;
          }

          
           // Enumeration options
           
          if (
            'enum' in attribute &&
            Array.isArray(attribute.enum)
          ) {
            field.options = attribute.enum;
          }

          return field;
        });

      
       * ----------------------------------------------------
       * Tabs
       * ----------------------------------------------------
       *
       * Current Tab configuration is connected to the
       * Scenario Design through `scenario_design`.
       *
       * The fields inside the tab are only field names.
       *
       * Example:
       *
       * {
       *   label: "Γενικές πληροφορίες",
       *   fields: ["title", "difficulty"]
       * }
       *
       * The actual field definition still comes from
       * Scenario Design above.
       
      const tabConfig = await strapi
        .documents('api::tab.tab')
        .findFirst({
          filters: {
            scenario_design: {
              documentId: {
                $eq: documentId,
              },
            },
          },
          populate: {
            tab: true,
          },
        });

      const tabs =
        tabConfig?.tab
          ?.map((tab) => ({
            label: tab.label,
            order: tab.order,
            fields: Array.isArray(tab.fields)
              ? tab.fields
              : [],
          }))
          .sort(
            (a, b) =>
              (a.order ?? 0) -
              (b.order ?? 0)
          ) ?? [];

      
       * ----------------------------------------------------
       * Public schema API response
       * ----------------------------------------------------
       
      ctx.body = {
        data: {
          documentId,
          fields,
          tabs,
        },
      };
    },
    async create(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const data = {
        ...ctx.request.body.data,
        author: user.documentId,
      };

      const document = await strapi
        .documents('api::scenario-design.scenario-design')
        .create({
          data,
          status: 'published'
        });

      ctx.body = {
        data: document,
      };
    },

    async update(ctx) {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const documentId = ctx.params.documentId;

      if (!documentId) {
        return ctx.badRequest(
          'Scenario Design documentId is required'
        );
      }

      const existing = await strapi
        .documents('api::scenario-design.scenario-design')
        .findOne({
          documentId,
          populate: {
            author: true,
          },
        });

      if (!existing) {
        return ctx.notFound(
          'Scenario Design not found'
        );
      }

      if (existing.author?.id !== user.id) {
        return ctx.forbidden(
          'You can only update your own scenarios'
        );
      }

      const data = {
        ...ctx.request.body.data,
      };

      // Ο author δεν αλλάζει από το update request.
      delete data.author;

      const document = await strapi
        .documents('api::scenario-design.scenario-design')
        .update({
          documentId,
          data,
        });

      ctx.body = {
        data: document,
      };
    },
  })
);
*/