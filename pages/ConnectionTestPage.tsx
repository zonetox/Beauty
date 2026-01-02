import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const ConnectionTestPage: React.FC = () => {
    const [status, setStatus] = useState<string>('Initializing...');
    const [envInfo, setEnvInfo] = useState<any>({});
    const [dbResult, setDbResult] = useState<any>(null);

    useEffect(() => {
        const runTest = async () => {
            try {
                // 1. Check Env Vars
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

                setStatus('Connecting to Supabase (SDK)...');

                // 2. Simple Table Read (SDK) with Fail-safe Timeout
                const sdkPromise = supabase.from('businesses').select('count', { count: 'exact', head: true });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SDK_TIMEOUT')), 5000));

                try {
                    await Promise.race([sdkPromise, timeoutPromise]);
                    const { data, error } = await sdkPromise;

                    if (error) {
                        setStatus(`FAILED: Database connection error. ${error.message}`);
                        setDbResult(error);
                    } else {
                        setStatus('SUCCESS: Connected to Database (SDK)');
                        setDbResult({ count: data, message: 'Read successful' });
                    }
                } catch (err: any) {
                    if (err.message === 'SDK_TIMEOUT') {
                        setStatus('SDK Timed out. Testing Clean Client...');

                        // 3. Try Clean Client (No Auth Persistence)
                        try {
                            const { createClient } = await import('@supabase/supabase-js');
                            const cleanClient = createClient(url, key, {
                                auth: {
                                    persistSession: false,
                                    autoRefreshToken: false,
                                    detectSessionInUrl: false
                                }
                            });

                            const cleanSdkPromise = cleanClient.from('businesses').select('count', { count: 'exact', head: true });
                            const cleanTimeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('CLEAN_SDK_TIMEOUT')), 5000));

                            await Promise.race([cleanSdkPromise, cleanTimeoutPromise]);
                            const { data: cleanData, error: cleanError } = await cleanSdkPromise;

                            if (cleanError) {
                                setStatus(`FAILED: Clean Client Error. ${cleanError.message}`);
                            } else {
                                setStatus('SUCCESS: Clean Client Worked! (Local Storage/Auth Issue)');
                                setDbResult({ sdk: 'Timeout', cleanClient: 'Success', rawFetch: 'Pending', data: cleanData });
                                // If clean client works, we probably don't need to try raw fetch to know it connects, 
                                // but let's keep raw fetch as a fallback or just show this success.
                                return;
                            }
                        } catch (cleanErr: any) {
                            setStatus(`Clean Client Failed: ${cleanErr.message}. Trying Raw Fetch...`);
                        }

                        // Fallback to Raw Fetch
                        try {
                            const rawUrl = `${url}/rest/v1/businesses?select=count&limit=1`;
                            const res = await fetch(rawUrl, {
                                method: 'GET',
                                headers: {
                                    'apikey': key,
                                    'Authorization': `Bearer ${key}`
                                }
                            });

                            if (res.ok) {
                                const data = await res.json();
                                setStatus('SUCCESS: Raw Fetch Worked! (SDK Deep Issue)');
                                setDbResult((prev: any) => ({ ...prev, rawFetch: 'Success', data }));
                            } else {
                                setStatus(`FAILED: Raw Fetch ${res.status}`);
                                setDbResult((prev: any) => ({ ...prev, rawFetch: 'Error', status: res.status }));
                            }
                        } catch (fetchErr: any) {
                            setStatus(`CRITICAL: Raw Fetch Failed. ${fetchErr.message}`);
                        }
                    } else {
                        throw err;
                    }
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
