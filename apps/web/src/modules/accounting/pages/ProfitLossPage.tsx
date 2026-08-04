import { useState } from "react";
import { useGetProfitLoss } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { formatCurrency } from "@/shared/lib/utils";
import { ArrowUpRight, ArrowDownRight, Target } from "lucide-react";

export default function ProfitLossPage() {
  const [period, setPeriod] = useState("MTD");

  const { data: pnl, isLoading } = useGetProfitLoss({
    query: {
      queryKey: ["pnl", period],
      period: period
    }
  });

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Profit & Loss</h1>
          <p className="text-sm font-mono text-muted-foreground">Financial Performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MTD">Month to Date</SelectItem>
              <SelectItem value="YTD">Year to Date</SelectItem>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 font-mono">
            EXPORT.CSV
          </Button>
        </div>
      </div>

      {isLoading || !pnl ? (
        <div className="p-12 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
          COMPILING.REPORT...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-mono font-medium text-primary uppercase">Total Revenue</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-primary">
                  {formatCurrency(pnl.totalRevenue)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-mono font-medium text-destructive uppercase">Total Expenses</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-destructive">
                  {formatCurrency(pnl.totalExpenses)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-mono font-medium text-muted-foreground uppercase">Net Profit</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {formatCurrency(pnl.netProfit)}
                </div>
                <div className="text-xs font-mono text-muted-foreground mt-1">
                  MARGIN: {(pnl.netProfitMargin * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Revenue Breakdown</h2>
              {pnl.revenueLines && pnl.revenueLines.length > 0 ? (
                <div className="bg-card border border-border divide-y divide-border">
                  {pnl.revenueLines.map((line, i) => (
                    <div key={i} className="flex justify-between items-center p-4">
                      <span className="text-sm uppercase">{line.category}</span>
                      <span className="font-mono text-sm text-primary">{formatCurrency(line.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-4 bg-primary/10">
                    <span className="text-sm font-bold uppercase text-primary">TOTAL</span>
                    <span className="font-mono text-sm font-bold text-primary">{formatCurrency(pnl.totalRevenue)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
                  NO.REVENUE.DATA
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-mono uppercase tracking-widest text-destructive border-b border-destructive/20 pb-2">Expense Breakdown</h2>
              {pnl.expenseLines && pnl.expenseLines.length > 0 ? (
                <div className="bg-card border border-border divide-y divide-border">
                  {pnl.expenseLines.map((line, i) => (
                    <div key={i} className="flex justify-between items-center p-4">
                      <span className="text-sm uppercase">{line.category}</span>
                      <span className="font-mono text-sm text-destructive">{formatCurrency(line.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center p-4 bg-destructive/10">
                    <span className="text-sm font-bold uppercase text-destructive">TOTAL</span>
                    <span className="font-mono text-sm font-bold text-destructive">{formatCurrency(pnl.totalExpenses)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center font-mono text-sm text-muted-foreground border border-border bg-card">
                  NO.EXPENSE.DATA
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
