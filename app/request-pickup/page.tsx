"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RequestPickupPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const submitOrder = async () => {
    setLoading(true);

    const { error } = await supabase.from("orders").insert([
      {
        customer_name: customerName,
        phone,
        address,
        service_type: "pickup_request",
        status: "pending",
      },
    ]);

    setLoading(false);

    if (error) {
      alert("صار خطأ: " + error.message);
      return;
    }

    alert("تم إرسال الطلب بنجاح");
    setCustomerName("");
    setPhone("");
    setAddress("");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white/10 p-6">
        <h1 className="mb-6 text-3xl font-bold">طلب استلام من مغسلة النقاء</h1>

        <div className="flex flex-col gap-4">
          <input
            className="rounded-lg border border-white/20 bg-transparent p-3"
            placeholder="الاسم الكامل"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className="rounded-lg border border-white/20 bg-transparent p-3"
            placeholder="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <input
            className="rounded-lg border border-white/20 bg-transparent p-3"
            placeholder="العنوان"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <button
            onClick={submitOrder}
            disabled={loading}
            className="rounded-lg bg-cyan-600 p-3 font-bold text-white disabled:opacity-50"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}