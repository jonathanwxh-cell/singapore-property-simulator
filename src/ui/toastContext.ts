import { createContext, useContext, type ReactNode } from 'react';

export type ToastTone = 'neutral' | 'good' | 'bad' | 'gold';

export interface ToastInput {
  title: ReactNode;
  body?: ReactNode;
  emoji?: string;
  tone?: ToastTone;
  duration?: number;
}

export const ToastCtx = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}
