export const base44 = {
  auth: {
    me: async () => null,
    logout: () => {},
  },
  entities: {
    Settings: {
      list: async () => [],
      create: async () => {},
      update: async () => {},
    },
    Image: {
      update: async () => {},
    },
    Annotation: {
      create: async () => {},
    },
    Project: {
      list: async () => [],
      update: async () => {},
    },
  },
};
