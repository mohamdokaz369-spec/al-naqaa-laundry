const services = [
  {
    icon: "👕",
    title: "غسيل الملابس",
    description: "غسيل يومي احترافي لجميع أنواع الملابس بمنظفات عالية الجودة.",
  },
  {
    icon: "✨",
    title: "التنظيف الجاف",
    description: "تنظيف جاف لقطع الملابس الحساسة والفاخرة بأحدث التقنيات.",
  },
  {
    icon: "🏠",
    title: "تنظيف السجاد",
    description: "غسيل سجاد عميق يُزيل الأوساخ والبقع ويُعيد اللمعان.",
  },
  {
    icon: "🛋️",
    title: "تنظيف الكنبات",
    description: "تنظيف مفروشات وكنبات بأساليب متخصصة تُطيل عمرها.",
  },
  {
    icon: "🛏️",
    title: "غسيل البطانيات",
    description: "غسيل بطانيات ولحاف بمعدات كبيرة الحجم لنتيجة مثالية.",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 px-4 bg-[#f0fafa]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[#57c5b6] font-semibold text-sm uppercase tracking-widest">خدماتنا</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a5f7a] mt-2">
            كل ما تحتاجه في مكان واحد
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            نقدم خدمات تنظيف شاملة لجميع احتياجاتك المنزلية والشخصية
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#e0f5f5] group"
            >
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-lg font-bold text-[#1a5f7a] mb-2 group-hover:text-[#159895] transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
