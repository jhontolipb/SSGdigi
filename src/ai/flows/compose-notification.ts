// src/ai/flows/compose-notification.ts
'use server';

/**
 * @fileOverview A flow to compose targeted notification texts to specific students or groups using AI.
 *
 * - composeNotification - A function that handles the notification composition process.
 * - ComposeNotificationInput - The input type for the composeNotification function.
 * - ComposeNotificationOutput - The return type for the composeNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComposeNotificationInputSchema = z.object({
  recipientGroup: z
    .string()
    .describe(
      'The group of recipients for the notification (e.g., all students, BS Tourism Management, Robotics Club).'
    ),
  notificationType: z
    .string()
    .describe(
      'The type of notification to compose (e.g., announcement, clearance reminder, general update).'
    ),
  topic: z
    .string()
    .describe('The specific topic or subject of the notification.'),
});

export type ComposeNotificationInput = z.infer<typeof ComposeNotificationInputSchema>;

const ComposeNotificationOutputSchema = z.object({
  message: z.string().describe('The AI-composed notification message.'),
  urgencyLevel: z
    .string()
    .describe(
      'The AI-determined urgency level of the notification (e.g., high, medium, low).'
    ),
});

export type ComposeNotificationOutput = z.infer<typeof ComposeNotificationOutputSchema>;

export async function composeNotification(
  input: ComposeNotificationInput
): Promise<ComposeNotificationOutput> {
  return composeNotificationFlow(input);
}

const composeNotificationPrompt = ai.definePrompt({
  name: 'composeNotificationPrompt',
  input: {schema: ComposeNotificationInputSchema},
  output: {schema: ComposeNotificationOutputSchema},
  prompt: `You are an AI assistant helping an SSG admin compose targeted notifications to students.

You will receive the recipient group, notification type, and topic of the notification.
Your goal is to compose a concise and engaging notification message and determine its urgency level.

Recipient Group: {{{recipientGroup}}}
Notification Type: {{{notificationType}}}
Topic: {{{topic}}}

Compose the notification message:
`, // Removed 'determine urgency level' to ensure schema descriptions are passed.
});

const composeNotificationFlow = ai.defineFlow(
  {
    name: 'composeNotificationFlow',
    inputSchema: ComposeNotificationInputSchema,
    outputSchema: ComposeNotificationOutputSchema,
  },
  async input => {
    const {output} = await composeNotificationPrompt(input);
    return output!;
  }
);
