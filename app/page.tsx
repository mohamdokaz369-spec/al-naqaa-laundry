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
    <header className="border-b border-[#d9e7e1] bg-white">
      <nav aria-label="التنقل الرئيسي" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3"><span aria-hidden className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e0f1e9] text-2xl text-[#23735b]">✦</span><span><strong className="block text-xl">النقاء</strong><span className="text-xs tracking-widest text-slate-500">AL NAQAA LAUNDRY</span></span></Link>
        <div className="flex items-center gap-4 text-sm"><Link href="/track-order" className="font-semibold">تتبّع طلبك</Link><Link href="/contact">تواصل معنا</Link></div>
      </nav>
    </header>
    <main id="main-content">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-5 inline-block rounded-full border border-[#cce4d8] bg-[#e7f3ed] px-4 py-2 text-sm text-[#24684f]">مغسلة النقاء · عرابة</p>
          <h1 className="text-4xl font-extrabold leading-[1.5] md:text-6xl">نظافة تريح بالك.<br/><span className="text-[#218066]">ووقتك إلك.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-9 text-slate-600">احجز استلام أغراضك من البيت، وتابع طلبك خطوة بخطوة. نهتم بالغسيل، وإنت بتكمّل يومك براحة.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/request-pickup" className="rounded-2xl bg-cyan-600 px-7 py-4 font-bold">احجز استلام ←</Link><Link href="/track-order" className="rounded-2xl border border-[#cbded5] bg-white px-7 py-4 font-bold">تابع طلبك</Link></div>
          <p className="mt-5 text-sm text-slate-600">بدون إنشاء حساب · الدفع نقدًا عند التسليم</p>
        </div>
        <div className="relative rounded-[2.5rem] border border-[#d7e8df] bg-[#e4f1e9] p-7 md:p-10">
          <div aria-hidden className="mb-8 text-6xl text-[#4a9275]">✦</div>
          <p className="text-sm font-semibold text-[#39705b]">راحة من أول خطوة</p><h2 className="mt-3 text-3xl font-bold leading-relaxed">من باب بيتك،<br/>وبرجع لباب بيتك.</h2>
          <div className="mt-8 space-y-3">{["اختار الخدمة وموعد الاستلام", "الفريق يتواصل معك لتأكيد الموعد", "تابع مراحل الطلب من الموقع"].map((item,i)=><div key={item} className="flex items-center gap-3 rounded-2xl bg-white p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf6f0] text-sm font-bold">{i+1}</span><span className="text-sm">{item}</span></div>)}</div>
          <p className="mt-6 text-sm text-[#39705b]">الاستلام يوميًا <bdi dir="ltr">09:00–18:00</bdi> · الحجز بأي وقت</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16"><div className="mb-7"><p className="text-sm text-[#218066]">عناية لكل قطعة</p><h2 className="mt-2 text-3xl font-bold">شو بدّك ننظّف اليوم؟</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{services.map(([n,title,description])=><Link href="/request-pickup" key={n} className="rounded-3xl border border-[#dbe7e1] bg-white p-6 transition-shadow hover:shadow-lg"><span className="text-sm text-[#49846e]">{n} /</span><h3 className="mt-7 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p><span className="mt-6 inline-block text-sm font-semibold text-[#16745f]">احجز الخدمة ←</span></Link>)}</div></section>
      <section className="mx-auto mb-16 max-w-6xl px-5"><div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-[#cfe5d8] bg-[#e8f3ec] p-7 md:p-10"><div><h2 className="text-2xl font-bold">عندك سؤال قبل الحجز؟</h2><p className="mt-3 leading-7 text-slate-600">الإدارة بتحدّد سعر طلبك حسب القطع والخدمة، وبتأكد المبلغ معك.</p></div><a href={businessWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-cyan-600 px-6 py-4 font-bold">تواصل على واتساب ↗</a></div></section>
    </main>
    <footer className="border-t border-[#d9e7e1] bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-8 text-sm"><p>مغسلة النقاء · عرابة</p><div className="flex flex-wrap gap-5"><Link href="/contact">التواصل والدوام</Link><Link href="/privacy">الخصوصية</Link><Link href="/admin/login">الإدارة</Link><Link href="/driver/login">السائقون</Link></div></div></footer>
  </div>;
}
