export {
  claimAnonymousThreads,
  createBrowserClient,
  isSocialAuthProvider,
  signInWithGitHub,
  signInWithGoogle,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from "./client.js";
export type {
  AuthClientOptions,
  ClaimAnonymousThreadsInput,
  ClaimAnonymousThreadsResult,
  EmailAuthResult,
  Session,
  SocialAuthProvider,
  User,
} from "./client.js";
export { createServerClient } from "./server.js";
export type { CookieStore, ServerClientOptions } from "./server.js";
