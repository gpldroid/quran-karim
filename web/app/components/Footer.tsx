import { Github, Globe, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section>
          <h2 className="footer-brand">عماد الدين لمراني للقرآن الكريم</h2>
          <p>منصة لقراءة القرآن الكريم والاستماع إلى التلاوات، مع محتوى إسلامي مساعد للقراءة والتدبر.</p>
        </section>
        <section>
          <h3>روابط مهمة</h3>
          <ul>
            <li><a href="/">الرئيسية</a></li>
            <li><a href="/about.html">من نحن</a></li>
            <li><a href="/contact.html">اتصل بنا</a></li>
          </ul>
        </section>
        <section>
          <h3>Legal Pages</h3>
          <ul>
            <li><a href="/privacy.html">سياسة الخصوصية</a></li>
            <li><a href="/terms.html">الشروط والأحكام</a></li>
            <li><a href="/cookies.html">سياسة ملفات تعريف الارتباط</a></li>
          </ul>
        </section>
        <section className="footer-social">
          <h3>تواصل معنا</h3>
          <div className="social-links" aria-label="روابط التواصل">
            <a href="/contact.html" aria-label="صفحة اتصل بنا" title="اتصل بنا"><Mail size={18} /></a>
            <a href="https://github.com/gpldroid/wow" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub"><Github size={18} /></a>
            <a href="/about.html" aria-label="عن الموقع" title="عن الموقع"><Globe size={18} /></a>
          </div>
        </section>
      </div>
      <div className="copyright">© 2026 عماد الدين لمراني</div>
    </footer>
  );
}
