export default function Footer() {
  return (
    <footer className="bg-[#1a5f7a] text-white py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-right">
        <div>
          <div className="text-xl font-bold">مغسلة النقاء</div>
          <div className="text-[#57c5b6] text-sm">AL Naqaa Laundry</div>
          <p className="text-white/60 text-xs mt-1">عرابة، إسرائيل</p>
        </div>

        <div className="flex gap-6 text-sm text-white/75">
          <a href="#services" className="hover:text-white transition-colors">خدماتنا</a>
          <a href="#why-us" className="hover:text-white transition-colors">لماذا نحن</a>
          <a href="#contact" className="hover:text-white transition-colors">تواصل معنا</a>
        </div>
      </div>

      <div className="border-t border-white/15 mt-8 pt-4 text-center text-white/40 text-xs">
        © {new Date().getFullYear()} مغسلة النقاء. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
