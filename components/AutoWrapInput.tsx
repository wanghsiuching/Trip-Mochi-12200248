import React, { useCallback, useLayoutEffect, useRef } from 'react';

export interface AutoWrapInputProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'onChange' | 'onKeyDown'
  > {
  value?: string | number | readonly string[];
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  allowNewlines?: boolean;
  /** Compatibility placeholder if an existing input JSX passes type="text" */
  type?: string;
}

/**
 * Drop-in text input that looks identical to a single-line <input> when text fits,
 * and automatically wraps to multiple lines & grows vertically when text exceeds the field width.
 */
export const AutoWrapInput = React.forwardRef<HTMLTextAreaElement, AutoWrapInputProps>(
  (
    {
      className = '',
      value,
      defaultValue,
      onChange,
      onKeyDown,
      allowNewlines = false,
      style,
      type: _ignoredType,
      rows = 1,
      ...rest
    },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const adjustHeight = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, []);

    useLayoutEffect(() => {
      adjustHeight();
    }, [value, defaultValue, adjustHeight]);

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      let rafId = requestAnimationFrame(() => adjustHeight());
      let ro: ResizeObserver | undefined;

      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => {
          adjustHeight();
        });
        ro.observe(el);
      }

      const handleWinResize = () => adjustHeight();
      window.addEventListener('resize', handleWinResize);

      return () => {
        cancelAnimationFrame(rafId);
        ro?.disconnect();
        window.removeEventListener('resize', handleWinResize);
      };
    }, [adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      requestAnimationFrame(() => adjustHeight());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !allowNewlines && !e.nativeEvent.isComposing && e.keyCode !== 229) {
        e.preventDefault();
      }
      onKeyDown?.(e);
    };

    return (
      <textarea
        ref={setRefs}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`resize-none overflow-hidden break-words min-w-0 leading-snug ${className}`}
        style={{ ...style, height: 'auto' }}
        {...rest}
      />
    );
  }
);

AutoWrapInput.displayName = 'AutoWrapInput';
