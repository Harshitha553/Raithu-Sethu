import { useState, useEffect } from "react";
import Button from "../common/Button";
import { Field, Input, TextArea, Select } from "../common/Field";
import { CROP_CATEGORIES, CROP_UNITS } from "../../utils/format";

export default function CropForm({ initial, onSubmit, loading, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "kg",
    price_per_unit: "",
    description: "",
    location: "",
    harvest_date: "",
    expiry_date: "",
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || "",
        category: initial.category || "",
        quantity: initial.quantity?.toString() || "",
        unit: initial.unit || "kg",
        price_per_unit: initial.price_per_unit?.toString() || "",
        description: initial.description || "",
        location: initial.location || "",
        harvest_date: initial.harvest_date?.slice(0, 10) || "",
        expiry_date: initial.expiry_date?.slice(0, 10) || "",
      });
    }
  }, [initial]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      unit: form.unit,
      price_per_unit: Number(form.price_per_unit),
      description: form.description || undefined,
      location: form.location,
      harvest_date: form.harvest_date ? new Date(form.harvest_date).toISOString() : undefined,
      expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Crop Name" required>
          <Input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Basmati Rice" required />
        </Field>
        <Field label="Category" required>
          <Select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Select category</option>
            {CROP_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Quantity" required>
          <Input type="number" name="quantity" value={form.quantity} onChange={handleChange} placeholder="0" min="0" step="any" required />
        </Field>
        <Field label="Unit" required>
          <Select name="unit" value={form.unit} onChange={handleChange}>
            {CROP_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </Select>
        </Field>
        <Field label="Price per Unit (₹)" required>
          <Input type="number" name="price_per_unit" value={form.price_per_unit} onChange={handleChange} placeholder="0" min="0" step="any" required />
        </Field>
      </div>

      <Field label="Location" required>
        <Input name="location" value={form.location} onChange={handleChange} placeholder="District, State" required />
      </Field>

      <Field label="Description" hint="Optional details about your crop">
        <TextArea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Organic, freshly harvested, etc." />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Harvest Date" hint="Optional">
          <Input type="date" name="harvest_date" value={form.harvest_date} onChange={handleChange} />
        </Field>
        <Field label="Expiry Date" hint="Crop will auto-expire after this">
          <Input type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {initial ? "Update Crop" : "List Crop"}
        </Button>
      </div>
    </form>
  );
}
