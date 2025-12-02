
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';

// --- Icon Components ---
const CheckCircleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);
const XCircleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  </svg>
);
const ClockIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

type Status = 'idle' | 'pending' | 'success' | 'error';

interface CheckResult {
  id: string;
  label: string;
  status: Status;
  message: string;
}

const initialChecks: CheckResult[] = [
  { id: 'client', label: 'Supabase Client Configuration', status: 'idle', message: 'Not checked yet.' },
  { id: 'api', label: 'API & Database Read', status: 'idle', message: 'Not checked yet.' },
  { id: 'auth', label: 'Authentication Service', status: 'idle', message: 'Not checked yet.' },
  { id: 'storage', label: 'Storage Service', status: 'idle', message: 'Not checked yet.' },
  { id: 'functions', label: 'Edge Functions', status: 'idle', message: 'Not checked yet.' },
];

const ApiHealthTool: React.FC = () => {
  const [checks, setChecks] = useState<CheckResult[]>(initialChecks);
  const [isLoading, setIsLoading] = useState(false);
  const [overallStatus, setOverallStatus] = useState<Status>('idle');

  const updateCheckStatus = (id: string, status: Status, message: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status, message } : c));
  };

  const runChecks = async () => {
    setIsLoading(true);
    setOverallStatus('pending');
    setChecks(initialChecks.map(c => ({ ...c, status: 'pending', message: 'Checking...' })));

    let allSystemsGo = true;

    // Check 1: Client Config
    if (isSupabaseConfigured) {
      updateCheckStatus('client', 'success', 'Client is configured correctly with environment variables.');
    } else {
      updateCheckStatus('client', 'error', 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY are missing or invalid.');
      allSystemsGo = false;
    }
    await new Promise(r => setTimeout(r, 200));

    // Check 2: API & DB
    const { error: dbError } = await supabase.from('business').select('id', { count: 'exact', head: true });
    if (dbError) {
      updateCheckStatus('api', 'error', `Failed to query database: ${dbError.message}`);
      allSystemsGo = false;
    } else {
      updateCheckStatus('api', 'success', 'Successfully connected and read from the database.');
    }
    await new Promise(r => setTimeout(r, 200));

    // Check 3: Auth
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      updateCheckStatus('auth', 'error', `Auth service error: ${authError.message}`);
      allSystemsGo = false;
    } else {
      updateCheckStatus('auth', 'success', 'Authentication service is responsive.');
    }
    await new Promise(r => setTimeout(r, 200));

    // Check 4: Storage
    const { error: storageError } = await supabase.storage.from('business-assets').list('', { limit: 1 });
    if (storageError) {
        updateCheckStatus('storage', 'error', `Storage error: ${storageError.message}. Ensure 'business-assets' bucket exists and has correct policies.`);
        allSystemsGo = false;
    } else {
        updateCheckStatus('storage', 'success', 'Storage service is responsive.');
    }
    await new Promise(r => setTimeout(r, 200));

    // Check 5: Functions
    const { error: functionError } = await supabase.functions.invoke('send-email');
    if (functionError && functionError.message.includes('Missing required fields')) {
        updateCheckStatus('functions', 'success', 'Edge Functions are invokable. Received expected parameter error.');
    } else if (functionError) {
        updateCheckStatus('functions', 'error', `Invocation failed unexpectedly: ${functionError.message}`);
        allSystemsGo = false;
    } else {
        updateCheckStatus('functions', 'error', 'Invocation did not return an expected error, which is unusual.');
        allSystemsGo = false;
    }

    setIsLoading(false);
    setOverallStatus(allSystemsGo ? 'success' : 'error');
  };

  const statusIcons: { [key in Status]: React.ReactNode } = {
      idle: <ClockIcon />,
      pending: <LoadingSpinner />,
      success: <CheckCircleIcon />,
      error: <XCircleIcon />,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h3 className="text-md font-semibold text-neutral-dark">Supabase API Health Status</h3>
            <p className="text-sm text-gray-500">Run these checks to diagnose connection issues with Supabase services.</p>
        </div>
        <button
          onClick={runChecks}
          disabled={isLoading}
          className="px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:opacity-90 disabled:bg-gray-400 transition-colors text-sm"
        >
          {isLoading ? 'Running...' : 'Run Health Check'}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {checks.map(check => (
          <div key={check.id} className="p-3 border rounded-md bg-white">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">{statusIcons[check.status]}</div>
              <div className="flex-grow">
                <p className="font-medium text-neutral-dark">{check.label}</p>
                <p className={`text-xs ${check.status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>
                  {check.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

       {overallStatus !== 'idle' && !isLoading && (
            <div className={`mt-4 p-3 rounded-md text-sm font-semibold text-center ${overallStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {overallStatus === 'success' ? 'All systems operational.' : 'Some issues were detected.'}
            </div>
       )}
    </div>
  );
};

export default ApiHealthTool;
