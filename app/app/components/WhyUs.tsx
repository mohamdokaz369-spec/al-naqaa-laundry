const reasons = [
  {
    icon: "🚗",
    title: "استلام وتوصيل مجاني",
    description: "نأتي إليك لاستلام ملابسك وإيصالها بعد التنظيف إلى باب منزلك.",
  },
  {
    icon: "⚡",
    title: "سرعة في الإنجاز",
    description: "خدمة سريعة في أوقات قياسية دون التنازل عن الجودة.",
  },
  {
    icon: "🌿",
    title: "منظفات آمنة وصديقة للبيئة",
    description: "نستخدم منظفات عالية الجودة آمنة على البشرة والبيئة.",
  },
  {
    icon: "💎",
    title: "جودة مضمونة",
    description: "نضمن رضاك التام أو نُعيد التنظيف مجاناً.",
  },
];

export default function WhyUs() {
  return (
    <section id="why-us" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#57c5b6] font-semibold text-sm uppercase tracking-widest">لماذا نحن</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a5f7a] mt-2">
            ثق بالأفضل
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            نهتم بتفاصيلك ونسعى دائماً لتقديم تجربة استثنائية
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="flex gap-4 items-start bg-[#f0fafa] rounded-2xl p-6 border border-[#e0f5f5]"
            >
              <div className="text-3xl shrink-0">{reason.icon}</div>
              <div>
                <h3 className="font-bold text-[#1a5f7a] mb-1">{reason.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{reason.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
