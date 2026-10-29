export default {
  routes: [
    // Updates the logged-in user only; the core PUT /users/:id would allow editing any account
    { method: 'PUT', path: '/profile', handler: 'profile.update' },
  ],
};
