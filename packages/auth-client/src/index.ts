export {
  claimAnonymousThreads,
  createBrowserClient,
  getAuthBaseUrl,
  getOAuthLoginUrl,
  isAnonymousSession,
  isAnonymousUser,
  isAuthConfigured,
  isSocialAuthProvider,
  linkOAuthIdentity,
  signInWithGitHub,
  signInWithGoogle,
  signInWithOAuth,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  startOAuthFlow,
} from './client';
export type {
  AuthClientOptions,
  ClaimAnonymousThreadsInput,
  ClaimAnonymousThreadsResult,
  EmailAuthResult,
  OAuthIntent,
  OAuthStartMode,
  Session,
  SocialAuthProvider,
  User,
} from './client';
export { createServerClient } from './server';
export type { CookieStore, ServerClientOptions } from './server';
export { AuthAccountButton } from './AuthAccountButton';
export type { AuthAccountButtonProps } from './AuthAccountButton';
export {
  useSession,
  useUser,
  useAuthActions,
} from './hooks';
