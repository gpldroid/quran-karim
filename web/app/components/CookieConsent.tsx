"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "wow_privacy_consent_v1";
const COOKIE_KEY = "wow_privacy_consent_v1";
const DELAY_MS = 1800;

type Consent = { version: 1; necessary: true; analytics: boolean; ads: boolean; updatedAt: string };

function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (value?.version !== 1) return null;
    return { version: 1, necessary: true, analytics: value.analytics === true, ads: value.ads === true, updatedAt: value.updatedAt || "" };
  } catch { return null; }
}

function persistConsent(analytics: boolean, ads: boolean) {
  const consent: Consent = { version: 1, necessary: true, analytics, ads, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = COOKIE_KEY + "=" + encodeURIComponent(JSON.stringify(consent)) + "; Max-Age=" + maxAge + "; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  window.dispatchEvent(new CustomEvent("wow:consent-changed", { detail: consent }));
  return consent;
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    const current = readConsent();
    if (current) {
      setAnalytics(current.analytics);
      setAds(current.ads);
      return;
    }
    const timer = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const showManager = () => {
    const current = readConsent();
    setAnalytics(current?.analytics === true);
    setAds(current?.ads === true);
    setManage(true);
    setOpen(true);
  };

  const save = (nextAnalytics: boolean, nextAds: boolean) => {
    persistConsent(nextAnalytics, nextAds);
    setOpen(false);
    setManage(false);
  };

  return <>
    {!open && <button className="wow-consent-manage" type="button" onClick={showManager}>إدارة الخصوصية</button>}
    {open && <div className="wow-consent-backdrop" role="presentation" onClick={() => manage && setOpen(false)}>
      <section className="wow-consent-panel" role="dialog" aria-modal="true" aria-labelledby="wow-consent-title" onClick={e => e.stopPropagation()}>
        <span className="wow-consent-accent" aria-hidden="true" />
        <h2 id="wow-consent-title">الخصوصية وملفات تعريف الارتباط</h2>
        <p>نستخدم التقنيات الضرورية لتشغيل الموقع وحفظ تفضيلاتك. التحليلات والإعلانات اختيارية ولا يتم تفعيلها قبل اختيارك.</p>
        <div className="wow-consent-grid">
          <label className="wow-consent-option"><span><strong>ضرورية</strong><small>مطلوبة لتشغيل الموقع وحفظ اختيار الخصوصية.</small></span><input type="checkbox" checked disabled /></label>
          <label className="wow-consent-option"><span><strong>تحليلات</strong><small>تساعد على فهم الاستخدام وتحسين الأداء.</small></span><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} /></label>
          <label className="wow-consent-option"><span><strong>إعلانات</strong><small>تسمح بتشغيل الإعلانات والخدمات المرتبطة بها.</small></span><input type="checkbox" checked={ads} onChange={e => setAds(e.target.checked)} /></label>
        </div>
        <div className="wow-consent-actions">
          <button className="wow-consent-primary" type="button" onClick={() => save(true, true)}>السماح بالكل</button>
          <button className="wow-consent-secondary" type="button" onClick={() => save(false, false)}>الضرورية فقط</button>
          <button className="wow-consent-secondary" type="button" onClick={() => save(analytics, ads)}>{manage ? "حفظ التفضيلات" : "تخصيص وحفظ"}</button>
        </div>
      </section>
    </div>}
  </>;
}
