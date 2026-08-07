import { getOrCreatePatient } from "@/lib/getOrCreatePatient";
import TopNav from "@/components/TopNav";
import CheckinWizard from "@/components/CheckinWizard";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const patient = await getOrCreatePatient();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav patientName={patient.name} patientAge={patient.age} />
      <div className="flex-1 px-4 md:px-[5vw] py-10">
        <CheckinWizard patientName={patient.name} />
      </div>
    </div>
  );
}
