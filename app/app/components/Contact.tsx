export default function Contact() {
  return (
    <section id="contact" className="py-20 px-4 bg-[#f0fafa]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#57c5b6] font-semibold text-sm uppercase tracking-widest">تواصل معنا</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a5f7a] mt-2">
            نحن هنا لخدمتك
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-[#e0f5f5]">
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-bold text-[#1a5f7a] mb-1">الموقع</h3>
            <p className="text-gray-500 text-sm">عرابة، إسرائيل</p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-[#e0f5f5]">
            <div className="text-3xl mb-3">📞</div>
            <h3 className="font-bold text-[#1a5f7a] mb-1">اتصل بنا</h3>
            <a
              href="tel:+972000000000"
              className="text-[#159895] text-sm hover:underline"
            >
              000-000-0000
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-[#e0f5f5]">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold text-[#1a5f7a] mb-1">واتساب</h3>
            <a
              href="https://wa.me/972000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#159895] text-sm hover:underline"
            >
              راسلنا على واتساب
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
