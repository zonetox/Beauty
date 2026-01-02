import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ConnectionTestPage: React.FC = () => {
    const [status, setStatus] = useState<string>('Initializing...');
    const [envInfo, setEnvInfo] = useState<any>({});
    const [dbResult, setDbResult] = useState<any>(null);

    useEffect(() => {
        const runTest = async () => {
            try {
                // 1. Check Env Vars (safe expose)
                const url = import.meta.env.VITE_SUPABASE_URL;
                const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

                setEnvInfo({
                    urlProvided: !!url,
                    urlLength: url?.length,
                    keyProvided: !!key,
                    keyLength: key?.length,
                    isDummy: url?.includes('dummy') || false
                });

                if (!url || !key) {
                    setStatus('FAILED: Missing Environment Variables');
                    return;
                }

                setStatus('Connecting to Supabase...');

                // 2. Simple Table Read
                const { data, error } = await supabase.from('businesses').select('count', { count: 'exact', head: true });

                if (error) {
                    setStatus(`FAILED: Database connection error. ${error.message}`);
                    setDbResult(error);
                } else {
                    setStatus('SUCCESS: Connected to Database');
                    setDbResult({ count: data, message: 'Read successful' });
                }

            } catch (err: any) {
                setStatus(`CRITICAL FAILURE: ${err.message}`);
            }
        };

        runTest();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h1>System Connection Diagnosis</h1>
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
                <strong>Status:</strong> <span style={{ color: status.startsWith('SUCCESS') ? 'green' : 'red' }}>{status}</span>
            </div>

            <h3>Environment Configuration</h3>
            <pre>{JSON.stringify(envInfo, null, 2)}</pre>

            <h3>Database Test Result</h3>
            <pre>{JSON.stringify(dbResult, null, 2)}</pre>
        </div>
    );
};

export default ConnectionTestPage;
