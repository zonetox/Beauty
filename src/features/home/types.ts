import { HomepageData } from '../../../types';

export interface HomeState {
    data: HomepageData | null;
    isLoading: boolean;
    error: Error | null;
}

export interface HomepageProviderProps {
    children: React.ReactNode;
}
