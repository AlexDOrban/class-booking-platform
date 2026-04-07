import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = '@classe/accounts';
const CURRENT_ACCOUNT_KEY = '@classe/currentAccountId';

export interface Account {
  id: string;
  name: string;
  email: string;             // always lowercase
  passwordHash: string;      // SHA-256 hex
  avatarUri: string | null;
  discountType: 'none' | 'student' | 'retired';
  verification: {
    status: 'unverified' | 'pending' | 'approved' | 'rejected';
    idPhotoUri: string | null;
    selfieUri: string | null;
    submittedAt: number | null;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function loadAccounts(): Promise<Record<string, Account>> {
  const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function saveAccounts(accounts: Record<string, Account>): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  avatarUri: string | null,
): Promise<Account> {
  const accounts = await loadAccounts();
  const key = email.toLowerCase().trim();
  if (accounts[key]) throw new Error('EMAIL_TAKEN');
  const account: Account = {
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
    name: name.trim(),
    email: key,
    passwordHash: await hashPassword(password),
    avatarUri,
    discountType: 'none',
    verification: {
      status: 'unverified',
      idPhotoUri: null,
      selfieUri: null,
      submittedAt: null,
    },
  };
  accounts[key] = account;
  await saveAccounts(accounts);
  await AsyncStorage.setItem(CURRENT_ACCOUNT_KEY, account.id);
  return account;
}

export async function signIn(email: string, password: string): Promise<Account> {
  const accounts = await loadAccounts();
  const key = email.toLowerCase().trim();
  const account = accounts[key];
  if (!account) throw new Error('NO_ACCOUNT');
  const hash = await hashPassword(password);
  if (hash !== account.passwordHash) throw new Error('BAD_PASSWORD');
  await AsyncStorage.setItem(CURRENT_ACCOUNT_KEY, account.id);
  return account;
}

export function signOut(setAccount: (a: Account | null) => void): void {
  AsyncStorage.removeItem(CURRENT_ACCOUNT_KEY);
  setAccount(null);
}

export async function restoreSession(): Promise<Account | null> {
  const id = await AsyncStorage.getItem(CURRENT_ACCOUNT_KEY);
  if (!id) return null;
  const accounts = await loadAccounts();
  return Object.values(accounts).find(a => a.id === id) ?? null;
}

export async function updateAccount(account: Account): Promise<Account> {
  const accounts = await loadAccounts();
  accounts[account.email] = account;
  await saveAccounts(accounts);
  return account;
}
