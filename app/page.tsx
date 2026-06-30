import Link from "next/link";

export default function HomePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <div>
          <h1 className="text-2xl font-bold">مغسلة النقاء</h1>
          <p className="text-sm text-cyan-300">Al Naqaa Laundry</p>
        </div>

        <nav className="flex gap-4 text-sm">
          <Link href="/request-pickup" className="hover:text-cyan-300">
            اطلب استلام
          </Link>
          <Link href="/track-order" className="hover:text-cyan-300">
            تتبع طلبك
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="mb-4 inline-block rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-200">
          خدمة استلام وتسليم الملابس
        </p>

        <h2 className="mx-auto max-w-3xl text-5xl font-bold leading-tight md:text-7xl">
          ملابسك نظيفة
          <br />
          وعلى بابك
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
          اطلب استلام الملابس من بيتك، تابع حالة الطلب برقم التتبع، واستلمها
          نظيفة وجاهزة في الوقت المحدد.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/request-pickup"
            className="rounded-full bg-cyan-600 px-8 py-4 font-bold text-white hover:bg-cyan-500"
          >
            اطلب استلام الآن
          </Link>

          <Link
            href="/track-order"
            className="rounded-full border border-white/30 px-8 py-4 font-bold hover:bg-white/10"
          >
            تتبع طلبك
          </Link>
        </div>

        <section className="mt-24 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-6">
            <h3 className="mb-2 text-xl font-bold">استلام من الباب</h3>
            <p className="text-slate-300">
              نأتي لاستلام الملابس من العنوان الذي تحدده.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-6">
            <h3 className="mb-2 text-xl font-bold">تتبع الطلب</h3>
            <p className="text-slate-300">
              استخدم رقم الطلب لمعرفة حالة الغسيل والتسليم.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 p-6">
            <h3 className="mb-2 text-xl font-bold">تواصل واتساب</h3>
            <p className="text-slate-300">
              تواصل سريع مع المغسلة عند الحاجة.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}