// Global Session Store for Netlify Serverless API & Local Dev
if (!global._sofoActiveSessions) {
  global._sofoActiveSessions = new Map();
}

export const activeSessions = global._sofoActiveSessions;
