import { 
  SupabaseAuthAdapter, 
  SupabaseDatabaseAdapter, 
  SupabaseRealtimeAdapter, 
  SupabaseFunctionAdapter 
} from './supabase'

import { 
  CloudBaseAuthAdapter, 
  CloudBaseDatabaseAdapter, 
  CloudBaseRealtimeAdapter, 
  CloudBaseFunctionAdapter 
} from './cloudbase'

import type { 
  AuthAdapter, 
  DatabaseAdapter, 
  RealtimeAdapter, 
  FunctionAdapter 
} from './types'

const provider = import.meta.env.VITE_DB_PROVIDER || 'supabase'

console.log(`[Adapter] Using database provider: ${provider}`)

let authAdapter: AuthAdapter
let dbAdapter: DatabaseAdapter
let realtimeAdapter: RealtimeAdapter
let functionAdapter: FunctionAdapter

if (provider === 'cloudbase') {
  authAdapter = new CloudBaseAuthAdapter()
  dbAdapter = new CloudBaseDatabaseAdapter()
  realtimeAdapter = new CloudBaseRealtimeAdapter()
  functionAdapter = new CloudBaseFunctionAdapter()
} else {
  authAdapter = new SupabaseAuthAdapter()
  dbAdapter = new SupabaseDatabaseAdapter()
  realtimeAdapter = new SupabaseRealtimeAdapter()
  functionAdapter = new SupabaseFunctionAdapter()
}

// Initialize auth immediately
authAdapter.init()

export {
  authAdapter,
  dbAdapter,
  realtimeAdapter,
  functionAdapter,
  provider
}
