import type {
  DefaultSession,
  DefaultUser,
} from "next-auth";
import type { Role } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: Role[];
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    roles: Role[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: Role[];
  }
}
