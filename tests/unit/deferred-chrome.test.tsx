import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { toast } from 'sonner'
import { DeferredChrome } from '@/components/layout/deferred-chrome'

describe('DeferredChrome', () => {
  it('shows a toast fired before the browser goes idle', async () => {
    render(<DeferredChrome />)

    act(() => {
      toast.success('Gift card applied')
    })

    expect(await screen.findByText('Gift card applied')).toBeInTheDocument()
  })
})
