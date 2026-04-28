import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("general"),
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().min(1),
    message: z.string().min(10),
  }),
  z.object({
    type: z.literal("partnership"),
    name: z.string().min(1),
    organization: z.string().min(1),
    email: z.string().email(),
    partnershipType: z.string().min(1),
    message: z.string().min(10),
  }),
  z.object({
    type: z.literal("report"),
    name: z.string().optional(),
    email: z.string().email(),
    concernType: z.string().min(1),
    description: z.string().min(10),
    url: z.string().optional().or(z.literal("")),
  }),
]);

export async function POST(request: Request) {
  const body = await request.json();
  const result = contactSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid contact form submission.", details: result.error.flatten() },
      { status: 400 }
    );
  }

  console.log("Contact form received:", result.data);

  return NextResponse.json({ success: true });
}
