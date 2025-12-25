// src/api/base44client.js
export const base44 = {
  auth: {
    me: async () => ({
      full_name: "alirahshmi",
      email: "alirahshmi@gmail.com",
    }),
    logout: async () => {
      // TODO: Implement logout logic with real backend
      console.log("Logged out");
    },
  },

  integrations: {
    core: {
      // Upload a file and return file URL
      UploadFile: async ({ file }) => {
        // TODO: Replace with real API call
        if (!file) throw new Error("No file provided");
        
        // For mock purposes, generate a fake URL
        const file_url = URL.createObjectURL(file);
        return { file_url };
      },
    },
  },

  entities: {
    Settings: {
      list: async () => [],
      create: async (data) => ({ ...data }),
      update: async (id, data) => ({ id, ...data }),
    },

    Image: {
      create: async ({ project_id, filename, image_url, width, height, status }) => {
        // Mock returned object
        return {
          id: Math.random().toString(36).substring(2, 9),
          project_id,
          filename,
          image_url,
          width,
          height,
          status,
          created_date: new Date().toISOString(),
        };
      },
      update: async (id, data) => ({ id, ...data }),
    },

    Annotation: {
      create: async (data) => ({ id: Math.random().toString(36).substring(2, 9), ...data }),
    },

    Project: {
      list: async () => [],
      update: async (id, data) => ({ id, ...data }),
    },
  },
};
