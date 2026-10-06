'use strict';

const SCENARIO_FIELDS = [
  // Tab: basic
  { name: 'authorName', label: 'Όνομα (προαιρετικό)', type: 'text', tab: 'basic', required: false, placeholder: 'π.χ. Μαρία Π.' },
  { name: 'title', label: 'Τίτλος *', type: 'text', tab: 'basic', required: true },
  { name: 'description', label: 'Περιγραφή *', type: 'richText', tab: 'basic', required: true, minHeight: '100px', placeholder: 'Περιγράψτε το σενάριο...' },
  { name: 'gradeLevel', label: 'Τάξη *', type: 'select', tab: 'basic', required: true, defaultValue: 'Ε', options: ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'ΣΤ'] },
  { name: 'duration', label: 'Διάρκεια (λεπτά) *', type: 'number', tab: 'basic', required: true, defaultValue: '60', min: 15, step: 15 },
  { name: 'difficulty', label: 'Δυσκολία (1–5) *', type: 'select', tab: 'basic', required: true, defaultValue: '2', options: ['1', '2', '3', '4', '5'] },
  { name: 'subjects', label: 'Μαθήματα (διαχωρισμένα με κόμμα) *', type: 'text', tab: 'basic', required: true, placeholder: 'Πληροφορική, Φυσική' },
  // Tab: teaching
  { name: 'equipment', label: 'Εξοπλισμός *', type: 'textarea', tab: 'teaching', required: true },
  { name: 'curriculumConnection', label: 'Σύνδεση με πρόγραμμα σπουδών *', type: 'richText', tab: 'teaching', required: true, minHeight: '100px', placeholder: 'Πώς συνδέεται με το αναλυτικό πρόγραμμα...' },
  { name: 'idea', label: 'Ιδέα *', type: 'richText', tab: 'teaching', required: true, minHeight: '120px', placeholder: 'Περιγράψτε τη διδακτική ιδέα...' },
  { name: 'content', label: 'Περιεχόμενο / Βήματα *', type: 'richText', tab: 'teaching', required: true, minHeight: '180px', placeholder: 'Αναλύστε τα βήματα υλοποίησης...' },
  // Tab: media
  { name: 'images', label: 'Εικόνες (προαιρετικό)', type: 'file', tab: 'media', required: false, multiple: true, accept: 'image/*' },
  { name: 'tinkercadLink', label: 'Σύνδεσμος Tinkercad (προαιρετικό)', type: 'url', tab: 'media', required: false, placeholder: 'https://www.tinkercad.com/...' },
];

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'public',
    },
  });

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
}

async function seedScenarioConfig() {
  // Allow public read of scenario content type
  await setPublicPermissions({
    scenario: ['find', 'findOne'],
  });

  // Remove any existing scenario entries to avoid duplicates
  const existing = await strapi.documents('api::scenario.scenario').findMany();
  for (const entry of existing) {
    await strapi.documents('api::scenario.scenario').delete({ documentId: entry.documentId });
  }

  // Create the Scenario config entry with the field definitions (published)
  await strapi.documents('api::scenario.scenario').create({
    data: {
      fields: SCENARIO_FIELDS,
    },
    status: 'published',
  });

  console.log(`Seeded Scenario config with ${SCENARIO_FIELDS.length} fields`);
}

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'error';

  await seedScenarioConfig();
  await app.destroy();

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});