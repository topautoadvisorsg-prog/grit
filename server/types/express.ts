declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string | null;
      username?: string | null;
      role: string;
      tier?: string;
    }
  }
}

export {};
