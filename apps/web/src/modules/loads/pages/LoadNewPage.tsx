import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateLoad, useListCarriers, useListBrokers } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getListLoadsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  pickupCity: z.string().min(1, "Required"),
  pickupState: z.string().min(1, "Required"),
  pickupZip: z.string().optional(),
  deliveryCity: z.string().min(1, "Required"),
  deliveryState: z.string().min(1, "Required"),
  deliveryZip: z.string().optional(),
  pickupEstimated: z.string().optional(),
  deliveryEstimated: z.string().optional(),
  miles: z.coerce.number().optional(),
  rate: z.coerce.number().min(0),
  carrierId: z.string().optional(),
  brokerId: z.string().optional(),
  status: z.string().default("New"),
  dispatchInstructions: z.string().optional(),
});

export default function LoadNewPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createLoad = useCreateLoad();

  const { data: carriers } = useListCarriers({ query: { pageSize: 100 } });
  const { data: brokers } = useListBrokers({ query: { pageSize: 100 } });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pickupCity: "",
      pickupState: "",
      deliveryCity: "",
      deliveryState: "",
      rate: 0,
      miles: 0,
      status: "New",
      dispatchInstructions: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createLoad.mutate(
      { data: values },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListLoadsQueryKey() });
          setLocation(`/loads/${res.id}`);
        },
      }
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-8 overflow-y-auto max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/loads">
          <Button variant="outline" size="icon" className="w-8 h-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Create Load</h1>
          <p className="text-sm font-mono text-muted-foreground">Initialize new freight dispatch</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Routing Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-4 p-4 border border-chart-3/20 bg-chart-3/5">
                <h3 className="text-xs font-mono uppercase text-chart-3 tracking-widest border-b border-chart-3/20 pb-2">Pickup Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickupCity"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickupState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="ST" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickupZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pickupEstimated"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Estimated Date/Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border border-primary/20 bg-primary/5">
                <h3 className="text-xs font-mono uppercase text-primary tracking-widest border-b border-primary/20 pb-2">Delivery Location</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryCity"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="ST" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryEstimated"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Estimated Date/Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Assignment & Financials</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="carrierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Carrier (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carriers?.data.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brokerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Broker</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Broker (Optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brokers?.data.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross Rate ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="miles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distance (Miles)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground uppercase">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="dispatchInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dispatch Notes</FormLabel>
                    <FormControl>
                      <textarea 
                        className="flex min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                        placeholder="Internal notes or specific instructions for the carrier..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/loads">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={createLoad.isPending} className="gap-2">
              <Save className="w-4 h-4" />
              {createLoad.isPending ? "Creating..." : "Create Load"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
