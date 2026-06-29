"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function submitOrder() {
    const { error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: customerName,
          phone,
          address,
          status: "pending",
        },
      ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Order submitted successfully!");
    }
  }

  return (
    <div className="p-10 flex flex-col gap-4 max-w-md">
      <h1 className="text-3xl font-bold">Al Naqaa Laundry</h1>

      <input
        className="border p-2"
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      <input
        className="border p-2"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <input
        className="border p-2"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button
        onClick={submitOrder}
        className="bg-blue-600 text-white p-2 rounded"
      >
        Submit Order
      </button>
    </div>
  );
}