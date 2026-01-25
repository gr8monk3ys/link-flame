'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Copy, Check, Mail, AlertCircle } from 'lucide-react'
import {
  getAssignableRoles,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type Role,
} from '@/lib/teams/permissions'

/**
 * Invitation result type returned from API
 */
interface InvitationResult {
  id: string
  email: string
  role: string
  expiresAt: string
  invitationLink: string
}

/**
 * Props for InviteMemberModal component
 */
interface InviteMemberModalProps {
  organizationId: string
  currentUserRole: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvitationSent?: (invitation: InvitationResult) => void
}

/**
 * InviteMemberModal component for inviting new team members
 */
export function InviteMemberModal({
  organizationId,
  currentUserRole,
  open,
  onOpenChange,
  onInvitationSent,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null)
  const [copied, setCopied] = useState(false)

  const assignableRoles = getAssignableRoles(currentUserRole)

  /**
   * Reset form state
   */
  const resetForm = () => {
    setEmail('')
    setRole('')
    setError(null)
    setInvitationResult(null)
    setCopied(false)
  }

  /**
   * Handle modal close
   */
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    if (!role) {
      setError('Please select a role')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          email: email.trim().toLowerCase(),
          role,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to send invitation')
      }

      setInvitationResult(data.data.invitation)
      onInvitationSent?.(data.data.invitation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Copy invitation link to clipboard
   */
  const handleCopyLink = async () => {
    if (!invitationResult?.invitationLink) return

    try {
      await navigator.clipboard.writeText(invitationResult.invitationLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  /**
   * Format expiration date
   */
  const formatExpirationDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {!invitationResult ? (
          <>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization. They will receive an email
                with a link to accept the invitation.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((roleOption) => (
                      <SelectItem key={roleOption} value={roleOption}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {ROLE_LABELS[roleOption as Role]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {role && (
                  <p className="text-sm text-muted-foreground">
                    {ROLE_DESCRIPTIONS[role as Role]}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 size-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invitation Sent</DialogTitle>
              <DialogDescription>
                The invitation has been created successfully. Share the link below with{' '}
                {invitationResult.email}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Invitation Link</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-8"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 size-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 size-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="break-all text-sm text-muted-foreground">
                    {invitationResult.invitationLink}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{invitationResult.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">
                    {ROLE_LABELS[invitationResult.role as Role] || invitationResult.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium">
                    {formatExpirationDate(invitationResult.expiresAt)}
                  </span>
                </div>
              </div>

              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <p>
                  Note: The invitation link will expire in 7 days. The recipient must
                  sign in with the email address <strong>{invitationResult.email}</strong>{' '}
                  to accept the invitation.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => resetForm()} variant="outline">
                Invite Another
              </Button>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
