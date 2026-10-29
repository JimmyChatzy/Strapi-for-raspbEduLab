// Adds the teacher's full name to the user account. Shown as the scenario author; the username is the fallback.
export default (plugin: any) => {
  plugin.contentTypes.user.schema.attributes.fullName = {
    type: 'string',
    maxLength: 100,
  };
  return plugin;
};
