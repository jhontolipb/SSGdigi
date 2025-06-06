
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Bot, AlertTriangle, CheckCircle2, Wand2, Send } from 'lucide-react'; // Added Send icon
import { composeNotification, ComposeNotificationInput, ComposeNotificationOutput } from '@/ai/flows/compose-notification';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext"; // Added useAuth

const formSchema = z.object({
  recipientGroup: z.string().min(3, { message: "Recipient group must be at least 3 characters." }),
  notificationType: z.string().min(3, { message: "Notification type must be at least 3 characters." }),
  topic: z.string().min(5, { message: "Topic must be at least 5 characters." }),
});

const recipientGroupSuggestions = [
  "All Students",
  "BS Tourism Management Students",
  "BS Information Technology Students",
  "BS Criminology Students",
  "Robotics Club Members",
  "Students with Pending Clearances",
];

const notificationTypeSuggestions = [
  "General Announcement",
  "Event Invitation",
  "Clearance Reminder",
  "Urgent Update",
  "Meeting Schedule",
  "Deadline Reminder",
];

export function AIComposeForm() {
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composedNotification, setComposedNotification] = useState<ComposeNotificationOutput | null>(null);
  const [formInputData, setFormInputData] = useState<z.infer<typeof formSchema> | null>(null);
  const { toast } = useToast();
  const { storeComposedNotification, user } = useAuth(); // Get storeComposedNotification from AuthContext

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipientGroup: "",
      notificationType: "",
      topic: "",
    },
  });

  async function onComposeSubmit(values: z.infer<typeof formSchema>) {
    setIsComposing(true);
    setComposedNotification(null);
    setFormInputData(values); // Store form input for sending later
    try {
      const result = await composeNotification(values as ComposeNotificationInput);
      setComposedNotification(result);
      toast({
        title: "Notification Composed!",
        description: "AI has generated a notification draft.",
        variant: "default",
        action: <CheckCircle2 className="text-green-500" />,
      });
    } catch (error) {
      console.error("Error composing notification:", error);
      toast({
        title: "Error Composing Notification",
        description: (error as Error).message || "An unexpected error occurred.",
        variant: "destructive",
        action: <AlertTriangle className="text-red-500"/>,
      });
    } finally {
      setIsComposing(false);
    }
  }

  const handleSendNotification = async () => {
    if (!composedNotification || !formInputData || !user) {
      toast({
        title: "Cannot Send",
        description: "No notification composed or missing critical data.",
        variant: "destructive",
      });
      return;
    }
    setIsSending(true);
    try {
      const notificationId = await storeComposedNotification(composedNotification, formInputData);
      if (notificationId) {
        toast({
          title: "Notification Stored!",
          description: "The composed notification has been saved.",
          action: <CheckCircle2 className="text-green-500" />,
        });
        // Optionally reset the form or clear composedNotification
        setComposedNotification(null);
        form.reset();
        setFormInputData(null);
      } else {
        // Error toast is handled by storeComposedNotification in context
      }
    } catch (error) {
      // Error toast is likely handled by context, but can add a fallback
      console.error("Error sending notification from form:", error);
      toast({
        title: "Sending Error",
        description: "An unexpected error occurred while trying to send.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <Bot className="text-primary h-7 w-7" /> AI-Driven Notification Composer
        </CardTitle>
        <CardDescription>
          Let AI assist you in crafting targeted and effective notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onComposeSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="recipientGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="e.g., All Students, BSIT Students, Robotics Club" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipientGroupSuggestions.map(suggestion => (
                        <SelectItem key={suggestion} value={suggestion}>{suggestion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Who is this notification for?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notificationType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notification Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="e.g., Announcement, Clearance Reminder, Event Update" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {notificationTypeSuggestions.map(suggestion => (
                        <SelectItem key={suggestion} value={suggestion}>{suggestion}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What kind of notification is this?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic / Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Upcoming SSG Elections, Final Clearance Deadline" {...field} />
                  </FormControl>
                  <FormDescription>
                    What is the main subject of the notification?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isComposing || isSending}>
              {isComposing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Compose Notification
            </Button>
          </form>
        </Form>

        {composedNotification && (
          <Card className="mt-8 bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="text-green-500"/> Composed Notification Draft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="composedMessage" className="font-semibold">Message:</Label>
                <Textarea id="composedMessage" value={composedNotification.message} readOnly rows={6} className="mt-1 bg-background" />
              </div>
              <div>
                <Label htmlFor="urgencyLevel" className="font-semibold">Suggested Urgency Level:</Label>
                <Input id="urgencyLevel" value={composedNotification.urgencyLevel} readOnly className="mt-1 bg-background capitalize" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(composedNotification.message)} disabled={isSending}>Copy Message</Button>
                <Button onClick={handleSendNotification} disabled={isSending || isComposing} className="bg-accent hover:bg-accent/90">
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
