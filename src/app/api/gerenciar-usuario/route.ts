import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Essa rota roda só no servidor — a chave de serviço (SUPABASE_SERVICE_ROLE_KEY)
// nunca chega no navegador. É a única forma de criar/editar linhas em
// "perfis" (o RLS bloqueia isso pro usuário comum de propósito).

export async function POST(req: Request) {
  // 1) Confirma que quem está chamando está logado e é admin (ou que ainda
  //    não existe nenhum perfil cadastrado — bootstrap do primeiro admin).
  const userClient = await createServerClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existentes } = await admin.from("perfis").select("id").limit(1);
  const bootstrap = !existentes || existentes.length === 0;

  if (!bootstrap) {
    const { data: meuPerfil } = await admin
      .from("perfis")
      .select("is_admin, ativo")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!meuPerfil?.is_admin || !meuPerfil?.ativo) {
      return NextResponse.json({ error: "Só administradores podem gerenciar usuários." }, { status: 403 });
    }
  }

  // 2) Lê os dados enviados
  const body = await req.json();
  const { email, nome, is_admin, areas, ativo, convidar } = body as {
    email: string;
    nome?: string;
    is_admin?: boolean;
    areas?: string[];
    ativo?: boolean;
    convidar?: boolean;
  };
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }

  // 3) Convida por e-mail (só quando pedido — pessoa nova)
  let userId: string | null = null;
  if (convidar) {
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
    if (inviteError && !inviteError.message.toLowerCase().includes("already been registered")) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }
    userId = invited?.user?.id ?? null;
  }

  // Se a pessoa já tem conta (não é a primeira vez), tenta achar o user_id dela
  if (!userId) {
    const { data: usuarios } = await admin.auth.admin.listUsers();
    userId = usuarios?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
  }

  // 4) Salva/atualiza o perfil
  const { error: upsertError } = await admin.from("perfis").upsert(
    {
      email: email.toLowerCase(),
      nome: nome || null,
      is_admin: !!is_admin,
      areas: areas ?? [],
      ativo: ativo ?? true,
      user_id: userId,
    },
    { onConflict: "email" }
  );
  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
