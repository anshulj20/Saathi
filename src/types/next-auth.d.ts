import { DefaultSession } from "next-auth";

type Role = "customer" | "nurse" | "admin";
type Status = "pending_vetting" | "active" | "suspended";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: Status;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    status: Status;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: Status;
  }
}
