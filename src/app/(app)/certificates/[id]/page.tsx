
'use client';

import { CertificateForm } from "@/components/certificates/certificate-form";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { TcMain } from "@/lib/types";
import axios from "axios";
import { useParams } from "next/navigation";
import * as React from 'react';
import { useTabs } from "@/components/tabs/tab-provider";

export default function EditCertificatePage() {
    const { id } = useParams();
    const [initialData, setInitialData] = React.useState<TcMain | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const { setActiveTab, tabs } = useTabs();

     React.useEffect(() => {
        const path = `/certificates/${id}`;
        // Ensure the tab is set to active if it's the current page
        if (tabs.find(t => t.path === path)) {
            setActiveTab(path);
        }
    }, [id, setActiveTab, tabs]);

    const fetchData = React.useCallback(async () => {
        if (id) {
            try {
                setIsLoading(true);
                const response = await axios.get(`/api/tcmain/${id}`);
                setInitialData(response.data);
            } catch(error) {
                console.error("Failed to fetch certificate", error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [id]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return (
             <div className="space-y-6 p-4 md:p-6 lg:p-8">
                <PageHeader title="Edit Certificate" description="Loading certificate details..." />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            </div>
        )
    }


    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            <PageHeader 
                title={`Edit Certificate: ${initialData?.ApsFullDoc || ''}`}
                description="Update the details of the existing certificate."
            />
            <CertificateForm initialData={initialData} onSave={fetchData} />
        </div>
    )

}
