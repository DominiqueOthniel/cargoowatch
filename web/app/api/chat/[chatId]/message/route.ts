import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface Params {
  params: Promise<{ chatId: string }>;
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { chatId } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    const { data: msg, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          conversation_id: chatId,
          text: body.text,
          image: body.image || null,
          sender_type: body.senderType || "client",
          sender_name: body.senderName || null,
          sender_id: body.senderId || null,
          read: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from("chat_conversations")
      .update({
        updated_at: new Date().toISOString(),
        status: "active",
      })
      .eq("id", chatId);

    return NextResponse.json({
      message: {
        id: msg.id,
        text: msg.text,
        image: msg.image,
        senderType: msg.sender_type,
        senderName: msg.sender_name,
        timestamp: msg.created_at,
        read: msg.read,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible d’envoyer le message" },
      { status: 500 }
    );
  }
}
