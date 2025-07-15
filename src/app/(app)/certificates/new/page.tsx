
'use client';
import { CertificateForm } from "@/components/certificates/certificate-form";
import { PageHeader } from "@/components/page-header";

export default function NewCertificatePage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="New Test Certificate"
        description="Fill in the details to generate a new certificate."
      />
      <CertificateForm />
    </div>
  );
}
