
import { AIComposeForm } from '@/components/campusconnect/AIComposeForm'; // Reusing the same component

export default function ClubAIComposePage() {
  // Potentially pre-fill recipientGroup based on club admin's club
  return (
    <div className="container mx-auto py-8">
       <AIComposeForm />
    </div>
  );
}

