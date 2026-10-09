import { FABRICS, FINISHES } from "@/lib/catalog";
import type { Configuration, Product } from "@/lib/contracts";

export function ProductSketch({ product, configuration }: { product?: Product; configuration: Configuration }) {
  const wood = FINISHES.find(finish => finish.id === configuration.finish)!.colour;
  const fabric = FABRICS.find(item => item.id === configuration.fabric)!.colour;
  const category = product?.category;
  const wide = product?.id === "span-180" || product?.id === "wide-shelf";
  return <svg viewBox="0 0 120 90" aria-hidden="true" className="product-sketch">
    <ellipse cx="61" cy="76" rx="42" ry="5" fill="#242922" opacity=".07" />
    {!product && <g fill="none" stroke="#aaa89e" strokeWidth="1.5"><circle cx="60" cy="45" r="17" /><path d="m49 56 22-22" /></g>}
    {category === "desk" && <g stroke="#514333" strokeWidth=".7" strokeLinejoin="round">
      <path d="M25 40 31 43 29 74 24 72Z M86 33 91 34 95 65 91 66Z M84 51 89 50 91 76 86 77Z M40 27 44 28 42 58 38 57Z" fill={wood} />
      <path d={wide ? "M11 34 73 20 109 37 45 55Z" : "M17 33 75 20 104 37 44 51Z"} fill={wood} />
      <path d={wide ? "M11 34 45 51 109 37 109 42 45 59 11 40Z" : "M17 33 44 47 104 33 104 39 44 54 17 39Z"} fill={wood} />
      {product?.id === "studio-140" && <path d="m53 53 24-6v8l-24 6Z" fill={wood} />}
      <path d="m46 54 57-15" opacity=".2" />
    </g>}
    {category === "chair" && <g stroke="#3f463b" strokeWidth=".65" strokeLinejoin="round">
      <path d="M42 53 40 75 44 77 49 56 M71 54 76 77 80 76 76 53 M47 49 48 68 M77 45 82 65" fill={wood} />
      <path d="M39 19Q59 8 79 20L81 44Q61 55 41 44Z" fill={fabric} />
      <path d="M35 49Q53 37 82 47L88 56Q60 69 36 57Z" fill={fabric} />
      {product?.id !== "arc-chair" && <path d="M34 35 33 48 41 53M82 33 86 44 81 49" stroke={wood} strokeWidth="5" fill="none" />}
      <path d="M43 23q16-8 30-1M42 51q18-6 36 0" opacity=".18" fill="none" />
    </g>}
    {category === "lamp" && <g stroke="#41483f" strokeWidth=".7" strokeLinejoin="round">
      <ellipse cx="62" cy="72" rx="20" ry="6" fill="#52594e" />
      <path d="M60 34h4v35h-4z" fill="#858871" />
      {product?.id === "halo-lamp" ? <><path d="M35 35a27 27 0 0 1 54 0Z" fill="#a9ad97" /><ellipse cx="62" cy="35" rx="27" ry="5" fill="#dfd8bb" /></> : <><path d="m61 35 17-17" fill="none" strokeWidth="4" /><path d="m67 15 16-5 13 15-31 11Z" fill="#8b957e" /><path d="m65 36 31-11" stroke="#ddd2ac" strokeWidth="3" /></>}
    </g>}
    {category === "storage" && <g stroke="#63543f" strokeWidth=".8" strokeLinejoin="round">
      <path d={wide ? "M20 27 88 22 101 29 31 35Z M20 27 31 35 31 74 20 65Z M31 35 101 29 101 67 31 74Z" : "M35 13 72 7 87 14 49 22Z M35 13 49 22 49 78 35 67Z M49 22 87 14 87 68 49 78Z"} fill={wood} />
      {wide ? <><path d="m35 39 29-3v30l-29 3ZM69 36l28-3v28l-28 4Z" fill="#665b48" opacity=".5" /><path d="m35 54 62-7" stroke={wood} strokeWidth="4" /></> : <><path d="m53 25 30-6v45l-30 8Z" fill="#655740" opacity=".45" /><path d="m51 40 33-7M51 57l33-7" stroke={wood} strokeWidth="4" /><path d="m56 36 3-1v-9l-3 1ZM61 35l4-1v-9l-4 1Z" fill="#e9e2d0" /><path d="m68 51 10-2v-8l-10 2Z" fill="#8d977f" /></>}
    </g>}
  </svg>;
}
