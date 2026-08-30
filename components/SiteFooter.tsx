"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 内测/商用阶段的法务入口：用户协议与隐私政策。
// 商用上线前需把【待补充】的运营主体信息补齐，并完成 ICP 备案。
const links = [
  { href: "/", label: "首页" },
  { href: "/terms", label: "用户协议" },
  { href: "/privacy", label: "隐私政策" },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-5xl gap-5 px-4 py-6 text-sm text-slate-500">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "font-medium text-accent" : "hover:text-accent"}
          >
            {link.label}
          </Link>
        ))}
        <span className="ml-auto">© {new Date().getFullYear()} Intent2Prompt</span>
      </div>
    </footer>
  );
}
