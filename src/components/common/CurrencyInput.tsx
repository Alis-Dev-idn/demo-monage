import { useCallback, useState, type ChangeEvent } from "react";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  ariaLabel?: string;
  className?: string;
  /**
   * Aktifkan kalkulator sederhana: user bisa ketik ekspresi seperti
   * `10000+5000` atau `25000x3` dan nilainya dihitung otomatis (#10).
   */
  allowCalc?: boolean;
}

function formatDisplay(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return new Intl.NumberFormat("id-ID").format(n);
}

function parseInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

const OPERATORS = new Set(["+", "-", "*", "/"]);

/**
 * Evaluator ekspresi aritmetika sederhana (tanpa `eval`). Dukung + - * / dan
 * `x`/`X` sebagai kali. Tanpa kurung. Mengembalikan `null` bila tak valid.
 */
function evalExpression(raw: string): number | null {
  const s = raw
    .replace(/[xX]/g, "*")
    .replace(/\s+/g, "")
    .replace(/[^0-9+\-*/.]/g, "");
  if (!s) return null;

  const tokens = s.match(/(\d+\.?\d*|[+\-*/])/g);
  if (!tokens) return null;

  // Buang operator menggantung di akhir (mis. "100+").
  while (tokens.length > 0 && OPERATORS.has(tokens[tokens.length - 1]!)) {
    tokens.pop();
  }
  if (tokens.length === 0) return null;
  // Token pertama harus angka.
  if (OPERATORS.has(tokens[0]!)) return null;

  // Pisahkan jadi angka & operator berselang-seling.
  const nums: number[] = [];
  const ops: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    if (i % 2 === 0) {
      if (OPERATORS.has(t)) return null;
      nums.push(Number(t));
    } else {
      if (!OPERATORS.has(t)) return null;
      ops.push(t);
    }
  }

  // Pass 1: * dan /
  for (let i = 0; i < ops.length; ) {
    if (ops[i] === "*" || ops[i] === "/") {
      const a = nums[i]!;
      const b = nums[i + 1]!;
      const r = ops[i] === "*" ? a * b : b === 0 ? null : a / b;
      if (r === null || !Number.isFinite(r)) return null;
      nums.splice(i, 2, r);
      ops.splice(i, 1);
    } else {
      i++;
    }
  }
  // Pass 2: + dan -
  let acc = nums[0]!;
  for (let i = 0; i < ops.length; i++) {
    acc = ops[i] === "+" ? acc + nums[i + 1]! : acc - nums[i + 1]!;
  }
  return Number.isFinite(acc) ? Math.round(acc) : null;
}

export function CurrencyInput({
  value,
  onChange,
  min = 0,
  max = 999_999_999_999,
  placeholder = "0",
  autoFocus,
  disabled,
  id,
  name,
  ariaLabel,
  className = "",
  allowCalc = false,
}: CurrencyInputProps) {
  // Saat allowCalc: simpan teks mentah selama fokus agar user bisa ketik
  // operator; di luar fokus tampilkan nilai terformat.
  const [expr, setExpr] = useState<string | null>(null);

  const clamp = useCallback(
    (n: number) => Math.max(min, Math.min(max, n)),
    [min, max],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (allowCalc) {
        setExpr(v);
        const result = evalExpression(v);
        if (result !== null) onChange(clamp(result));
        return;
      }
      onChange(clamp(parseInput(v)));
    },
    [allowCalc, clamp, onChange],
  );

  const hasOperator = !!expr && /[+\-*/xX]/.test(expr);
  const calcPreview =
    allowCalc && hasOperator ? evalExpression(expr!) : null;

  const display =
    allowCalc && expr !== null ? expr : formatDisplay(value);

  return (
    <div className={className}>
      <div className="flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
        <span className="mr-2 select-none text-sm font-medium text-neutral-500">Rp</span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode={allowCalc ? "text" : "numeric"}
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={display}
          placeholder={placeholder}
          aria-label={ariaLabel ?? "Nominal dalam rupiah"}
          onChange={handleChange}
          onFocus={() => {
            if (allowCalc) setExpr(value ? String(value) : "");
          }}
          onBlur={() => {
            if (!allowCalc) return;
            const result = evalExpression(expr ?? "");
            if (result !== null) onChange(clamp(result));
            setExpr(null); // kembali ke tampilan terformat
          }}
          className="w-full bg-transparent text-right text-base tabular-nums outline-none disabled:text-neutral-400"
        />
      </div>
      {calcPreview !== null && (
        <p className="mt-1 text-right text-xs text-emerald-600">
          = Rp {formatDisplay(calcPreview) || "0"}
        </p>
      )}
    </div>
  );
}
