import { createContext } from 'react';
import type { SessionValue } from './useSession';

export const SessionContext = createContext<SessionValue | null>(null);
