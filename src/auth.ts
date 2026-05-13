import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authConfig } from "../auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    signIn({ user }) {
      if (!user.email || !user.email.endsWith("@fashionica.com")) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
