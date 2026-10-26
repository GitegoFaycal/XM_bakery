import { useEffect, useState } from 'react';
import Input from './ui/Input.jsx';
import Button from './ui/Button.jsx';

const EMPTY = { name: '', category: '', price: '', quantity: '' };

export function validateProduct(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  const price = Number(values.price);
  if (values.price === '' || Number.isNaN(price) || price <= 0) {
    errors.price = 'Enter a price greater than 0';
  }
  const qty = Number(values.quantity);
  if (values.quantity === '' || !Number.isInteger(qty) || qty < 0) {
    errors.quantity = 'Enter a whole number of 0 or more';
  }
  return errors;
}

export default function ProductForm({ initial, categories = [], onSubmit, onCancel, submitting }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues(
      initial
        ? {
            name: initial.name ?? '',
            category: initial.category ?? '',
            price: initial.price ?? '',
            quantity: initial.quantity ?? '',
          }
        : EMPTY,
    );
    setErrors({});
  }, [initial]);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateProduct(values);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Product name"
        value={values.name}
        onChange={set('name')}
        error={errors.name}
        placeholder="e.g. Chocolate Cake"
        autoFocus
        required
      />
      <div>
        <Input
          label="Category"
          list="category-options"
          value={values.category}
          onChange={set('category')}
          placeholder="e.g. Cakes"
          hint="Optional. Start typing to reuse an existing category."
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Price"
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={values.price}
          onChange={set('price')}
          error={errors.price}
          required
        />
        <Input
          label="Quantity in stock"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={values.quantity}
          onChange={set('quantity')}
          error={errors.quantity}
          required
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
