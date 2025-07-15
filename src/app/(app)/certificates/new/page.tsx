import { CertificateForm } from "@/components/certificates/certificate-form";
import { PageHeader } from "@/components/page-header";

export default function NewCertificatePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Test Certificate"
        description="Fill in the details to generate a new certificate."
      />
      <CertificateForm />
    </div>
  );
}
