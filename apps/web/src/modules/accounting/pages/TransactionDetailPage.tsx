import { useGetTransaction } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { ArrowLeft, Edit } from "lucide-react";
import { formatDate } from "@/shared/lib/utils";

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.transactionId!;

  const { data: transaction, isLoading } = useGetTransaction(id, {
    query: {
      queryKey: ["transaction", id],
      enabled: !!id
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-muted-foreground">
        LOADING.TRANSACTION...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex-1 p-8 text-center font-mono text-sm text-destructive">
        TRANSACTION.NOT.FOUND
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/accounting/transactions">
          <Button variant="outline" size="icon" className="w-8 h-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight uppercase truncate">TRX {transaction.transactionId}</h1>
            <StatusBadge status={transaction.status} />
            <span className={`text-xs font-mono px-2 py-0.5 border uppercase ${transaction.type === 'Income' ? 'text-primary border-primary/20 bg-primary/10' : 'text-destructive border-destructive/20 bg-destructive/10'}`}>
              {transaction.type}
            </span>
          </div>
          <p className="text-sm font-mono text-muted-foreground">
            {formatDate(transaction.date)}
          </p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0">
          <Edit className="w-4 h-4" /> Edit
        </Button>
      </div>
      
      <div className="p-8 bg-card border border-border text-center font-mono text-sm text-muted-foreground">
        TRANSACTION.DETAIL.VIEW.RENDERED
      </div>
    </div>
  );
}
