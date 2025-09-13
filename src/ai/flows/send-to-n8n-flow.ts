'use server';
/**
 * @fileOverview A flow to send student data to an n8n webhook.
 *
 * - sendStudentToN8n - A function that sends student data to a configured n8n webhook.
 * - StudentDataSchema - The Zod schema for the student data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Student } from '@/lib/types';

// Define a schema for the data we'll send to n8n
const StudentDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  onAccount: z.number(),
  balance: z.number(),
  total: z.number(),
  course: z.string(),
  observations: z.string().optional(),
  qrPaymentUrl: z.string().optional(),
  qrPaymentFileName: z.string().optional(),
  hasVideo: z.boolean().optional(),
});

export type StudentData = z.infer<typeof StudentDataSchema>;

// The main exported function that the frontend will call
export async function sendStudentToN8n(student: StudentData): Promise<void> {
  await sendToN8nFlow(student);
}

const sendToN8nFlow = ai.defineFlow(
  {
    name: 'sendToN8nFlow',
    inputSchema: StudentDataSchema,
    outputSchema: z.void(),
  },
  async (student) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL environment variable is not set.');
      // In a real app, you might want to throw an error or handle this more gracefully.
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Failed to send data to n8n. Status: ${response.status}, Body: ${errorBody}`);
      } else {
        console.log(`Successfully sent student ${student.id} to n8n.`);
      }
    } catch (error) {
      console.error('Error sending data to n8n:', error);
    }
  }
);


// New flow for formatted string data
const FormattedStudentDataSchema = z.object({
    date: z.string(),
    name: z.string(),
    phone: z.string(),
    course: z.string(),
    onAccount: z.number(),
    balance: z.number(),
    total: z.number(),
    qrPayment: z.string(),
    observations: z.string(),
    video: z.string(),
});

export type FormattedStudentData = z.infer<typeof FormattedStudentDataSchema>;

export async function sendFormattedStudentToN8n(studentData: FormattedStudentData): Promise<void> {
  await sendFormattedToN8nFlow(studentData);
}

const sendFormattedToN8nFlow = ai.defineFlow(
  {
    name: 'sendFormattedToN8nFlow',
    inputSchema: FormattedStudentDataSchema,
    outputSchema: z.void(),
  },
  async (data) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL environment variable is not set.');
      return;
    }

    // Format the data as a single string
    const formattedString = [
      data.date,
      data.name,
      data.phone,
      data.course,
      data.onAccount,
      data.balance,
      data.total,
      data.qrPayment,
      data.observations,
      data.video
    ].join('/');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          // Send as plain text
          'Content-Type': 'text/plain',
        },
        body: formattedString,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Failed to send formatted data to n8n. Status: ${response.status}, Body: ${errorBody}`);
      } else {
        console.log(`Successfully sent formatted student data for ${data.name} to n8n.`);
      }
    } catch (error) {
      console.error('Error sending formatted data to n8n:', error);
    }
  }
);
