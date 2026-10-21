/*export default async (ctx: any, _config: unknown, { strapi }: { strapi: any }) => {
  const user = ctx.state.user;
  if (!user) return false;

  const documentId = ctx.params.documentId ?? ctx.params.id;
  const doc = await strapi
    .documents("api::scenario-design.scenario-design")
    .findOne({ documentId, populate: { author: true } });

  return doc?.author?.id === user.id;
};
*/