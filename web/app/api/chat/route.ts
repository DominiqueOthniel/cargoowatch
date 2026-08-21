import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatConversation } from "@/lib/types";

function mapConversation(
  conv: Record<string, unknown>,
  messages: Record<string, unknown>[] = []
): ChatConversation {
  return {
    id: String(conv.id),
    clientName: String(conv.client_name),
    clientEmail: String(conv.client_email),
    subject: (conv.subject as string) || null,
    trackingId: (conv.tracking_id as string) || null,
    status: String(conv.status),
    createdAt: String(conv.created_at),
    updatedAt: String(conv.updated_at),
    assignedTo: (conv.assigned_to as string) || null,
    messages: messages
      .map((msg) => ({
        id: String(msg.id),
        text: String(msg.text),
        image: (msg.image as string) || null,
        senderType: msg.sender_type as "client" | "admin",
        senderName: (msg.sender_name as string) || null,
        timestamp: String(msg.created_at),
        read: Boolean(msg.read),
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
  };
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: conversations, error } = await supabase
      .from("chat_conversations")
      .select(
        `
        *,
        chat_messages (
          id, text, image, sender_type, sender_name, sender_id, read, created_at
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    const chats = (conversations || []).map((conv) =>
      mapConversation(conv as Record<string, unknown>, (conv.chat_messages as Record<string, unknown>[]) || [])
    );

    return NextResponse.json({ chats });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de lister les discussions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    // Reuse open chat for same email if exists
    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("client_email", String(body.clientEmail).toLowerCase())
      .in("status", ["open", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: messages } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", existing.id)
        .order("created_at", { ascending: true });
      return NextResponse.json({
        chat: mapConversation(existing as Record<string, unknown>, messages || []),
      });
    }

    const { data: conv, error } = await supabase
      .from("chat_conversations")
      .insert([
        {
          client_name: body.clientName,
          client_email: String(body.clientEmail).toLowerCase(),
          subject: body.subject || "Support",
          tracking_id: body.trackingId || null,
          status: "open",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabase.from("chat_messages").insert([
      {
        conversation_id: conv.id,
        text: `Bonjour ${body.clientName}, comment pouvons-nous vous aider ?`,
        sender_type: "admin",
        sender_name: "Aurex Logistics Support",
        read: false,
      },
    ]);

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    return NextResponse.json(
      { chat: mapConversation(conv as Record<string, unknown>, messages || []) },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de démarrer le chat" },
      { status: 500 }
    );
  }
}
