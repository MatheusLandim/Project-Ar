export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(n || 0);

export const formatDate = (s?: string | null) =>
  s ? new Date(s + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export const hoje = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
};
