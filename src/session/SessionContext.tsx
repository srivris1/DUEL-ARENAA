import type { ReactNode } from 'react';
import { SessionContext } from './context';
import { useSessionValue } from './useSession';

export function SessionProvider({ children }: { children: ReactNode }) {
  const value = useSessionValue();
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
