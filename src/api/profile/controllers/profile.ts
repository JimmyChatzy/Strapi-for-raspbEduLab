import { errors } from '@strapi/utils';

const MAX_FULL_NAME = 100;

export default {
  async update(ctx: any) {
    const user = ctx.state.user;
    if (!user) throw new errors.UnauthorizedError('You must be logged in');

    const fullName = ctx.request.body?.data?.fullName;
    if (typeof fullName !== 'string') throw new errors.ValidationError('fullName is required');

    const trimmed = fullName.trim();
    if (trimmed.length > MAX_FULL_NAME) {
      throw new errors.ValidationError(`Το ονοματεπώνυμο έχει έως ${MAX_FULL_NAME} χαρακτήρες.`);
    }

    const updated = await strapi.db.query('plugin::users-permissions.user').update({
      where: { id: user.id },
      data: { fullName: trimmed || null },
    });
    ctx.body = { data: { username: updated.username, fullName: updated.fullName } };
  },
};
