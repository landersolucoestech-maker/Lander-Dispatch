import { Link, useParams } from "wouter";
import { Button } from "@/shared/components/ui/button";

export default function ContactDetailPage() {
  const params = useParams();
  
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-card border border-border m-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase">Contact {params.contactId}</h1>
        <p className="text-sm font-mono text-muted-foreground">Detail view implementation stub.</p>
        <Link href="/crm/contacts">
          <Button variant="outline" className="mt-4">Return to Contacts</Button>
        </Link>
      </div>
    </div>
  );
}
