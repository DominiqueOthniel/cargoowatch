import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: Promise<{ chatId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { chatId } = await params;
    const supabase = createAdminClient();
    const { data: conv, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", chatId)
      .maybeSingle();
    if (error) throw error;
    if (!conv) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", chatId)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      chat: {
        id: conv.id,
        clientName: conv.client_name,
        clientEmail: conv.client_email,
        subject: conv.subject,
        trackingId: conv.tracking_id,
        status: conv.status,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        assignedTo: conv.assigned_to,
        messages: (messages || []).map((msg) => ({
          id: msg.id,
          text: msg.text,
          image: msg.image,
          senderType: msg.sender_type,
          senderName: msg.sender_name,
          timestamp: msg.created_at,
          read: msg.read,
        })),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { chatId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status) patch.status = body.status;
    if (body.assignedTo !== undefined) patch.assigned_to = body.assignedTo;

    const { data, error } = await supabase
      .from("chat_conversations")
      .update(patch)
      .eq("id", chatId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ chat: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
