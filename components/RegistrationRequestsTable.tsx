import React from 'react';
import { RegistrationRequest } from '../types.ts';

interface RegistrationRequestsTableProps {
    requests: RegistrationRequest[];
    onApprove: (requestId: string) => void;
    onReject: (requestId: string) => void;
}

const RegistrationRequestsTable: React.FC<RegistrationRequestsTableProps> = ({ requests, onApprove, onReject }) => {

    const pendingRequests = requests.filter(r => r.status === 'Pending');

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-neutral-dark">Pending Registrations ({pendingRequests.length})</h3>
            {pendingRequests.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Business Name</th>
                                <th scope="col" className="px-6 py-3">Contact</th>
                                <th scope="col" className="px-6 py-3">Selected Tier</th>
                                <th scope="col" className="px-6 py-3">Submitted On</th>
                                <th scope="col" className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingRequests.map(request => (
                                <tr key={request.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-neutral-dark whitespace-nowrap">{request.business_name}</td>
                                    <td className="px-6 py-4">
                                        <div>{request.email}</div>
                                        <div>{request.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {request.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(request.submitted_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 flex items-center gap-2">
                                        <button
                                            onClick={() => onApprove(request.id)}
                                            className="font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-xs"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => onReject(request.id)}
                                            className="font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-xs"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 py-6">No pending registration requests.</p>
            )}
        </div>
    );
};

export default RegistrationRequestsTable;
