import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserIdentity(): string {
  const accId = localStorage.getItem('deriv_options_account_id');
  if (accId) {
    return accId;
  }
  return 'Deriv Client';
}
