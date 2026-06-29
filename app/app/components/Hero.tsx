export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1a5f7a] via-[#159895] to-[#57c5b6]">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-white blur-3xl" />
      </div>

      <div className="relative z-10 text-center text-white px-4 max-w-3xl mx-auto">
        <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          مغسلة النقاء · عرابة، إسرائيل
        </div>

        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
          ملابسك نظيفة
          <br />
          <span className="text-[#b2f7ef]">وعلى بابك</span>
        </h1>

        <p className="text-lg md:text-xl text-white/85 mb-8 leading-relaxed">
          خدمة غسيل ملابس احترافية مع الاستلام والتوصيل إلى باب منزلك.
          <br />
          جودة عالية، سرعة في الإنجاز، وأسعار مناسبة.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/972000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-[#1a5f7a] font-bold px-8 py-3.5 rounded-full hover:bg-[#b2f7ef] transition-colors shadow-lg text-base"
          >
            اطلب الاستلام الآن
          </a>
          <a
            href="#services"
            className="border-2 border-white text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/15 transition-colors text-base"
          >
            تعرف على خدماتنا
          </a>
        </div>
      </div>

      <a
        href="#services"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 animate-bounce"
        aria-label="مزيد من المعلومات"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}
