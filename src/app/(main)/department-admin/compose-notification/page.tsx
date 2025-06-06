
import { AIComposeForm } from '@/components/campusconnect/AIComposeForm'; // Reusing the same component

export default function DepartmentAIComposePage() {
  // Potentially pre-fill recipientGroup based on department admin's department
  return (
    <div className="container mx-auto py-8">
       <AIComposeForm />
    </div>
  );
}
