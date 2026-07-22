import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "email-demo",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      if (!email || !email.includes("@")) return null;
      return {
        id: `email:${email}`,
        email,
        name: email.split("@")[0],
      };
    },
  }),
];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET) {
  providers.push({
    id: "roblox",
    name: "Roblox",
    type: "oauth",
    authorization: {
      url: "https://apis.roblox.com/oauth/v1/authorize",
      params: { scope: "openid profile", response_type: "code" },
    },
    token: "https://apis.roblox.com/oauth/v1/token",
    userinfo: "https://apis.roblox.com/oauth/v1/userinfo",
    clientId: process.env.ROBLOX_CLIENT_ID,
    clientSecret: process.env.ROBLOX_CLIENT_SECRET,
    profile(profile: {
      sub: string;
      name?: string;
      preferred_username?: string;
      nickname?: string;
      picture?: string;
    }) {
      return {
        id: profile.sub,
        name: profile.name || profile.preferred_username || profile.nickname || "Roblox User",
        email: null,
        image: profile.picture || null,
      };
    },
  });
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.provider = account.provider;
      }
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = (token.uid as string) || token.sub || "";
        (session as { provider?: string }).provider = token.provider as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "rbxlanimate-dev-secret-change-me",
  session: { strategy: "jwt" },
};
