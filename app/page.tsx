import Image from "next/image";
import Link from "next/link";
import { businessWhatsAppUrl } from "@/lib/whatsapp";

const services = [
  ["01", "غسيل وكي", "عناية بملابسك اليومية، من الاستلام لحد التسليم."],
  ["02", "تنظيف جاف", "عناية بالقطع اللي بتحتاج اهتمام خاص."],
  ["03", "غسيل السجاد", "غسيل السجاد بماكينة Full Automatic."],
  ["04", "بطانيات ومفروشات", "نظافة وانتعاش لقطع البيت الكبيرة."],
];
export default function HomePage() {
  return <div className="min-h-screen">
    <header className="border-b border-[#e6dac8] bg-white">
      <nav aria-label="التنقل الرئيسي" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3"><span aria-hidden className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f2e7d6] text-2xl text-[#152238]">✦</span><span><strong className="block text-xl">النقاء</strong><span className="text-xs tracking-widest text-slate-500">AL NAQAA LAUNDRY</span></span></Link>
        <div className="flex items-center gap-4 text-sm"><Link href="/track-order" className="font-semibold">تتبّع طلبك</Link><Link href="/contact">تواصل معنا</Link></div>
      </nav>
    </header>
    <main id="main-content">
      <section className="bg-[#101c2c] text-[#faf7f0]">
        <div className="mx-auto grid max-w-6xl items-center gap-9 px-5 py-10 md:grid-cols-[1fr_0.85fr] md:gap-16 md:py-16">
          <div className="max-w-xl">
            <p className="mb-5 inline-block border-b border-[#c5a574] pb-3 text-sm text-[#dfc6a1]">مغسلة النقاء · عرابة</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-6xl">غسيلك علينا</h1>
            <p className="mt-4 text-2xl text-[#dfc6a1] sm:text-3xl">من الاستلام للتسليم</p>
            <p className="mt-5 max-w-md text-base leading-8 text-[#e4ddd2]">احجز استلام أغراضك من البيت وتابع حالة طلبك من الموقع.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/request-pickup" className="rounded-lg bg-[#e0c69e] px-6 py-3.5 font-bold text-[#152238] hover:bg-[#efdbba]">احجز استلام</Link>
              <Link href="/track-order" className="rounded-lg border border-[#bba580] px-6 py-3.5 font-bold hover:bg-[#24334a]">تتبّع طلبك</Link>
            </div>
            <p className="mt-5 text-sm leading-7 text-[#e4ddd2]">بدون إنشاء حساب · الدفع نقدًا عند التسليم<br/>الاستلام يوميًا <bdi dir="ltr">09:00–18:00</bdi> · الحجز بأي وقت</p>
          </div>
          <Image
            src="/naqaa-editorial.png"
            alt=""
            width={1122}
            height={1402}
            sizes="(max-width: 767px) 85vw, 420px"
            preload
            className="mx-auto h-auto w-full max-w-[400px] border border-[#c5a574]/40"
          />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-14"><div className="mb-7"><p className="text-sm text-[#735733]">عناية لكل قطعة</p><h2 className="mt-2 text-3xl font-bold">شو بدّك ننظّف اليوم؟</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map(([n,title,description])=><Link href="/request-pickup" key={n} className="rounded-3xl border border-[#e6dac8] bg-white p-6 transition-shadow hover:shadow-lg"><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p><span className="mt-6 inline-block text-sm font-semibold text-[#152238]">احجز الخدمة ←</span></Link>)}</div></section>
      <section className="mx-auto mb-16 max-w-6xl px-5"><div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-[#e6dac8] bg-[#f2e7d6] p-7 md:p-10"><div><h2 className="text-2xl font-bold">عندك سؤال قبل الحجز؟</h2><p className="mt-3 leading-7 text-slate-600">الإدارة بتحدّد سعر طلبك حسب القطع والخدمة، وبتأكد المبلغ معك.</p></div><a href={businessWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-cyan-600 px-6 py-4 font-bold">تواصل على واتساب ↗</a></div></section>
    </main>
    <footer className="border-t border-[#e6dac8] bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-8 text-sm"><p>مغسلة النقاء · عرابة</p><div className="flex flex-wrap gap-5"><Link href="/contact">التواصل والدوام</Link><Link href="/privacy">الخصوصية</Link><Link href="/admin/login">الإدارة</Link><Link href="/driver/login">السائقون</Link></div></div></footer>
  </div>;
}
