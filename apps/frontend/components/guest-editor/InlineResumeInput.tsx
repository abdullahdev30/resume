"use client";
import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
export function InlineResumeInput({
  target,
  label,
  value,
  multiline,
  onChange,
  onClose,
}: {
  target: HTMLElement;
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value);
  const [style, setStyle] = useState<CSSProperties>({});
  const input = useRef<HTMLTextAreaElement>(null);
  const original = useRef(value);
  useLayoutEffect(() => {
    const measure = () => {
      if (!target.isConnected) return;
      const box = target.getBoundingClientRect();
      const computed = getComputedStyle(target);
      const page = target.closest(".resume-page");
      const pageBox = page?.getBoundingClientRect();
      const natural = target.offsetWidth ? box.width / target.offsetWidth : 1;
      let backgroundColor = '#ffffff';
      for(let element:HTMLElement|null=target;element;element=element.parentElement){
        const color=getComputedStyle(element).backgroundColor;
        if(color!=='transparent'&&color!=='rgba(0, 0, 0, 0)'){backgroundColor=color;break;}
      }
      setStyle({
        position: "fixed",
        left: box.left,
        top: box.top,
        width: Math.min(
          Math.max(box.width, 120),
          (pageBox?.right || window.innerWidth) - box.left - 4,
        ),
        height: Math.max(box.height + 8, multiline ? 64 : 32),
        fontFamily: computed.fontFamily,
        fontSize: `${parseFloat(computed.fontSize) * natural}px`,
        fontWeight: computed.fontWeight,
        fontStyle: computed.fontStyle,
        textAlign: computed.textAlign as CSSProperties["textAlign"],
        lineHeight:
          computed.lineHeight === "normal"
            ? "normal"
            : `${parseFloat(computed.lineHeight) * natural}px`,
        color: computed.color,
        backgroundColor,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    input.current?.focus();
    input.current?.select();
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [target, multiline]);
  return (
    <textarea
      ref={input}
      className="guest-inline-input"
      style={style}
      aria-label={label}
      value={text}
      rows={multiline ? 3 : 1}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = multiline
          ? e.target.value
          : e.target.value.replace(/\n/g, " ");
        setText(next);
        onChange(next);
        e.target.style.height = `${Math.max(e.target.scrollHeight, 32)}px`;
      }}
      onBlur={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onChange(original.current);
          onClose();
        } else if (
          e.key === "Enter" &&
          (!multiline || e.ctrlKey || e.metaKey)
        ) {
          e.preventDefault();
          onClose();
        }
      }}
    />
  );
}
