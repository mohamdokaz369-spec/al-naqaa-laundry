"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RequestPickupPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [lastOrderNumber, setLastOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const submitOrder = async () => {
    setLoading(true);
    setLastOrderNumber("");

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName,
          phone,
          address,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          service_type: "pickup_request",
          status: "pending",
        },
      ])
      .select("id")
      .single();

    if (error) {
      setLoading(false);
      alert("صار خطأ: " + error.message);
      return;
    }

    const orderNumber = `NQ-${data.id}`;

    const { error: updateError } = await supabase
      .from("orders")
      .update({ order_number: orderNumber })
      .eq("id", data.id);

    setLoading(false);

    if (updateError) {
      alert("تم إنشاء الطلب لكن صار خطأ برقم الطلب: " + updateError.message);
      return;
    }

    setLastOrderNumber(orderNumber);
    alert(`تم إرسال الطلب بنجاح\nرقم الطلب: ${orderNumber}`);

    setCustomerName("");
    setPhone("");
    setAddress("");
    setPickupDate("");
    setPickupTime("");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white/10 p-6">
        <h1 className="mb-6 text-3xl font-bold">طلب استلام من مغسلة النقاء</h1>

        {lastOrderNumber && (
          <div className="mb-4 rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-300">
            تم إرسال الطلب بنجاح.
            <br />
            رقم طلبك: <b>{lastOrderNumber}</b>
            <br />
            احتفظ بهذا الرقم لتتبع الطلب.
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input className="rounded-lg border border-white/20 bg-transparent p-3" placeholder="الاسم الكامل" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input className="rounded-lg border border-white/20 bg-transparent p-3" placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="rounded-lg border border-white/20 bg-transparent p-3" placeholder="العنوان" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input type="date" className="rounded-lg border border-white/20 bg-transparent p-3" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
          <input type="time" className="rounded-lg border border-white/20 bg-transparent p-3" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />

          <button onClick={submitOrder} disabled={loading} className="rounded-lg bg-cyan-600 p-3 font-bold text-white disabled:opacity-50">
            {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}