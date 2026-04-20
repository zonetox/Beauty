import React from 'react';
import { useAdminPlatform } from '../../contexts/AdminContext.tsx';
import RegistrationRequestsTable from '../RegistrationRequestsTable.tsx';

interface AdminRegistrationsTabProps {
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

const AdminRegistrationsTab: React.FC<AdminRegistrationsTabProps> = ({ onApprove, onReject }) => {
    const { registrationRequests } = useAdminPlatform();

    return (
        <RegistrationRequestsTable
            requests={registrationRequests}
            onApprove={onApprove}
            onReject={onReject}
        />
    );
};

export default AdminRegistrationsTab;
