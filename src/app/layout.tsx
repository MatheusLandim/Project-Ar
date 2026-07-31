import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { PALETAS } from "@/lib/types";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Project Ar — Controle Financeiro",
  description: "Um novo mundo de refrigeração — gestão de projetos HVAC",
};

// Padrão: tema ESCURO da marca (a menos que o usuário tenha escolhido claro).
// Também restaura a última cor do site escolhida, pra não "piscar" azul
// antes do valor real (salvo no banco) chegar.
const noFlashTheme = `(function(){
  try{
    var t=localStorage.getItem('theme');var d=(t!=='light');
    if(d)document.documentElement.classList.add('dark');
    var paletas=${JSON.stringify(PALETAS)};
    var escolhida=localStorage.getItem('paleta')||'azul';
    var p=paletas.find(function(x){return x.id===escolhida})||paletas[0];
    var cores=d?p.escuro:p.claro;
    var el=document.documentElement.style;
    el.setProperty('--c-brand',cores.brand);
    el.setProperty('--c-brand-dark',cores.brandDark);
    el.setProperty('--c-brand-soft',cores.brandSoft);
  }catch(e){document.documentElement.classList.add('dark');}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans">
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
        {children}
      </body>
    </html>
  );
}
