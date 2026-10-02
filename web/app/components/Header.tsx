"use client";

import { useState } from "react";
import { Menu, X, Home, CircleInfo, Mail, ShieldCheck, FileText, Cookie } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const links = [
    ["/", "الرئيسية", Home],
    ["/about.html", "من نحن", CircleInfo],
    ["/contact.html", "اتصل بنا", Mail],
    ["/privacy.html", "الخصوصية", ShieldCheck],
    ["/terms.html", "الشروط", FileText],
    ["/cookies.html", "الكوكيز", Cookie],
  ] as const;

  return (
    <header className="site-header">
      <div className="header-content">
        <a className="logo" href="/">
          <img src="/wow/logo.svg" alt="شعار القرآن الكريم" loading="eager" />
          <h1>قراءة و الإستماع للقران الكريم</h1>
        </a>
        <button
          className="nav-toggle"
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"}
          aria-controls="navLinks"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <ul className={open ? "nav-links active" : "nav-links"} id="navLinks">
          {links.map(([href, label, Icon]) => (
            <li key={href}>
              <a href={href} onClick={() => setOpen(false)}>
                <Icon size={16} aria-hidden="true" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
