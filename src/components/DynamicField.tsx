import type { FieldConfig } from "@/lib/formFields";

/** Renders one form field from a FieldConfig, name-spaced with `prefix` (e.g. "fase1."). */
export default function DynamicField({
  field,
  prefix,
  defaultValue,
}: {
  field: FieldConfig;
  prefix: string;
  defaultValue?: unknown;
}) {
  const name = `${prefix}${field.name}`;
  const dv = typeof defaultValue === "string" || typeof defaultValue === "number" ? defaultValue : undefined;

  return (
    <div>
      <label className="label" htmlFor={name}>
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          required={field.required}
          placeholder={field.placeholder}
          defaultValue={dv as string | undefined}
          rows={3}
          className="input"
        />
      ) : field.type === "select" ? (
        <select id={name} name={name} required={field.required} defaultValue={dv as string | undefined} className="input">
          <option value="">Selecione...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          required={field.required}
          placeholder={field.placeholder}
          defaultValue={dv as string | number | undefined}
          className="input"
        />
      )}
      {field.help && <p className="mt-1 text-xs text-slate-400">{field.help}</p>}
    </div>
  );
}
