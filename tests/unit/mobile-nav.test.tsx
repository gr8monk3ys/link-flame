import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';

import { MobileNav } from '@/components/mobile-nav';

const items = [
  { title: 'Blog', href: '/blogs' },
  { title: 'Shop', items: [{ title: 'All Products', href: '/products' }] },
];

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open menu
      </button>
      {open && <MobileNav items={items} onClose={() => setOpen(false)} />}
    </>
  );
}

describe('MobileNav', () => {
  it('moves focus into the dialog and returns it to the trigger on Escape', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open menu' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab inside the dialog', () => {
    render(<MobileNav items={items} onClose={vi.fn()} />);
    const close = screen.getByRole('button', { name: 'Close menu' });
    const lastLink = screen.getByRole('link', { name: 'All Products' });

    lastLink.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(lastLink).toHaveFocus();
  });
});
