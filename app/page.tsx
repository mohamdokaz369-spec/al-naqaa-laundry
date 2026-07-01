import Link from "next/link";

export default function HomePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#070d1a] text-white" style={{ fontFamily: "var(--font-cairo), Arial, sans-serif" }}>

      {/* ─── NAV ──────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#070d1a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold tracking-tight">مغسلة النقاء</span>
            <span className="hidden text-xs text-cyan-400/70 sm:inline">Al Naqaa Laundry</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/track-order" className="hidden rounded-full px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white sm:block">
              تتبع طلبك
            </Link>
            <Link href="/request-pickup" className="rounded-full bg-cyan-600 px-5 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all hover:bg-cyan-500">
              اطلب الآن
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#070d1a] via-[#0a1628] to-[#070d1a]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(6,182,212,0.13) 0%, transparent 70%)" }} />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Decorative orbs */}
        <div className="absolute -top-32 right-1/3 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 h-72 w-72 rounded-full bg-blue-600/5 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            خدمة متاحة الآن · عرابة والمنطقة
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.2] tracking-tight md:text-7xl">
            مغسلة النقاء
            <br />
            <span className="bg-gradient-to-l from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              نستلم... ننظف... ونعيدها إليك
            </span>
            <br />
            <span className="text-4xl font-bold text-slate-200 md:text-5xl">بأفضل صورة</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
            خدمة استلام وتوصيل احترافية مع متابعة الطلب لحظة بلحظة وجودة تنظيف نهتم بها كما لو كانت ملابسنا.
          </p>

          {/* CTA buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/request-pickup"
              className="flex items-center gap-3 rounded-full bg-cyan-600 px-9 py-4 text-lg font-bold text-white shadow-[0_0_35px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-500 hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]"
            >
              اطلب استلام الآن
              <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L6 12m0 0l7.5 7.5M6 12h12" />
              </svg>
            </Link>
            <Link
              href="/track-order"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-9 py-4 text-lg font-bold backdrop-blur-sm transition-all hover:border-white/35 hover:bg-white/10"
            >
              تتبع طلبك
            </Link>
          </div>

          {/* Trust bar */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
            {["استلام من الباب للباب", "تتبع فوري للطلب", "جودة تنظيف مضمونة", "مواعيد منظمة ودقيقة"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <svg className="h-4 w-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ────────────────────────────────────────────────────── */}
      <section className="bg-[#070d1a] py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">لماذا تختار نقاء؟</p>
            <h2 className="text-3xl font-extrabold md:text-5xl">خدمة تستحق ثقتك</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">نؤمن أن الجودة تبدأ من التفاصيل — من لحظة الاستلام حتى إعادة التوصيل</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                ),
                title: "استلام وتوصيل من الباب للباب",
                desc: "نأتي إليك في الوقت المحدد ونعيد الملابس نظيفة مباشرة لباب بيتك دون أي جهد منك.",
                accent: "text-cyan-400",
                glow: "bg-cyan-500/10 border-cyan-500/20",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                ),
                title: "متابعة الطلب خطوة بخطوة",
                desc: "تتبع طلبك لحظياً — من الاستلام حتى التنظيف والتوصيل بشفافية كاملة.",
                accent: "text-blue-400",
                glow: "bg-blue-500/10 border-blue-500/20",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "مواعيد دقيقة ومنظمة",
                desc: "نلتزم بالمواعيد المحددة ونُعلمك مسبقاً عند أي تغيير مع تتبع السائق في الوقت الحقيقي.",
                accent: "text-violet-400",
                glow: "bg-violet-500/10 border-violet-500/20",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                title: "عناية خاصة بالملابس الحساسة",
                desc: "نتعامل مع كل قطعة بالطريقة المناسبة وفق نوع القماش ومتطلبات التنظيف.",
                accent: "text-emerald-400",
                glow: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
                  </svg>
                ),
                title: "تنظيف احترافي وتجفيف آمن",
                desc: "تقنيات حديثة تضمن نتائج مثالية دون الإضرار بجودة القماش أو ألوانه.",
                accent: "text-amber-400",
                glow: "bg-amber-500/10 border-amber-500/20",
              },
              {
                icon: (
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                ),
                title: "فريق خدمة موثوق",
                desc: "فريق متخصص يحرص على راحتك وسلامة ملابسك في كل زيارة مع أعلى معايير الأمانة.",
                accent: "text-rose-400",
                glow: "bg-rose-500/10 border-rose-500/20",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-2xl border ${f.glow} p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className={`mb-5 inline-flex rounded-xl p-3 ${f.glow} ${f.accent}`}>
                  {f.icon}
                </div>
                <h3 className="mb-3 text-lg font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─────────────────────────────────────────────────────────── */}
      <section className="py-28" style={{ background: "linear-gradient(180deg, #070d1a 0%, #0a1226 50%, #070d1a 100%)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">خدماتنا</p>
            <h2 className="text-3xl font-extrabold md:text-5xl">كل ما تحتاجه في مكان واحد</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">طيف كامل من خدمات التنظيف الاحترافي لملابسك ومفروشاتك</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                emoji: "👕",
                title: "غسيل وكي الملابس",
                desc: "غسيل احترافي بمواد عالية الجودة وكي متقن يُعيد الملابس إلى أفضل حالاتها في كل مرة.",
                tag: "الأكثر طلباً",
                tagClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
              },
              {
                emoji: "🧥",
                title: "تنظيف الملابس الحساسة",
                desc: "عناية خاصة بالملابس الرسمية والحساسة كالبدل والفساتين والقطع الفاخرة.",
                tag: null,
                tagClass: "",
              },
              {
                emoji: "🛏️",
                title: "غسيل البطانيات والمفروشات",
                desc: "تنظيف عميق للبطانيات والوسائد والمفروشات مع ضمان تجفيف كامل وآمن.",
                tag: null,
                tagClass: "",
              },
              {
                emoji: "🏠",
                title: "غسيل السجاد بماكينة Full Automatic",
                desc: "نظام غسيل أوتوماتيكي متطور للسجاد — تنظيف عميق، إزالة أتربة وروائح، نتائج متجانسة.",
                tag: "تقنية متطورة",
                tagClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
              },
              {
                emoji: "🚗",
                title: "استلام وتوصيل للمنزل",
                desc: "نأتي إليك في الوقت المحدد ونعيد ملابسك نظيفة ومرتبة مباشرة لباب منزلك.",
                tag: "متضمن",
                tagClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-7 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:bg-white/6 hover:-translate-y-1"
              >
                {s.tag && (
                  <span className={`mb-5 inline-block rounded-full border px-3 py-1 text-xs font-bold ${s.tagClass}`}>
                    {s.tag}
                  </span>
                )}
                {!s.tag && <div className="mb-5 h-7" />}
                <div className="mb-4 text-4xl">{s.emoji}</div>
                <h3 className="mb-3 text-lg font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CARPET SECTION ───────────────────────────────────────────────────── */}
      <section className="bg-[#070d1a] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-[#0a1628] via-[#0c1e3a] to-[#0a1628]" style={{ boxShadow: "inset 0 0 80px rgba(6,182,212,0.05)" }}>
            <div className="grid items-center gap-0 lg:grid-cols-2">
              {/* Text side */}
              <div className="p-10 md:p-14">
                <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">خدمة مميزة</p>
                <h2 className="mb-6 text-3xl font-extrabold leading-tight md:text-4xl">
                  غسيل السجاد بتقنية
                  <br />
                  <span className="bg-gradient-to-l from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Full Automatic
                  </span>
                </h2>
                <p className="mb-8 text-base leading-relaxed text-slate-300 md:text-lg">
                  نعتمد على نظام غسيل أوتوماتيكي متطور يمنح السجاد عناية متكاملة من التنظيف العميق وحتى إزالة الأتربة والروائح، للحصول على نتائج نظيفة ومتجانسة تحافظ على جودة السجاد ومظهره.
                </p>
                <ul className="space-y-4">
                  {[
                    "تنظيف عميق للألياف",
                    "إزالة الروائح والأوساخ المتراكمة",
                    "نتائج متجانسة على كامل السجادة",
                    "تجفيف أكثر كفاءة",
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-slate-200">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                        ✓
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/request-pickup"
                  className="mt-10 inline-flex items-center gap-2 rounded-full bg-cyan-600 px-8 py-3.5 font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all hover:bg-cyan-500"
                >
                  اطلب غسيل السجاد الآن
                  <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L6 12m0 0l7.5 7.5M6 12h12" />
                  </svg>
                </Link>
              </div>

              {/* Visual side */}
              <div className="relative flex min-h-72 items-center justify-center border-t border-white/5 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-10 lg:border-t-0 lg:border-r lg:min-h-full">
                <div className="text-center">
                  <div className="mb-8 text-8xl">🏠</div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { num: "تنظيف", label: "عميق للألياف", color: "text-cyan-400" },
                      { num: "إزالة", label: "الروائح والأوساخ", color: "text-blue-400" },
                      { num: "نتائج", label: "متجانسة وممتازة", color: "text-emerald-400" },
                      { num: "تجفيف", label: "آمن وكفء", color: "text-amber-400" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-white/8 bg-black/30 p-4 text-center backdrop-blur-sm">
                        <p className={`text-lg font-extrabold ${s.color}`}>{s.num}</p>
                        <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-28" style={{ background: "linear-gradient(180deg, #070d1a 0%, #0a1226 60%, #070d1a 100%)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-400">طريقة العمل</p>
            <h2 className="text-3xl font-extrabold md:text-5xl">أربع خطوات بسيطة</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">من لحظة الطلب حتى استلام ملابسك نظيفة ومكوية</p>
          </div>

          <div className="relative grid gap-10 md:grid-cols-4">
            {/* Connecting line */}
            <div className="absolute top-10 left-[12.5%] right-[12.5%] hidden h-px bg-gradient-to-l from-transparent via-cyan-500/25 to-transparent md:block" />

            {[
              { step: "1", title: "احجز الطلب", desc: "اختر الخدمة وحدد الموعد المناسب عبر النموذج", emoji: "📋" },
              { step: "2", title: "نستلم القطع", desc: "يصل سائقنا إلى موقعك في الوقت المحدد بدقة", emoji: "🚗" },
              { step: "3", title: "تنظيف احترافي", desc: "نُنظف ملابسك بعناية ووفق أعلى معايير الجودة", emoji: "✨" },
              { step: "4", title: "إعادة التوصيل", desc: "نعيد ملابسك نظيفة ومرتبة مباشرة إلى بابك", emoji: "📦" },
            ].map((s) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="relative mb-7 flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 to-blue-600/10">
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-600 text-xs font-extrabold text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                    {s.step}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/request-pickup"
              className="inline-flex items-center gap-3 rounded-full bg-cyan-600 px-9 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all hover:bg-cyan-500 hover:shadow-[0_0_45px_rgba(6,182,212,0.45)]"
            >
              ابدأ الآن
              <svg className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L6 12m0 0l7.5 7.5M6 12h12" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#070d1a] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-white/3 p-12 backdrop-blur-sm">
            <div className="mb-10 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-cyan-400">أرقامنا تتحدث</p>
              <h2 className="text-2xl font-extrabold md:text-3xl">ثقة مئات العملاء في عرابة والمنطقة</h2>
            </div>
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              {[
                { value: "+1000", label: "طلب مكتمل", color: "text-cyan-400", glow: "rgba(6,182,212,0.15)" },
                { value: "+500", label: "عميل راضٍ", color: "text-blue-400", glow: "rgba(59,130,246,0.15)" },
                { value: "98%", label: "رضا العملاء", color: "text-emerald-400", glow: "rgba(16,185,129,0.15)" },
                { value: "⚡", label: "خدمة سريعة ومنظمة", color: "text-amber-400", glow: "rgba(245,158,11,0.15)" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-3">
                  <span
                    className={`text-5xl font-extrabold md:text-6xl ${s.color}`}
                    style={{ textShadow: `0 0 40px ${s.glow}` }}
                  >
                    {s.value}
                  </span>
                  <span className="text-sm text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#070d1a] via-[#0a1628] to-[#070d1a]" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-400">هل أنت مستعد؟</p>
          <h2 className="mb-6 text-4xl font-extrabold leading-tight md:text-6xl">
            جاهز لطلب الاستلام؟
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-slate-400">
            انضم إلى مئات العملاء الذين يثقون في مغسلة النقاء لتنظيف ملابسهم بالجودة التي يستحقونها.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/request-pickup"
              className="flex items-center gap-3 rounded-full bg-cyan-600 px-10 py-5 text-xl font-extrabold text-white shadow-[0_0_50px_rgba(6,182,212,0.35)] transition-all hover:bg-cyan-500 hover:shadow-[0_0_70px_rgba(6,182,212,0.55)]"
            >
              اطلب استلام الآن
            </Link>
            <Link
              href="/track-order"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-10 py-5 text-xl font-bold backdrop-blur-sm transition-all hover:border-white/35 hover:bg-white/10"
            >
              تتبع طلبك
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-[#070d1a] py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-right">
            <div>
              <p className="text-lg font-extrabold">مغسلة النقاء</p>
              <p className="text-xs text-slate-500">Al Naqaa Laundry · عرابة والمنطقة</p>
            </div>
            <div className="flex gap-8 text-sm text-slate-500">
              <Link href="/request-pickup" className="transition-colors hover:text-slate-200">اطلب استلام</Link>
              <Link href="/track-order" className="transition-colors hover:text-slate-200">تتبع الطلب</Link>
            </div>
            <p className="text-xs text-slate-700">© 2026 جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
